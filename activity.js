'use strict'

module.exports = {
    Activity: Activity,
    ActivityToList: ActivityToList
}

/**
 * Creates an Activity Object containing a date of completion, activity name, 
 * and measurement
 * @param {Object} obj - stores activity data to build an activity object
 * @param {string} obj.date
 * @param {string} obj.activity
 * @param {float} obj.scalar
 * @param {string} obj.units
 * @returns {Object} activity - stores activity data built into an activity object
 * @returns {string} activity.date
 * @returns {string} activity.activity
 * @returns {float} activity.scalar
 * @returns {string} activity.units
 */
function Activity(obj) {
    console.log("OBJECT IN ACTIVITY = ", obj);
    let activity = null

    // if mm-dd-yyyy, convert to ms since 1970
    if (typeof(obj.date) == 'string') {
        obj.date = (new Date(obj.date.replace('-','/'))).getTime()
    }

    if (obj.date && obj.activity && obj.scalar && obj.units && obj.postDate && obj.difficulty) {
        activity = {
            date: obj.date,
            activity: obj.activity,
            scalar: obj.scalar,
            units: obj.units,
            postDate: obj.postDate,
            difficulty: obj.difficulty
        }
    } else if (obj.date && obj.activity && obj.postDate) {
        activity = {
            date: obj.date,
            activity: obj.activity,
            scalar: -1,
            units: -1,
            postDate: obj.postDate,
            difficulty: -1
        }
    }

    if (activity == null) {
        throw new ActivityFormatException(obj)
    }

    return activity
}

/**
 * error message to invalid Activity creation
 * @param {*} value 
 */
function ActivityFormatException(value) {
    this.value = JSON.stringify(value);
    this.message = 'does not conform to the expected format for an activity';
    this.toString = function() {
        return this.value + ' ' + this.message;
    };
}

/**
 * stores and returns activity into a list format
 * @param {Activity} activity 
 * @returns activity components in a list format
 */
function ActivityToList(activity, useridProfile) {
    if (activity == null) {
        throw new ActivityFormatException(activity)
    }

    return [activity.activity, activity.date, activity.scalar, activity.units, activity.postDate, activity.difficulty, useridProfile]
}
