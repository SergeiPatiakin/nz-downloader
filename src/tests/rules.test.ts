import { isRuleMatch } from "../be/rules"

describe('isRuleMatch', () => {
  it('filename starts with - positive', () => {
    expect(isRuleMatch({
      id: 1,
      type: 'filename-starts-with',
      operand: 'abc',
      destinationPath: '/some/dir'
    }, {
      fileName: 'abcdef',
      content: 'foo',
    })).toBe(true)
  })
  it('filename starts with - negative', () => {
    expect(isRuleMatch({
      id: 1,
      type: 'filename-starts-with',
      operand: 'abc',
      destinationPath: '/some/dir'
    }, {
      fileName: 'abxdef',
      content: 'foo',
    })).toBe(false)
  })
  it('filename starts with - case insensitive positive', () => {
    expect(isRuleMatch({
      id: 1,
      type: 'filename-starts-with',
      operand: 'abc',
      destinationPath: '/some/dir'
    }, {
      fileName: 'ABCDEF',
      content: 'foo',
    })).toBe(false)
  })
  it('filename matches regex - positive', () => {
    expect(isRuleMatch({
      id: 1,
      type: 'filename-matches-regex',
      operand: 'e[fg]$',
      destinationPath: '/some/dir'
    }, {
      fileName: 'abcdef',
      content: 'foo',
    })).toBe(true)
  })
  it('filename matches regex - negative', () => {
    expect(isRuleMatch({
      id: 1,
      type: 'filename-matches-regex',
      operand: 'e[xg]$',
      destinationPath: '/some/dir'
    }, {
      fileName: 'abcdef',
      content: 'foo',
    })).toBe(false)
  })
  it('matches regex - case insensitive positive', () => {
    expect(isRuleMatch({
      id: 1,
      type: 'filename-matches-regex',
      operand: 'e[fg]$',
      destinationPath: '/some/dir'
    }, {
      fileName: 'ABCDEF',
      content: 'foo',
    })).toBe(true)
  })
})
