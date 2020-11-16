import moment from "moment";
import { nextTimestamp, previousTimestamp } from "../fe/fe-utils";

describe('nextTimestamp', () => {
  it('date string', () => {
    expect(nextTimestamp('2022-11-01').isSame(moment.utc('2022-11-02')))
  })
  it('datetime string', () => {
    expect(nextTimestamp('2022-11-01T12:34:56Z').isSame(moment.utc('2022-11-02')))
  })
})

describe('previousTimestamp', () => {
  it('date string', () => {
    expect(previousTimestamp('2022-11-02').isSame(moment.utc('2022-11-01')))
  })
  it('datetime string', () => {
    expect(previousTimestamp('2022-11-02T12:34:56Z').isSame(moment.utc('2022-11-02')))
  })
})
