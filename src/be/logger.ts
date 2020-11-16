import fs from 'fs'
import util from 'util'
import path from 'path'
import os from 'os'

import moment from 'moment'
import { app } from 'electron'

const logfilePath = (logFileSuffix: string) => path.join(app.getPath('userData'), `out${logFileSuffix}.log`)

if (process.env.NODE_ENV !== 'test') {
  // Delete log file 7 if exists
  try {
    fs.unlinkSync(logfilePath("8"))
  } catch (e) {
    // Do nothing
  }
  // Rotate logs 0 - 7
  for (let i = 6; i >= 0 ; i--) {
    try {
      fs.renameSync(logfilePath(String(i)), logfilePath(String(i + 1)))
    } catch (e) {
      // Do nothing
    }
  }
}

// Append to log file 0
export const log = (...args: any[]) => {
  if (process.env.NODE_ENV === 'test') {
    return
  }
  const consoleMessage = util.format(
    moment().toISOString(),
    ...args,
  ) + os.EOL
  fs.appendFileSync(logfilePath("0"), consoleMessage)
}
