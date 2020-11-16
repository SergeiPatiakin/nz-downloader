import { getSearchCriteria } from "../be/imap-utils"
import { MailboxConfiguration } from "../iso/api-types"

describe('getSearchCriteria', () => {
  it('date cursor', () => {
    expect(getSearchCriteria({
      fromFilter: 'abc',
      subjectFilter: 'def',
      cursor: {
        type: 'date',
        dateString: '2022-02-24',
      }
    })).toEqual([
      [ 'FROM', 'abc' ],
      [ 'SUBJECT', 'def' ],
      [ 'SINCE', '2022-02-24' ],
    ])
  })
  it('UID cursor', () => {
    expect(getSearchCriteria({
      fromFilter: 'abc',
      subjectFilter: 'def',
      cursor: {
        type: 'uid',
        lastSeenUid: 101,
      },
    } as Partial<MailboxConfiguration> as any)).toEqual([
      [ 'FROM', 'abc' ],
      [ 'SUBJECT', 'def' ],
      [ 'UID', '102:*' ],
    ])
  })
})
