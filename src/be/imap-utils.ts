import { MailboxCursor } from "../iso/api-types"

export const getSearchCriteria = (opts: {
  fromFilter: string
  subjectFilter: string
  cursor: MailboxCursor
}): Array<[string, string]> => {
  const searchCriteria: Array<[string, string]> = []
  if (opts.fromFilter) {
    searchCriteria.push(['FROM', opts.fromFilter])
  }
  if (opts.subjectFilter) {
    searchCriteria.push(['SUBJECT', opts.subjectFilter])
  }

  if (opts.cursor.type === 'date') {
    searchCriteria.push(['SINCE', opts.cursor.dateString])
  } else {
    const uidRangeString = `${opts.cursor.lastSeenUid + 1}:*`
    searchCriteria.push(['UID', uidRangeString])
  }
  return searchCriteria
}
