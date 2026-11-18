import { Booking, type Timing } from './booking.ts'
import type { Category } from './category.ts'
import { needsAStudent, needsATitle, participantTwice, studentOnlyOneToOne } from './findings.ts'
import type { Participant } from './participant.ts'

/** What makes a meeting: what the Organizer gives, and what the schedule file holds. */
export interface MeetingDescription extends Timing {
  /** The title of a meeting that is not one-to-one; one-to-one, it is the student's name. */
  readonly title?: string | undefined
  readonly note?: string | undefined
  readonly participants?: readonly Participant[] | undefined
  readonly category?: Category | undefined
  /** The student of a one-to-one meeting; none for any other. */
  readonly student?: Participant | undefined
}

/**
 * A recurring meeting of the schedule, held for as long as it is in it. A one-to-one meeting
 * (Master, PhD) is with a student, after whom it is named, and maybe co-supervisors; any other
 * has a title of its own, and its participants.
 */
export class Meeting extends Booking implements MeetingDescription {
  /** The title it was given; absent for a one-to-one meeting, named after its student. */
  private readonly givenTitle: string | undefined
  /** Free text, never read by the system; absent when there is none. */
  readonly note: string | undefined
  /**
   * The participants of the schedule who take part in it besides its student, each once; the
   * co-supervisors of a one-to-one meeting.
   */
  readonly participants: readonly Participant[]
  /**
   * What it is about. Every meeting the Organizer adds or changes has one; one read from a
   * schedule written before categories has none until it is changed.
   */
  readonly category: Category | undefined
  /** The student of a one-to-one meeting; absent for any other. */
  readonly student: Participant | undefined

  /**
   * Throws a RangeError for a one-to-one meeting without a student, another meeting with a
   * student or without a title, a meeting that does not fit within the day, or that names a
   * participant twice. A title and a note are taken without their leading and trailing spaces;
   * an empty note is none.
   */
  constructor(description: MeetingDescription) {
    const isOneToOne = description.category?.isOneToOne === true
    const title = description.title?.trim() ?? ''
    if (isOneToOne && description.student === undefined) {
      throw new RangeError(needsAStudent())
    }
    if (!isOneToOne && description.student !== undefined) {
      throw new RangeError(studentOnlyOneToOne())
    }
    if (!isOneToOne && title === '') {
      throw new RangeError(needsATitle())
    }
    super(description, false)
    const participants = description.participants ?? []
    const everyone =
      description.student === undefined ? participants : [description.student, ...participants]
    const twice = everyone.find((participant, rank) => everyone.indexOf(participant) !== rank)
    if (twice !== undefined) {
      throw new RangeError(participantTwice(twice.name))
    }
    const note = description.note?.trim()
    this.givenTitle = isOneToOne ? undefined : title
    this.note = note === '' ? undefined : note
    this.participants = [...participants]
    this.category = description.category
    this.student = description.student
  }

  /** What the meeting is called: its student's name when one-to-one, its title otherwise. */
  get title(): string {
    return this.student?.name ?? this.givenTitle ?? ''
  }

  /** Whether the participant takes part in the meeting, as its student or otherwise. */
  hasParticipant(participant: Participant): boolean {
    return this.student === participant || this.participants.includes(participant)
  }

  /** Everyone who takes part in the meeting: its student first, when it has one. */
  get everyone(): readonly Participant[] {
    return this.student === undefined ? this.participants : [this.student, ...this.participants]
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
      title: this.givenTitle,
      note: this.note,
      participants: this.participants,
      category: this.category,
      student: this.student,
    }
  }
}
