import { Booking, type Timing } from './booking.ts'
import { Colour } from './colour.ts'

/** What makes a time block: what the Organizer gives, and what the schedule file holds. */
export interface TimeBlockDescription extends Timing {
  readonly title?: string | undefined
  /** What it is filled with; grey when absent. */
  readonly colour?: Colour | undefined
}

/**
 * A recurring time the Organizer is not available for meetings: no meeting can be booked in it.
 * It is held, like a meeting, weekly or bi-weekly, for as long as it is in the schedule.
 */
export class TimeBlock extends Booking implements TimeBlockDescription {
  /** What the time block is for, in the Organizer's words; absent when they give none. */
  readonly title: string | undefined
  /** What it is filled with: grey, unless the Organizer chooses another colour. */
  readonly colour: Colour

  /**
   * Throws a RangeError for a time block that does not fit within the day. The title is taken
   * without its leading and trailing spaces; an empty title is none. Without a colour, it is grey.
   */
  constructor(description: TimeBlockDescription) {
    super(description, true)
    const title = description.title?.trim()
    this.title = title === '' ? undefined : title
    this.colour = description.colour ?? Colour.grey
  }

  /** The same time block, changed as said. */
  afterChanging(changes: Partial<TimeBlockDescription>): TimeBlock {
    return new TimeBlock({ ...this.description, ...changes })
  }

  /** The same time block, on another weekday and at another start, lasting as long. */
  override afterMovingTo(...where: Parameters<Booking['afterMovingTo']>): TimeBlock {
    return super.afterMovingTo(...where) as TimeBlock
  }

  /** The same time block, starting as it does and lasting that long. */
  override afterResizingTo(...how: Parameters<Booking['afterResizingTo']>): TimeBlock {
    return super.afterResizingTo(...how) as TimeBlock
  }

  /** What makes this time block. */
  get description(): TimeBlockDescription {
    return { ...this.timing, title: this.title, colour: this.colour }
  }
}
