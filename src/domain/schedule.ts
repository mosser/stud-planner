import type { Booking } from './booking.ts'
import type { Cadence, Week } from './cadence.ts'
import { nameTaken, notAParticipant, overlap } from './findings.ts'
import { Meeting } from './meeting.ts'
import { Participant } from './participant.ts'
import { TimeBlock } from './time-block.ts'
import type { TimeOfDay } from './time-of-day.ts'
import type { Weekday } from './weekday.ts'

/** Two bookings that would take the same slot in the same week. */
export class OverlapError extends RangeError {
  readonly booking: Booking
  readonly other: Booking

  constructor(booking: Booking, other: Booking) {
    super(overlap(booking, other))
    this.name = 'OverlapError'
    this.booking = booking
    this.other = other
  }
}

/**
 * What the Organizer plans: meetings and time blocks, no two of which overlap, and the
 * participants the meetings are with. No participant is ever in two meetings at once, since no
 * two meetings overlap.
 */
export class Schedule {
  readonly meetings: readonly Meeting[]
  readonly timeBlocks: readonly TimeBlock[]
  /** The participants of the schedule, in the order they were added; no two share a name. */
  readonly participants: readonly Participant[]

  /**
   * Throws an OverlapError when two of the bookings overlap, and a RangeError when two
   * participants share a name or a meeting names someone who is not a participant.
   */
  constructor(
    meetings: readonly Meeting[] = [],
    timeBlocks: readonly TimeBlock[] = [],
    participants: readonly Participant[] = [],
  ) {
    const named = participants.find((participant, rank) =>
      participants.slice(0, rank).some((before) => before.isNamed(participant.name)),
    )
    if (named !== undefined) {
      throw new RangeError(nameTaken(named.name))
    }
    const stranger = meetings
      .flatMap((meeting) => meeting.participants)
      .find((participant) => !participants.includes(participant))
    if (stranger !== undefined) {
      throw new RangeError(notAParticipant(stranger.name))
    }
    const pair = Schedule.firstOverlapAmong([...meetings, ...timeBlocks])
    if (pair !== undefined) {
      throw new OverlapError(pair[0], pair[1])
    }
    this.meetings = [...meetings]
    this.timeBlocks = [...timeBlocks]
    this.participants = [...participants]
  }

  /**
   * The first booking, in the order given, that overlaps one before it, and that one; absent when
   * none do. The booking added last is the one that overlaps.
   */
  static firstOverlapAmong(bookings: readonly Booking[]): readonly [Booking, Booking] | undefined {
    for (const [rank, booking] of bookings.entries()) {
      const earlier = bookings.slice(0, rank).find((before) => before.overlaps(booking))
      if (earlier !== undefined) {
        return [booking, earlier]
      }
    }
    return undefined
  }

  /** Every booking: the meetings, then the time blocks. */
  get bookings(): readonly Booking[] {
    return [...this.meetings, ...this.timeBlocks]
  }

  /** Whether the schedule holds no booking and no participant. */
  get isEmpty(): boolean {
    return (
      this.meetings.length === 0 && this.timeBlocks.length === 0 && this.participants.length === 0
    )
  }

  /** The meetings the participant takes part in. */
  meetingsOf(participant: Participant): readonly Meeting[] {
    return this.meetings.filter((meeting) => meeting.hasParticipant(participant))
  }

  /** The participant of the schedule with that name, whatever its case; absent when none. */
  participantNamed(name: string): Participant | undefined {
    return this.participants.find((participant) => participant.isNamed(name))
  }

  /**
   * The schedule with a participant of that name added. Throws a RangeError for a name without a
   * letter, or one another participant has.
   */
  afterAddingParticipant(name: string): Schedule {
    const participants = [...this.participants, new Participant(name)]
    return new Schedule(this.meetings, this.timeBlocks, participants)
  }

  /**
   * The schedule with the participant renamed, in every meeting they take part in. Throws a
   * RangeError for a name another participant has, or a participant the schedule does not hold.
   */
  afterRenaming(participant: Participant, name: string): Schedule {
    const renamed = new Participant(name)
    const swap = (each: Participant) => (each === participant ? renamed : each)
    return this.afterChangingParticipants(participant, swap)
  }

  /** The schedule without the participant, who leaves every meeting they take part in. */
  afterRemovingParticipant(participant: Participant): Schedule {
    return this.afterChangingParticipants(participant, (each) =>
      each === participant ? undefined : each,
    )
  }

  /** The schedule with a participant replaced, or removed, in the list and in every meeting. */
  private afterChangingParticipants(
    participant: Participant,
    change: (each: Participant) => Participant | undefined,
  ): Schedule {
    if (!this.participants.includes(participant)) {
      throw new RangeError(notAParticipant(participant.name))
    }
    const changed = (list: readonly Participant[]) =>
      list.map(change).filter((each): each is Participant => each !== undefined)
    const meetings = this.meetings.map((meeting) =>
      meeting.hasParticipant(participant)
        ? meeting.afterChanging({ participants: changed(meeting.participants) })
        : meeting,
    )
    return new Schedule(meetings, this.timeBlocks, changed(this.participants))
  }

  /**
   * The booking of the schedule the candidate would overlap, or absent when it overlaps none. The
   * booking the candidate replaces, when it replaces one, is not counted.
   */
  overlapOf(candidate: Booking, replaced?: Booking): Booking | undefined {
    return this.bookings.find((booking) => booking !== replaced && booking.overlaps(candidate))
  }

  /** The meetings held in the week of that week. */
  meetingsHeldIn(week: Week): readonly Meeting[] {
    return this.meetings.filter((meeting) => meeting.isHeldIn(week))
  }

  /**
   * Whether no booking takes the quarter at that time, on that weekday, in any week of the
   * cadence; the booking set aside, when one is, is not counted.
   */
  isFree(weekday: Weekday, time: TimeOfDay, cadence: Cadence, setAside?: Booking): boolean {
    return !this.bookings.some(
      (booking) =>
        booking !== setAside && cadence.weeks.some((week) => booking.takes(weekday, time, week)),
    )
  }

  /** The schedule with the booking added. Throws an OverlapError when it overlaps another. */
  afterAdding(booking: Booking): Schedule {
    if (booking instanceof Meeting) {
      return new Schedule([...this.meetings, booking], this.timeBlocks, this.participants)
    }
    return new Schedule(
      this.meetings,
      [...this.timeBlocks, timeBlockOf(booking)],
      this.participants,
    )
  }

  /**
   * The schedule with the booking replaced by its changed copy, in its place. Throws an
   * OverlapError when the copy overlaps another booking, and a RangeError for a booking the
   * schedule does not hold or a copy of another kind.
   */
  afterReplacing(booking: Booking, changed: Booking): Schedule {
    if (booking instanceof Meeting && changed instanceof Meeting) {
      return new Schedule(
        this.meetings.with(rankIn(this.meetings, booking), changed),
        this.timeBlocks,
        this.participants,
      )
    }
    const block = timeBlockOf(booking)
    const blocks = this.timeBlocks.with(rankIn(this.timeBlocks, block), timeBlockOf(changed))
    return new Schedule(this.meetings, blocks, this.participants)
  }

  /** The schedule without the booking. Throws a RangeError for a booking it does not hold. */
  afterRemoving(booking: Booking): Schedule {
    if (booking instanceof Meeting) {
      rankIn(this.meetings, booking)
      return new Schedule(
        this.meetings.filter((each) => each !== booking),
        this.timeBlocks,
        this.participants,
      )
    }
    rankIn(this.timeBlocks, timeBlockOf(booking))
    return new Schedule(
      this.meetings,
      this.timeBlocks.filter((each) => each !== booking),
      this.participants,
    )
  }
}

function timeBlockOf(booking: Booking): TimeBlock {
  if (!(booking instanceof TimeBlock)) {
    throw new RangeError('A meeting cannot take the place of a time block, nor the reverse')
  }
  return booking
}

function rankIn<T extends Booking>(bookings: readonly T[], booking: T): number {
  const rank = bookings.indexOf(booking)
  if (rank < 0) {
    throw new RangeError('The schedule does not hold this booking')
  }
  return rank
}
