import type { Cadence, Parity } from './cadence.ts'
import { overlap } from './findings.ts'
import type { Meeting } from './meeting.ts'
import type { TimeOfDay } from './time-of-day.ts'
import type { Weekday } from './weekday.ts'

/** Two meetings that would take the same slot in the same week. */
export class OverlapError extends RangeError {
  readonly meeting: Meeting
  readonly other: Meeting

  constructor(meeting: Meeting, other: Meeting) {
    super(overlap(meeting, other))
    this.name = 'OverlapError'
    this.meeting = meeting
    this.other = other
  }
}

/** What the Organizer plans: meetings, no two of which overlap. */
export class Schedule {
  readonly meetings: readonly Meeting[]

  /** Throws an OverlapError when two of the meetings overlap. */
  constructor(meetings: readonly Meeting[] = []) {
    const pair = Schedule.firstOverlapAmong(meetings)
    if (pair !== undefined) {
      throw new OverlapError(pair[0], pair[1])
    }
    this.meetings = [...meetings]
  }

  /**
   * The first meeting, in the order given, that overlaps one before it, and that one; absent when
   * none do. The meeting added last is the one that overlaps.
   */
  static firstOverlapAmong(meetings: readonly Meeting[]): readonly [Meeting, Meeting] | undefined {
    for (const [rank, meeting] of meetings.entries()) {
      const earlier = meetings.slice(0, rank).find((before) => before.overlaps(meeting))
      if (earlier !== undefined) {
        return [meeting, earlier]
      }
    }
    return undefined
  }

  /** Whether the schedule holds no meeting. */
  get isEmpty(): boolean {
    return this.meetings.length === 0
  }

  /**
   * The meeting of the schedule the candidate would overlap, or absent when it overlaps none. The
   * meeting the candidate replaces, when it replaces one, is not counted.
   */
  overlapOf(candidate: Meeting, replaced?: Meeting): Meeting | undefined {
    return this.meetings.find((meeting) => meeting !== replaced && meeting.overlaps(candidate))
  }

  /** The meetings held in the week of that parity. */
  meetingsHeldIn(parity: Parity): readonly Meeting[] {
    return this.meetings.filter((meeting) => meeting.isHeldIn(parity))
  }

  /**
   * Whether no meeting takes the quarter at that time, on that weekday, in any week of the
   * cadence; the meeting set aside, when one is, is not counted.
   */
  isFree(weekday: Weekday, time: TimeOfDay, cadence: Cadence, setAside?: Meeting): boolean {
    return !this.meetings.some(
      (meeting) =>
        meeting !== setAside &&
        cadence.weeks.some((parity) => meeting.takes(weekday, time, parity)),
    )
  }

  /** The schedule with the meeting added. Throws an OverlapError when it overlaps another. */
  afterAdding(meeting: Meeting): Schedule {
    return new Schedule([...this.meetings, meeting])
  }

  /**
   * The schedule with the meeting replaced by its changed copy, in its place. Throws an
   * OverlapError when the copy overlaps another meeting, and a RangeError for a meeting the
   * schedule does not hold.
   */
  afterReplacing(meeting: Meeting, changed: Meeting): Schedule {
    const rank = this.rankOf(meeting)
    return new Schedule(this.meetings.with(rank, changed))
  }

  /** The schedule without the meeting. Throws a RangeError for a meeting it does not hold. */
  afterRemoving(meeting: Meeting): Schedule {
    this.rankOf(meeting)
    return new Schedule(this.meetings.filter((each) => each !== meeting))
  }

  private rankOf(meeting: Meeting): number {
    const rank = this.meetings.indexOf(meeting)
    if (rank < 0) {
      throw new RangeError(`The schedule does not hold the meeting ${meeting.title}`)
    }
    return rank
  }
}
