import type { Booking } from './booking.ts'
import type { Cadence, Week } from './cadence.ts'
import { overlap } from './findings.ts'
import { Meeting } from './meeting.ts'
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

/** What the Organizer plans: meetings and time blocks, no two of which overlap. */
export class Schedule {
  readonly meetings: readonly Meeting[]
  readonly timeBlocks: readonly TimeBlock[]

  /** Throws an OverlapError when two of the bookings overlap. */
  constructor(meetings: readonly Meeting[] = [], timeBlocks: readonly TimeBlock[] = []) {
    const pair = Schedule.firstOverlapAmong([...meetings, ...timeBlocks])
    if (pair !== undefined) {
      throw new OverlapError(pair[0], pair[1])
    }
    this.meetings = [...meetings]
    this.timeBlocks = [...timeBlocks]
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

  /** Whether the schedule holds no booking. */
  get isEmpty(): boolean {
    return this.meetings.length === 0 && this.timeBlocks.length === 0
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
      return new Schedule([...this.meetings, booking], this.timeBlocks)
    }
    return new Schedule(this.meetings, [...this.timeBlocks, timeBlockOf(booking)])
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
      )
    }
    const block = timeBlockOf(booking)
    const blocks = this.timeBlocks.with(rankIn(this.timeBlocks, block), timeBlockOf(changed))
    return new Schedule(this.meetings, blocks)
  }

  /** The schedule without the booking. Throws a RangeError for a booking it does not hold. */
  afterRemoving(booking: Booking): Schedule {
    if (booking instanceof Meeting) {
      rankIn(this.meetings, booking)
      return new Schedule(
        this.meetings.filter((each) => each !== booking),
        this.timeBlocks,
      )
    }
    rankIn(this.timeBlocks, timeBlockOf(booking))
    return new Schedule(
      this.meetings,
      this.timeBlocks.filter((each) => each !== booking),
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
