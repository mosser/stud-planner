import { Booking, type Timing } from './booking.ts'
import type { Category } from './category.ts'
import { needsATitle, participantTwice } from './findings.ts'
import type { Participant } from './participant.ts'

/** What makes a meeting: what the Organizer gives, and what the schedule file holds. */
export interface MeetingDescription extends Timing {
  readonly title: string
  readonly note?: string | undefined
  readonly participants?: readonly Participant[] | undefined
  readonly category?: Category | undefined
}

/** A recurring meeting of the schedule, held for as long as it is in it. */
export class Meeting extends Booking implements MeetingDescription {
  /** What the meeting is called: not empty, without leading or trailing spaces. */
  readonly title: string
  /** Free text, never read by the system; absent when there is none. */
  readonly note: string | undefined
  /** The participants of the schedule who take part in it, each once; none, possibly. */
  readonly participants: readonly Participant[]
  /**
   * What it is about. Every meeting the Organizer adds or changes has one; one read from a
   * schedule written before categories has none until it is changed.
   */
  readonly category: Category | undefined

  /**
   * Throws a RangeError for a meeting without a title, that does not fit within the day, or that
   * names a participant twice. The title and the note are taken without their leading and
   * trailing spaces; an empty note is none.
   */
  constructor(description: MeetingDescription) {
    const title = description.title.trim()
    if (title === '') {
      throw new RangeError(needsATitle())
    }
    super(description, false)
    const participants = description.participants ?? []
    const twice = participants.find(
      (participant, rank) => participants.indexOf(participant) !== rank,
    )
    if (twice !== undefined) {
      throw new RangeError(participantTwice(twice.name))
    }
    const note = description.note?.trim()
    this.title = title
    this.note = note === '' ? undefined : note
    this.participants = [...participants]
    this.category = description.category
  }

  /** Whether the participant takes part in the meeting. */
  hasParticipant(participant: Participant): boolean {
    return this.participants.includes(participant)
  }

  /** The same meeting, changed as said. */
  afterChanging(changes: Partial<MeetingDescription>): Meeting {
    return new Meeting({ ...this.description, ...changes })
  }

  /** The same meeting, on another weekday and at another start, lasting as long. */
  override afterMovingTo(...where: Parameters<Booking['afterMovingTo']>): Meeting {
    return super.afterMovingTo(...where) as Meeting
  }

  /** The same meeting, starting as it does and lasting that long. */
  override afterResizingTo(...how: Parameters<Booking['afterResizingTo']>): Meeting {
    return super.afterResizingTo(...how) as Meeting
  }

  /** What makes this meeting. */
  get description(): MeetingDescription {
    return {
      ...this.timing,
      title: this.title,
      note: this.note,
      participants: this.participants,
      category: this.category,
    }
  }
}
