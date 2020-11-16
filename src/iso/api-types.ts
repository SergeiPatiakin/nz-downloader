import * as t from 'io-ts'

export type RuleType = 'filename-starts-with' | 'filename-matches-regex'
export const RuleTypeCodec = t.union([t.literal('filename-starts-with'), t.literal('filename-matches-regex')])

export type Rule = {
  id: number
  type: RuleType
  operand: string
  destinationPath: string
}

export const RuleCodec = t.type({
  id: t.number,
  type: RuleTypeCodec,
  operand: t.string,
  destinationPath: t.string,
})

export type MailboxCursor = {
  type: 'date'
  dateString: string
} | {
  type: 'uid'
  lastSeenUid: number
  lastSeenDatetime: string
}

export const MailboxCursorCodec = t.union([
  t.type({
    type: t.literal('date'),
    dateString: t.string,
  }),
  t.type({
    type: t.literal('uid'),
    lastSeenUid: t.number,
    lastSeenDatetime: t.string,
  }),
])

export type MailboxConfiguration = {
  emailAddress: string
  password: string
  imapHost: string
  imapPort: number
  fromFilter: string
  subjectFilter: string
  cursor: MailboxCursor
}

export const MailConfigurationCodec = t.type({
  emailAddress: t.string,
  password: t.string,
  imapHost: t.string,
  imapPort: t.number,
  fromFilter: t.string,
  subjectFilter: t.string,
  cursor: MailboxCursorCodec,
})

export type DatabaseState = {
  migrationVersion: number
  initCount: number
  mailboxConfiguration: MailboxConfiguration
  rules: Rule[]
  ruleIdSeq: number
}

export const DatabaseStateCodec = t.type({
  migrationVersion: t.number,
  initCount: t.number,
  mailboxConfiguration: MailConfigurationCodec,
  rules: t.array(RuleCodec),
  ruleIdSeq: t.number,
})

export type ImapTestResult = {
  success: boolean
  text: string
}

export type SaveLocation = {
  directoryPath: string
  filePath: string
}

export type AttachmentStatus = {
  fileName: string
  saveLocations: SaveLocation[]
}

export type EmailStatus = {
  type: 'email-status'
  from: string
  subject: string
  attachments: Array<AttachmentStatus>
}
export type ErrorStatus = {
  type: 'error',
  message: string
}
export type SuccessStatus = {
  type: 'success',
  message: string
}
export type DownloadStatus = EmailStatus | ErrorStatus | SuccessStatus

export type JobCreateParams = {
  dryRun: boolean
}

export type JobCreateResult = {
  id: number
}

export type Job = {
  id: number
  dryRun: boolean
  completed: boolean
  canceled: boolean
  messages: DownloadStatus[]
}

