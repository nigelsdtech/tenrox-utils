var Tenrox     = require('../.')
   ,dateformat = require('dateformat')
   ,prompt     = require('prompt')


var tenrox

console.log('Begin example script')
console.log('====================')



function getTimesheetEntries() {


  /*
   * Get timesheet entries
   */

  var numEntriesToDisplay = 20
  var d = new Date()
  var startDate = new Date( d.getFullYear(), d.getMonth(), d.getDate()-14)
  var endDate   = new Date( d.getFullYear(), d.getMonth(), d.getDate()-7)

  console.log('Getting first %s timesheet entries from %s to %s', numEntriesToDisplay, dateformat(startDate, 'yyyy-mm-dd'), dateformat(endDate, 'yyyy-mm-dd'))

  tenrox.getTimesheetEntries({
    startDate: startDate,
    endDate:   endDate
  }, function (err,entries) {

    if (err) {
      console.error('Error while getting Timesheet Entries: ' + err)
      return null
    }


    if (entries.length == 0) {
      console.log('No entries to display')
      return null
    }

    var i = 0
    while (i < entries.length && i < numEntriesToDisplay) {

      var entry      = entries[i]
      var taskName   = entry.TaskName
      var entryDate  = entry.EntryDate
      var timeBooked = (entry.TotalTime/60 /60)

      console.log('%s: %s (%s hrs booked)', entryDate, taskName, timeBooked)
      i++
    }

  })

}




prompt.start();

prompt.get([
  {
    name: 'trOrg',
    message: 'Name of your organization on the Tenrox system'
  },
  {
    name: 'trUname',
    message: 'Tenrox username'
  },
  {
    name: 'trPword',
    message: 'Tenrox password',
    hidden: true,
    replace: '*'
  },
], function (err, result) {

  if (err) {return onErr(err)}

  tenrox = new Tenrox ({
    org: result.trOrg,
    username: result.trUname,
    password: result.trPword
  })

  getTimesheetEntries()

})


