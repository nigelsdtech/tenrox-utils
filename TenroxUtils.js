/**
 * Copyright (c) 2016,
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

"use strict"

var request    = require('request')
   ,dateformat = require('dateformat');

var method = TenroxUtils.prototype;



/*
 * Class variables
 */

var authCacheDuration
   ,cachedAuth
   ,cachedAuthAt
   ,mobiApiUrl
   ,org
   ,password
   ,username



/**
 * Tenrox Utils
 *
 * @classdesc Interface with Tenrox API.
 * @namespace tenroxUtils
 * @version  v1
 * @variation v1
 * @this TenroxUtils
 * @param {object=} params - Options for Tenrox
 * @param {string} params.org - The name of your company as registered with Tenrox.
 * @param {string} params.user - Your username on the Tenrox system.
 * @param {string} params.password - Your password on the Tenrox system.
 */

function TenroxUtils(params) {

  this.org       = params.org
  this.username  = params.username
  this.password  = params.password


  this.mobiApiUrl        = 'https://2015r1mobile.tenrox.net/tenterprise/api'
  this.authCacheDuration = (1000*60*2);

}


/**
 * tenroxUtils.doAuth
 *
 * @desc Authorize with Tenrox API
 *
 *
 * @alias tenroxUtils.doAuth
 * @memberOf! tenroxUtils(v1)
 *
 * @param {callback} callback - The callback that handles the response.
 */
method.doAuth = function (callback) {

  var self = this

  // Check if there's a cached authBody that's younger than the configured cache duration
  // If there is, return this auth body instead.
  var now = new Date()
  if (this.cachedAuthAt
    && (now.getTime() - this.cachedAuthAt.getTime()) <= this.authCacheDuration
  ) {
    callback(null,this.cachedAuth)
    return null;
  }


  var username = this.org+':'+this.username

  // Fire off the request
  request({
    method: 'GET',
    baseUrl: this.mobiApiUrl,
    uri: 'Security',
    auth: {
      user: username,
      pass: this.password
    }
  } , function (err,response,body) {

    if (err) {
      callback(new Error('tenroxUtils.doAuth error: ' + err));
      return null;
    }

    if (response.statusCode != 200) {
      callback(new Error('tenroxUtils.doAuth Unexpected response status code -\n' + body));
      return null;
    }

    var authBody = JSON.parse(body)

    // Cache the authBody
    self.cachedAuth = authBody;
    self.cachedAuthAt = new Date();

    callback(null,authBody);
  })

}


/**
 * tenroxUtils.getTimesheetEntries
 *
 * @desc Gets all timesheet entries between two specified dates.
 *
 *
 * @alias tenroxUtils.getTimesheetEntries
 * @memberOf! tenroxUtils(v1)
 *
 * @param {object=} params - Parameters for request
 * @param {date} params.startDate - Get entries from this day
 * @param {date} params.endDate - Get entries up to this day
 * @param {string} params.taskNameFilter - Regexp search to filter on the task name. Default null.
 * @param {callback} callback - The callback that handles the response. It provides an array with a set of timesheet entries that matched the criteria.
 *
 */
method.getTimesheetEntries = function (params,callback) {

  var start = params.startDate
     ,end   = params.endDate

  var self = this;

  // First authorize for a token
  this.doAuth ( function (err, authBody) {

    if (err) {
      callback(new Error('tenroxUtils.getTimesheetEntries error authorizing: ' + err));
      return null;
    }

    var token  = authBody.Token
       ,userId = authBody.UniqueId;

    var period = params.startDate;
    if (params.hasOwnProperty('periodDate')) {
      period = params.periodDate;
    }


    request({
      method: 'GET',
      baseUrl: self.mobiApiUrl,
      uri: 'Timesheets',
      headers: {
        'API-Key' : token
      },
      qs : {
        'userId':  userId,
        'anydate': dateformat(period, 'mm-dd-yyyy')
      }
    }, function (err,response,body) {

      if (err) {
        callback(new Error('tenroxUtils.getTimesheetEntries error while making request: ' + err));
        return null;
      }

      var b = JSON.parse(body)
      var timeEntries = b.TimeEntries;

      var matchedEntries = [];
      if (params.hasOwnProperty('matchedEntries')) {
        matchedEntries = params.matchedEntries
      }

      // Go through all the retrieved entries and pull out shifts within the specified period
      for (var i = 0; i < timeEntries.length; i++) {

        var entry = timeEntries[i];
        var ent = new Date(entry.EntryDate);

        // Once we start getting entries higher than
        // the end date we can stop recursively calling back to get the next period
        if (ent.getTime() > end.getTime()) {

      	  callback(null,matchedEntries);
          return null

        } else if (ent.getTime() >= start.getTime()) {

	  // Skip if it doesn't meet the taskNameFilter match
          if (params.hasOwnProperty('taskNameFilter')
	    && entry.TaskName.search(params.taskNameFilter) == -1
          ) {
	      continue
          }

          matchedEntries.push(entry)

        }
      }

      // Update the start date to be the next week and get the next timesheet
      var nextPeriodDate = new Date(period.getFullYear(), period.getMonth(), (period.getDate()+7));

      self.getTimesheetEntries({
        startDate:  params.startDate,
        endDate:    params.endDate,
        taskNameFilter: params.taskNameFilter,
        matchedEntries: matchedEntries,
        periodDate: nextPeriodDate
      }, callback)

    })
  })
}




// export the class
module.exports = TenroxUtils;
