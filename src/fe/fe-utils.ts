import moment from "moment"

const ISO8601_DATE_REGEX = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/

export const nextTimestamp = (cursorDateOrDatetime: string) => {
  if (ISO8601_DATE_REGEX.test(cursorDateOrDatetime)) {
    // YYYY-MM-DD
    // Parse with UTC offset set to zero
    const currentTimestamp = moment.utc(cursorDateOrDatetime)
    return currentTimestamp.clone().add(1, 'day')
  } else {
    const currentTimestamp = moment(cursorDateOrDatetime)
    // Add 1 day. Hours/minutes/seconds will be zeroed anyway
    return currentTimestamp.clone().add(1, 'day')
  }
}

export const previousTimestamp = (cursorDateOrDatetime: string) => {
  if (ISO8601_DATE_REGEX.test(cursorDateOrDatetime)) {
    // YYYY-MM-DD
    // Parse with UTC offset set to zero
    const currentTimestamp = moment.utc(cursorDateOrDatetime)
    return currentTimestamp.clone().subtract(1, 'day')
  } else {
    // YYYY-MM-DD HH:mm:ss offset
    const currentTimestamp = moment(cursorDateOrDatetime)
    // Keep it the same. Hours/minutes/seconds will be zeroed anyway
    return currentTimestamp.clone()
  }
}
