const moment = require("moment");
const dateTimeFormat = 'YYYY-MM-DD HH:mm:ss'

function logger(message, ...data) {
  if (data && data.length) {
    console.log(`[${moment().format(dateTimeFormat)}] ${message}`, ...data)
  } else {
    console.log(`[${moment().format(dateTimeFormat)}] ${message}`)
  }
}

module.exports = {
  logger
}
