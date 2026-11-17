import { Booking, type Timing } from './booking.ts'

/** What makes a time block: what the Organizer gives, and what the schedule file holds. */
export interface TimeBlockDescription extends Timing {
  readonly title?: string | undefined
}

/**
 * A recurring time the Organizer is not available for meetings: no meeting can be booked in it.
 * It is held, like a meeting, weekly or bi-weekly, for as long as it is in the schedule.
 */
export class TimeBlock extends Booking implements TimeBlockDescription {
  /** What the time block is for, in the Organizer's words; absent when they give none. */
  readonly title: string | undefined

  /**
   * Throws a RangeError for a time block that does not fit within the day. The title is taken
   * without its leading and trailing spaces; an empty title is none.
   */
  constructor(description: TimeBlockDescription) {
    super(description, true)
    const title = description.title?.trim()
    this.title = title === '' ? undefined : title
  }

  /** The same time block, changed as said. */
  afterChanging(changes: Partial<TimeBlockDescription>): TimeBlock {
    return new TimeBlock({ ...this.description, ...changes })
  }

  /** What makes this time block. */
  get description(): TimeBlockDescription {
    return { ...this.timing, title: this.title }
  }
}
