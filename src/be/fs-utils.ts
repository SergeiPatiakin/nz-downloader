export const getSaveFileName = (originalFileName: string, attempt: number) => {
  if (attempt === 1){
    return originalFileName
  }
  const periodIndex = originalFileName.lastIndexOf('.')
  const addition = ' (' + String(attempt) + ')'
  if (periodIndex === -1) {
    return originalFileName + addition
  }
  return originalFileName.slice(0, periodIndex) + addition + originalFileName.slice(periodIndex)
}
