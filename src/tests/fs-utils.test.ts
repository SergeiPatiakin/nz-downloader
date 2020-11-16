import { getSaveFileName } from "../be/fs-utils"

describe('getSaveFileName', () => {
  it('foo.pdf - first attempt', () => {
    expect(getSaveFileName('foo.pdf', 1)).toBe('foo.pdf')
  })
  it('foo.pdf - second attempt', () => {
    expect(getSaveFileName('foo.pdf', 2)).toBe('foo (2).pdf')
  })
  it('foo - first attempt', () => {
    expect(getSaveFileName('foo', 1)).toBe('foo')
  })
  it('foo - second attempt', () => {
    expect(getSaveFileName('foo', 2)).toBe('foo (2)')
  })
})
