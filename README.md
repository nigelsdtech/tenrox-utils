# tenrox-utils
Interface with Tenrox timesheet system.


### Version
1.0.0



### Installation

This isn't available on npm yet, so you'll just have to use github

```sh
$ npm install "nigelsdtech/tenrox-utils#1.0.0"
```



### Usage

Currently there is only one function - getting your timesheet entries between any two dates. You can call this function using the following:

```js
var Tenrox = require('tenrox-utils')

// Initialize the package with your tenrox credentials
var tenrox = new Tenrox ({
  org:      'MyCompany',
  username: 'GeddyLee',
  password: 'WorkinThemAngels'
})

// Get all timesheet entries from 2016-01-01 to 2016-01-07
// Optionally, you can add the taskNameFilter to only return entries
// with the word "Meetings" in the name.
tenrox.getTimesheetEntries({
  startDate: new Date('2016-01-01'),
  endDate:   new Date('2016-01-07'),
  taskNameFilter: "Meetings"
}, function (err,entries) {

  if (err) {
    console.error('Error getting timesheet entries: ' + err)
    return null
  }

  if (entries.length == 0) {
    console.log('No entries to display')
    return null
  }

  for (var i = 0 ; i < entries.length; i++) {

    var entry      = entries[i]
    var taskName   = entry.TaskName
    var entryDate  = entry.EntryDate
    var timeBooked = (entry.TotalTime/60 /60)

    console.log('%s: %s (%s hrs booked)', entryDate, taskName, timeBooked)
  }

})
```


### Examples

See examples/usage.js to get started. You can run it with the following.

```sh
$ node examples/usage.js
```
