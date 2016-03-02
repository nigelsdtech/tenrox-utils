"use strict"

var logMode

function printLog (level, msg) {
}

function logInfo (msg) {
  printLog('INFO', msg);
}

// export the class
module.exports = {
  info: logInfo
};
