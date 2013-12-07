
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-moment/index.js", Function("exports, require, module",
"// moment.js\n\
// version : 2.0.0\n\
// author : Tim Wood\n\
// license : MIT\n\
// momentjs.com\n\
\n\
(function (undefined) {\n\
\n\
    /************************************\n\
        Constants\n\
    ************************************/\n\
\n\
    var moment,\n\
        VERSION = \"2.0.0\",\n\
        round = Math.round, i,\n\
        // internal storage for language config files\n\
        languages = {},\n\
\n\
        // check for nodeJS\n\
        hasModule = (typeof module !== 'undefined' && module.exports),\n\
\n\
        // ASP.NET json date format regex\n\
        aspNetJsonRegex = /^\\/?Date\\((\\-?\\d+)/i,\n\
\n\
        // format tokens\n\
        formattingTokens = /(\\[[^\\[]*\\])|(\\\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|YYYYY|YYYY|YY|a|A|hh?|HH?|mm?|ss?|SS?S?|X|zz?|ZZ?|.)/g,\n\
        localFormattingTokens = /(\\[[^\\[]*\\])|(\\\\)?(LT|LL?L?L?|l{1,4})/g,\n\
\n\
        // parsing tokens\n\
        parseMultipleFormatChunker = /([0-9a-zA-Z\\u00A0-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF]+)/gi,\n\
\n\
        // parsing token regexes\n\
        parseTokenOneOrTwoDigits = /\\d\\d?/, // 0 - 99\n\
        parseTokenOneToThreeDigits = /\\d{1,3}/, // 0 - 999\n\
        parseTokenThreeDigits = /\\d{3}/, // 000 - 999\n\
        parseTokenFourDigits = /\\d{1,4}/, // 0 - 9999\n\
        parseTokenSixDigits = /[+\\-]?\\d{1,6}/, // -999,999 - 999,999\n\
        parseTokenWord = /[0-9]*[a-z\\u00A0-\\u05FF\\u0700-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF]+|[\\u0600-\\u06FF]+\\s*?[\\u0600-\\u06FF]+/i, // any word (or two) characters or numbers including two word month in arabic.\n\
        parseTokenTimezone = /Z|[\\+\\-]\\d\\d:?\\d\\d/i, // +00:00 -00:00 +0000 -0000 or Z\n\
        parseTokenT = /T/i, // T (ISO seperator)\n\
        parseTokenTimestampMs = /[\\+\\-]?\\d+(\\.\\d{1,3})?/, // 123456789 123456789.123\n\
\n\
        // preliminary iso regex\n\
        // 0000-00-00 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000\n\
        isoRegex = /^\\s*\\d{4}-\\d\\d-\\d\\d((T| )(\\d\\d(:\\d\\d(:\\d\\d(\\.\\d\\d?\\d?)?)?)?)?([\\+\\-]\\d\\d:?\\d\\d)?)?/,\n\
        isoFormat = 'YYYY-MM-DDTHH:mm:ssZ',\n\
\n\
        // iso time formats and regexes\n\
        isoTimes = [\n\
            ['HH:mm:ss.S', /(T| )\\d\\d:\\d\\d:\\d\\d\\.\\d{1,3}/],\n\
            ['HH:mm:ss', /(T| )\\d\\d:\\d\\d:\\d\\d/],\n\
            ['HH:mm', /(T| )\\d\\d:\\d\\d/],\n\
            ['HH', /(T| )\\d\\d/]\n\
        ],\n\
\n\
        // timezone chunker \"+10:00\" > [\"10\", \"00\"] or \"-1530\" > [\"-15\", \"30\"]\n\
        parseTimezoneChunker = /([\\+\\-]|\\d\\d)/gi,\n\
\n\
        // getter and setter names\n\
        proxyGettersAndSetters = 'Month|Date|Hours|Minutes|Seconds|Milliseconds'.split('|'),\n\
        unitMillisecondFactors = {\n\
            'Milliseconds' : 1,\n\
            'Seconds' : 1e3,\n\
            'Minutes' : 6e4,\n\
            'Hours' : 36e5,\n\
            'Days' : 864e5,\n\
            'Months' : 2592e6,\n\
            'Years' : 31536e6\n\
        },\n\
\n\
        // format function strings\n\
        formatFunctions = {},\n\
\n\
        // tokens to ordinalize and pad\n\
        ordinalizeTokens = 'DDD w W M D d'.split(' '),\n\
        paddedTokens = 'M D H h m s w W'.split(' '),\n\
\n\
        formatTokenFunctions = {\n\
            M    : function () {\n\
                return this.month() + 1;\n\
            },\n\
            MMM  : function (format) {\n\
                return this.lang().monthsShort(this, format);\n\
            },\n\
            MMMM : function (format) {\n\
                return this.lang().months(this, format);\n\
            },\n\
            D    : function () {\n\
                return this.date();\n\
            },\n\
            DDD  : function () {\n\
                return this.dayOfYear();\n\
            },\n\
            d    : function () {\n\
                return this.day();\n\
            },\n\
            dd   : function (format) {\n\
                return this.lang().weekdaysMin(this, format);\n\
            },\n\
            ddd  : function (format) {\n\
                return this.lang().weekdaysShort(this, format);\n\
            },\n\
            dddd : function (format) {\n\
                return this.lang().weekdays(this, format);\n\
            },\n\
            w    : function () {\n\
                return this.week();\n\
            },\n\
            W    : function () {\n\
                return this.isoWeek();\n\
            },\n\
            YY   : function () {\n\
                return leftZeroFill(this.year() % 100, 2);\n\
            },\n\
            YYYY : function () {\n\
                return leftZeroFill(this.year(), 4);\n\
            },\n\
            YYYYY : function () {\n\
                return leftZeroFill(this.year(), 5);\n\
            },\n\
            a    : function () {\n\
                return this.lang().meridiem(this.hours(), this.minutes(), true);\n\
            },\n\
            A    : function () {\n\
                return this.lang().meridiem(this.hours(), this.minutes(), false);\n\
            },\n\
            H    : function () {\n\
                return this.hours();\n\
            },\n\
            h    : function () {\n\
                return this.hours() % 12 || 12;\n\
            },\n\
            m    : function () {\n\
                return this.minutes();\n\
            },\n\
            s    : function () {\n\
                return this.seconds();\n\
            },\n\
            S    : function () {\n\
                return ~~(this.milliseconds() / 100);\n\
            },\n\
            SS   : function () {\n\
                return leftZeroFill(~~(this.milliseconds() / 10), 2);\n\
            },\n\
            SSS  : function () {\n\
                return leftZeroFill(this.milliseconds(), 3);\n\
            },\n\
            Z    : function () {\n\
                var a = -this.zone(),\n\
                    b = \"+\";\n\
                if (a < 0) {\n\
                    a = -a;\n\
                    b = \"-\";\n\
                }\n\
                return b + leftZeroFill(~~(a / 60), 2) + \":\" + leftZeroFill(~~a % 60, 2);\n\
            },\n\
            ZZ   : function () {\n\
                var a = -this.zone(),\n\
                    b = \"+\";\n\
                if (a < 0) {\n\
                    a = -a;\n\
                    b = \"-\";\n\
                }\n\
                return b + leftZeroFill(~~(10 * a / 6), 4);\n\
            },\n\
            X    : function () {\n\
                return this.unix();\n\
            }\n\
        };\n\
\n\
    function padToken(func, count) {\n\
        return function (a) {\n\
            return leftZeroFill(func.call(this, a), count);\n\
        };\n\
    }\n\
    function ordinalizeToken(func) {\n\
        return function (a) {\n\
            return this.lang().ordinal(func.call(this, a));\n\
        };\n\
    }\n\
\n\
    while (ordinalizeTokens.length) {\n\
        i = ordinalizeTokens.pop();\n\
        formatTokenFunctions[i + 'o'] = ordinalizeToken(formatTokenFunctions[i]);\n\
    }\n\
    while (paddedTokens.length) {\n\
        i = paddedTokens.pop();\n\
        formatTokenFunctions[i + i] = padToken(formatTokenFunctions[i], 2);\n\
    }\n\
    formatTokenFunctions.DDDD = padToken(formatTokenFunctions.DDD, 3);\n\
\n\
\n\
    /************************************\n\
        Constructors\n\
    ************************************/\n\
\n\
    function Language() {\n\
\n\
    }\n\
\n\
    // Moment prototype object\n\
    function Moment(config) {\n\
        extend(this, config);\n\
    }\n\
\n\
    // Duration Constructor\n\
    function Duration(duration) {\n\
        var data = this._data = {},\n\
            years = duration.years || duration.year || duration.y || 0,\n\
            months = duration.months || duration.month || duration.M || 0,\n\
            weeks = duration.weeks || duration.week || duration.w || 0,\n\
            days = duration.days || duration.day || duration.d || 0,\n\
            hours = duration.hours || duration.hour || duration.h || 0,\n\
            minutes = duration.minutes || duration.minute || duration.m || 0,\n\
            seconds = duration.seconds || duration.second || duration.s || 0,\n\
            milliseconds = duration.milliseconds || duration.millisecond || duration.ms || 0;\n\
\n\
        // representation for dateAddRemove\n\
        this._milliseconds = milliseconds +\n\
            seconds * 1e3 + // 1000\n\
            minutes * 6e4 + // 1000 * 60\n\
            hours * 36e5; // 1000 * 60 * 60\n\
        // Because of dateAddRemove treats 24 hours as different from a\n\
        // day when working around DST, we need to store them separately\n\
        this._days = days +\n\
            weeks * 7;\n\
        // It is impossible translate months into days without knowing\n\
        // which months you are are talking about, so we have to store\n\
        // it separately.\n\
        this._months = months +\n\
            years * 12;\n\
\n\
        // The following code bubbles up values, see the tests for\n\
        // examples of what that means.\n\
        data.milliseconds = milliseconds % 1000;\n\
        seconds += absRound(milliseconds / 1000);\n\
\n\
        data.seconds = seconds % 60;\n\
        minutes += absRound(seconds / 60);\n\
\n\
        data.minutes = minutes % 60;\n\
        hours += absRound(minutes / 60);\n\
\n\
        data.hours = hours % 24;\n\
        days += absRound(hours / 24);\n\
\n\
        days += weeks * 7;\n\
        data.days = days % 30;\n\
\n\
        months += absRound(days / 30);\n\
\n\
        data.months = months % 12;\n\
        years += absRound(months / 12);\n\
\n\
        data.years = years;\n\
    }\n\
\n\
\n\
    /************************************\n\
        Helpers\n\
    ************************************/\n\
\n\
\n\
    function extend(a, b) {\n\
        for (var i in b) {\n\
            if (b.hasOwnProperty(i)) {\n\
                a[i] = b[i];\n\
            }\n\
        }\n\
        return a;\n\
    }\n\
\n\
    function absRound(number) {\n\
        if (number < 0) {\n\
            return Math.ceil(number);\n\
        } else {\n\
            return Math.floor(number);\n\
        }\n\
    }\n\
\n\
    // left zero fill a number\n\
    // see http://jsperf.com/left-zero-filling for performance comparison\n\
    function leftZeroFill(number, targetLength) {\n\
        var output = number + '';\n\
        while (output.length < targetLength) {\n\
            output = '0' + output;\n\
        }\n\
        return output;\n\
    }\n\
\n\
    // helper function for _.addTime and _.subtractTime\n\
    function addOrSubtractDurationFromMoment(mom, duration, isAdding) {\n\
        var ms = duration._milliseconds,\n\
            d = duration._days,\n\
            M = duration._months,\n\
            currentDate;\n\
\n\
        if (ms) {\n\
            mom._d.setTime(+mom + ms * isAdding);\n\
        }\n\
        if (d) {\n\
            mom.date(mom.date() + d * isAdding);\n\
        }\n\
        if (M) {\n\
            currentDate = mom.date();\n\
            mom.date(1)\n\
                .month(mom.month() + M * isAdding)\n\
                .date(Math.min(currentDate, mom.daysInMonth()));\n\
        }\n\
    }\n\
\n\
    // check if is an array\n\
    function isArray(input) {\n\
        return Object.prototype.toString.call(input) === '[object Array]';\n\
    }\n\
\n\
    // compare two arrays, return the number of differences\n\
    function compareArrays(array1, array2) {\n\
        var len = Math.min(array1.length, array2.length),\n\
            lengthDiff = Math.abs(array1.length - array2.length),\n\
            diffs = 0,\n\
            i;\n\
        for (i = 0; i < len; i++) {\n\
            if (~~array1[i] !== ~~array2[i]) {\n\
                diffs++;\n\
            }\n\
        }\n\
        return diffs + lengthDiff;\n\
    }\n\
\n\
\n\
    /************************************\n\
        Languages\n\
    ************************************/\n\
\n\
\n\
    Language.prototype = {\n\
        set : function (config) {\n\
            var prop, i;\n\
            for (i in config) {\n\
                prop = config[i];\n\
                if (typeof prop === 'function') {\n\
                    this[i] = prop;\n\
                } else {\n\
                    this['_' + i] = prop;\n\
                }\n\
            }\n\
        },\n\
\n\
        _months : \"January_February_March_April_May_June_July_August_September_October_November_December\".split(\"_\"),\n\
        months : function (m) {\n\
            return this._months[m.month()];\n\
        },\n\
\n\
        _monthsShort : \"Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec\".split(\"_\"),\n\
        monthsShort : function (m) {\n\
            return this._monthsShort[m.month()];\n\
        },\n\
\n\
        monthsParse : function (monthName) {\n\
            var i, mom, regex, output;\n\
\n\
            if (!this._monthsParse) {\n\
                this._monthsParse = [];\n\
            }\n\
\n\
            for (i = 0; i < 12; i++) {\n\
                // make the regex if we don't have it already\n\
                if (!this._monthsParse[i]) {\n\
                    mom = moment([2000, i]);\n\
                    regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');\n\
                    this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');\n\
                }\n\
                // test the regex\n\
                if (this._monthsParse[i].test(monthName)) {\n\
                    return i;\n\
                }\n\
            }\n\
        },\n\
\n\
        _weekdays : \"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday\".split(\"_\"),\n\
        weekdays : function (m) {\n\
            return this._weekdays[m.day()];\n\
        },\n\
\n\
        _weekdaysShort : \"Sun_Mon_Tue_Wed_Thu_Fri_Sat\".split(\"_\"),\n\
        weekdaysShort : function (m) {\n\
            return this._weekdaysShort[m.day()];\n\
        },\n\
\n\
        _weekdaysMin : \"Su_Mo_Tu_We_Th_Fr_Sa\".split(\"_\"),\n\
        weekdaysMin : function (m) {\n\
            return this._weekdaysMin[m.day()];\n\
        },\n\
\n\
        _longDateFormat : {\n\
            LT : \"h:mm A\",\n\
            L : \"MM/DD/YYYY\",\n\
            LL : \"MMMM D YYYY\",\n\
            LLL : \"MMMM D YYYY LT\",\n\
            LLLL : \"dddd, MMMM D YYYY LT\"\n\
        },\n\
        longDateFormat : function (key) {\n\
            var output = this._longDateFormat[key];\n\
            if (!output && this._longDateFormat[key.toUpperCase()]) {\n\
                output = this._longDateFormat[key.toUpperCase()].replace(/MMMM|MM|DD|dddd/g, function (val) {\n\
                    return val.slice(1);\n\
                });\n\
                this._longDateFormat[key] = output;\n\
            }\n\
            return output;\n\
        },\n\
\n\
        meridiem : function (hours, minutes, isLower) {\n\
            if (hours > 11) {\n\
                return isLower ? 'pm' : 'PM';\n\
            } else {\n\
                return isLower ? 'am' : 'AM';\n\
            }\n\
        },\n\
\n\
        _calendar : {\n\
            sameDay : '[Today at] LT',\n\
            nextDay : '[Tomorrow at] LT',\n\
            nextWeek : 'dddd [at] LT',\n\
            lastDay : '[Yesterday at] LT',\n\
            lastWeek : '[last] dddd [at] LT',\n\
            sameElse : 'L'\n\
        },\n\
        calendar : function (key, mom) {\n\
            var output = this._calendar[key];\n\
            return typeof output === 'function' ? output.apply(mom) : output;\n\
        },\n\
\n\
        _relativeTime : {\n\
            future : \"in %s\",\n\
            past : \"%s ago\",\n\
            s : \"a few seconds\",\n\
            m : \"a minute\",\n\
            mm : \"%d minutes\",\n\
            h : \"an hour\",\n\
            hh : \"%d hours\",\n\
            d : \"a day\",\n\
            dd : \"%d days\",\n\
            M : \"a month\",\n\
            MM : \"%d months\",\n\
            y : \"a year\",\n\
            yy : \"%d years\"\n\
        },\n\
        relativeTime : function (number, withoutSuffix, string, isFuture) {\n\
            var output = this._relativeTime[string];\n\
            return (typeof output === 'function') ?\n\
                output(number, withoutSuffix, string, isFuture) :\n\
                output.replace(/%d/i, number);\n\
        },\n\
        pastFuture : function (diff, output) {\n\
            var format = this._relativeTime[diff > 0 ? 'future' : 'past'];\n\
            return typeof format === 'function' ? format(output) : format.replace(/%s/i, output);\n\
        },\n\
\n\
        ordinal : function (number) {\n\
            return this._ordinal.replace(\"%d\", number);\n\
        },\n\
        _ordinal : \"%d\",\n\
\n\
        preparse : function (string) {\n\
            return string;\n\
        },\n\
\n\
        postformat : function (string) {\n\
            return string;\n\
        },\n\
\n\
        week : function (mom) {\n\
            return weekOfYear(mom, this._week.dow, this._week.doy);\n\
        },\n\
        _week : {\n\
            dow : 0, // Sunday is the first day of the week.\n\
            doy : 6  // The week that contains Jan 1st is the first week of the year.\n\
        }\n\
    };\n\
\n\
    // Loads a language definition into the `languages` cache.  The function\n\
    // takes a key and optionally values.  If not in the browser and no values\n\
    // are provided, it will load the language file module.  As a convenience,\n\
    // this function also returns the language values.\n\
    function loadLang(key, values) {\n\
        values.abbr = key;\n\
        if (!languages[key]) {\n\
            languages[key] = new Language();\n\
        }\n\
        languages[key].set(values);\n\
        return languages[key];\n\
    }\n\
\n\
    // Determines which language definition to use and returns it.\n\
    //\n\
    // With no parameters, it will return the global language.  If you\n\
    // pass in a language key, such as 'en', it will return the\n\
    // definition for 'en', so long as 'en' has already been loaded using\n\
    // moment.lang.\n\
    function getLangDefinition(key) {\n\
        if (!key) {\n\
            return moment.fn._lang;\n\
        }\n\
        if (!languages[key] && hasModule) {\n\
            require('./lang/' + key);\n\
        }\n\
        return languages[key];\n\
    }\n\
\n\
\n\
    /************************************\n\
        Formatting\n\
    ************************************/\n\
\n\
\n\
    function removeFormattingTokens(input) {\n\
        if (input.match(/\\[.*\\]/)) {\n\
            return input.replace(/^\\[|\\]$/g, \"\");\n\
        }\n\
        return input.replace(/\\\\/g, \"\");\n\
    }\n\
\n\
    function makeFormatFunction(format) {\n\
        var array = format.match(formattingTokens), i, length;\n\
\n\
        for (i = 0, length = array.length; i < length; i++) {\n\
            if (formatTokenFunctions[array[i]]) {\n\
                array[i] = formatTokenFunctions[array[i]];\n\
            } else {\n\
                array[i] = removeFormattingTokens(array[i]);\n\
            }\n\
        }\n\
\n\
        return function (mom) {\n\
            var output = \"\";\n\
            for (i = 0; i < length; i++) {\n\
                output += typeof array[i].call === 'function' ? array[i].call(mom, format) : array[i];\n\
            }\n\
            return output;\n\
        };\n\
    }\n\
\n\
    // format date using native date object\n\
    function formatMoment(m, format) {\n\
        var i = 5;\n\
\n\
        function replaceLongDateFormatTokens(input) {\n\
            return m.lang().longDateFormat(input) || input;\n\
        }\n\
\n\
        while (i-- && localFormattingTokens.test(format)) {\n\
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);\n\
        }\n\
\n\
        if (!formatFunctions[format]) {\n\
            formatFunctions[format] = makeFormatFunction(format);\n\
        }\n\
\n\
        return formatFunctions[format](m);\n\
    }\n\
\n\
\n\
    /************************************\n\
        Parsing\n\
    ************************************/\n\
\n\
\n\
    // get the regex to find the next token\n\
    function getParseRegexForToken(token) {\n\
        switch (token) {\n\
        case 'DDDD':\n\
            return parseTokenThreeDigits;\n\
        case 'YYYY':\n\
            return parseTokenFourDigits;\n\
        case 'YYYYY':\n\
            return parseTokenSixDigits;\n\
        case 'S':\n\
        case 'SS':\n\
        case 'SSS':\n\
        case 'DDD':\n\
            return parseTokenOneToThreeDigits;\n\
        case 'MMM':\n\
        case 'MMMM':\n\
        case 'dd':\n\
        case 'ddd':\n\
        case 'dddd':\n\
        case 'a':\n\
        case 'A':\n\
            return parseTokenWord;\n\
        case 'X':\n\
            return parseTokenTimestampMs;\n\
        case 'Z':\n\
        case 'ZZ':\n\
            return parseTokenTimezone;\n\
        case 'T':\n\
            return parseTokenT;\n\
        case 'MM':\n\
        case 'DD':\n\
        case 'YY':\n\
        case 'HH':\n\
        case 'hh':\n\
        case 'mm':\n\
        case 'ss':\n\
        case 'M':\n\
        case 'D':\n\
        case 'd':\n\
        case 'H':\n\
        case 'h':\n\
        case 'm':\n\
        case 's':\n\
            return parseTokenOneOrTwoDigits;\n\
        default :\n\
            return new RegExp(token.replace('\\\\', ''));\n\
        }\n\
    }\n\
\n\
    // function to convert string input to date\n\
    function addTimeToArrayFromToken(token, input, config) {\n\
        var a, b,\n\
            datePartArray = config._a;\n\
\n\
        switch (token) {\n\
        // MONTH\n\
        case 'M' : // fall through to MM\n\
        case 'MM' :\n\
            datePartArray[1] = (input == null) ? 0 : ~~input - 1;\n\
            break;\n\
        case 'MMM' : // fall through to MMMM\n\
        case 'MMMM' :\n\
            a = getLangDefinition(config._l).monthsParse(input);\n\
            // if we didn't find a month name, mark the date as invalid.\n\
            if (a != null) {\n\
                datePartArray[1] = a;\n\
            } else {\n\
                config._isValid = false;\n\
            }\n\
            break;\n\
        // DAY OF MONTH\n\
        case 'D' : // fall through to DDDD\n\
        case 'DD' : // fall through to DDDD\n\
        case 'DDD' : // fall through to DDDD\n\
        case 'DDDD' :\n\
            if (input != null) {\n\
                datePartArray[2] = ~~input;\n\
            }\n\
            break;\n\
        // YEAR\n\
        case 'YY' :\n\
            datePartArray[0] = ~~input + (~~input > 68 ? 1900 : 2000);\n\
            break;\n\
        case 'YYYY' :\n\
        case 'YYYYY' :\n\
            datePartArray[0] = ~~input;\n\
            break;\n\
        // AM / PM\n\
        case 'a' : // fall through to A\n\
        case 'A' :\n\
            config._isPm = ((input + '').toLowerCase() === 'pm');\n\
            break;\n\
        // 24 HOUR\n\
        case 'H' : // fall through to hh\n\
        case 'HH' : // fall through to hh\n\
        case 'h' : // fall through to hh\n\
        case 'hh' :\n\
            datePartArray[3] = ~~input;\n\
            break;\n\
        // MINUTE\n\
        case 'm' : // fall through to mm\n\
        case 'mm' :\n\
            datePartArray[4] = ~~input;\n\
            break;\n\
        // SECOND\n\
        case 's' : // fall through to ss\n\
        case 'ss' :\n\
            datePartArray[5] = ~~input;\n\
            break;\n\
        // MILLISECOND\n\
        case 'S' :\n\
        case 'SS' :\n\
        case 'SSS' :\n\
            datePartArray[6] = ~~ (('0.' + input) * 1000);\n\
            break;\n\
        // UNIX TIMESTAMP WITH MS\n\
        case 'X':\n\
            config._d = new Date(parseFloat(input) * 1000);\n\
            break;\n\
        // TIMEZONE\n\
        case 'Z' : // fall through to ZZ\n\
        case 'ZZ' :\n\
            config._useUTC = true;\n\
            a = (input + '').match(parseTimezoneChunker);\n\
            if (a && a[1]) {\n\
                config._tzh = ~~a[1];\n\
            }\n\
            if (a && a[2]) {\n\
                config._tzm = ~~a[2];\n\
            }\n\
            // reverse offsets\n\
            if (a && a[0] === '+') {\n\
                config._tzh = -config._tzh;\n\
                config._tzm = -config._tzm;\n\
            }\n\
            break;\n\
        }\n\
\n\
        // if the input is null, the date is not valid\n\
        if (input == null) {\n\
            config._isValid = false;\n\
        }\n\
    }\n\
\n\
    // convert an array to a date.\n\
    // the array should mirror the parameters below\n\
    // note: all values past the year are optional and will default to the lowest possible value.\n\
    // [year, month, day , hour, minute, second, millisecond]\n\
    function dateFromArray(config) {\n\
        var i, date, input = [];\n\
\n\
        if (config._d) {\n\
            return;\n\
        }\n\
\n\
        for (i = 0; i < 7; i++) {\n\
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];\n\
        }\n\
\n\
        // add the offsets to the time to be parsed so that we can have a clean array for checking isValid\n\
        input[3] += config._tzh || 0;\n\
        input[4] += config._tzm || 0;\n\
\n\
        date = new Date(0);\n\
\n\
        if (config._useUTC) {\n\
            date.setUTCFullYear(input[0], input[1], input[2]);\n\
            date.setUTCHours(input[3], input[4], input[5], input[6]);\n\
        } else {\n\
            date.setFullYear(input[0], input[1], input[2]);\n\
            date.setHours(input[3], input[4], input[5], input[6]);\n\
        }\n\
\n\
        config._d = date;\n\
    }\n\
\n\
    // date from string and format string\n\
    function makeDateFromStringAndFormat(config) {\n\
        // This array is used to make a Date, either with `new Date` or `Date.UTC`\n\
        var tokens = config._f.match(formattingTokens),\n\
            string = config._i,\n\
            i, parsedInput;\n\
\n\
        config._a = [];\n\
\n\
        for (i = 0; i < tokens.length; i++) {\n\
            parsedInput = (getParseRegexForToken(tokens[i]).exec(string) || [])[0];\n\
            if (parsedInput) {\n\
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);\n\
            }\n\
            // don't parse if its not a known token\n\
            if (formatTokenFunctions[tokens[i]]) {\n\
                addTimeToArrayFromToken(tokens[i], parsedInput, config);\n\
            }\n\
        }\n\
        // handle am pm\n\
        if (config._isPm && config._a[3] < 12) {\n\
            config._a[3] += 12;\n\
        }\n\
        // if is 12 am, change hours to 0\n\
        if (config._isPm === false && config._a[3] === 12) {\n\
            config._a[3] = 0;\n\
        }\n\
        // return\n\
        dateFromArray(config);\n\
    }\n\
\n\
    // date from string and array of format strings\n\
    function makeDateFromStringAndArray(config) {\n\
        var tempConfig,\n\
            tempMoment,\n\
            bestMoment,\n\
\n\
            scoreToBeat = 99,\n\
            i,\n\
            currentScore;\n\
\n\
        for (i = config._f.length; i > 0; i--) {\n\
            tempConfig = extend({}, config);\n\
            tempConfig._f = config._f[i - 1];\n\
            makeDateFromStringAndFormat(tempConfig);\n\
            tempMoment = new Moment(tempConfig);\n\
\n\
            if (tempMoment.isValid()) {\n\
                bestMoment = tempMoment;\n\
                break;\n\
            }\n\
\n\
            currentScore = compareArrays(tempConfig._a, tempMoment.toArray());\n\
\n\
            if (currentScore < scoreToBeat) {\n\
                scoreToBeat = currentScore;\n\
                bestMoment = tempMoment;\n\
            }\n\
        }\n\
\n\
        extend(config, bestMoment);\n\
    }\n\
\n\
    // date from iso format\n\
    function makeDateFromString(config) {\n\
        var i,\n\
            string = config._i;\n\
        if (isoRegex.exec(string)) {\n\
            config._f = 'YYYY-MM-DDT';\n\
            for (i = 0; i < 4; i++) {\n\
                if (isoTimes[i][1].exec(string)) {\n\
                    config._f += isoTimes[i][0];\n\
                    break;\n\
                }\n\
            }\n\
            if (parseTokenTimezone.exec(string)) {\n\
                config._f += \" Z\";\n\
            }\n\
            makeDateFromStringAndFormat(config);\n\
        } else {\n\
            config._d = new Date(string);\n\
        }\n\
    }\n\
\n\
    function makeDateFromInput(config) {\n\
        var input = config._i,\n\
            matched = aspNetJsonRegex.exec(input);\n\
\n\
        if (input === undefined) {\n\
            config._d = new Date();\n\
        } else if (matched) {\n\
            config._d = new Date(+matched[1]);\n\
        } else if (typeof input === 'string') {\n\
            makeDateFromString(config);\n\
        } else if (isArray(input)) {\n\
            config._a = input.slice(0);\n\
            dateFromArray(config);\n\
        } else {\n\
            config._d = input instanceof Date ? new Date(+input) : new Date(input);\n\
        }\n\
    }\n\
\n\
\n\
    /************************************\n\
        Relative Time\n\
    ************************************/\n\
\n\
\n\
    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize\n\
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, lang) {\n\
        return lang.relativeTime(number || 1, !!withoutSuffix, string, isFuture);\n\
    }\n\
\n\
    function relativeTime(milliseconds, withoutSuffix, lang) {\n\
        var seconds = round(Math.abs(milliseconds) / 1000),\n\
            minutes = round(seconds / 60),\n\
            hours = round(minutes / 60),\n\
            days = round(hours / 24),\n\
            years = round(days / 365),\n\
            args = seconds < 45 && ['s', seconds] ||\n\
                minutes === 1 && ['m'] ||\n\
                minutes < 45 && ['mm', minutes] ||\n\
                hours === 1 && ['h'] ||\n\
                hours < 22 && ['hh', hours] ||\n\
                days === 1 && ['d'] ||\n\
                days <= 25 && ['dd', days] ||\n\
                days <= 45 && ['M'] ||\n\
                days < 345 && ['MM', round(days / 30)] ||\n\
                years === 1 && ['y'] || ['yy', years];\n\
        args[2] = withoutSuffix;\n\
        args[3] = milliseconds > 0;\n\
        args[4] = lang;\n\
        return substituteTimeAgo.apply({}, args);\n\
    }\n\
\n\
\n\
    /************************************\n\
        Week of Year\n\
    ************************************/\n\
\n\
\n\
    // firstDayOfWeek       0 = sun, 6 = sat\n\
    //                      the day of the week that starts the week\n\
    //                      (usually sunday or monday)\n\
    // firstDayOfWeekOfYear 0 = sun, 6 = sat\n\
    //                      the first week is the week that contains the first\n\
    //                      of this day of the week\n\
    //                      (eg. ISO weeks use thursday (4))\n\
    function weekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {\n\
        var end = firstDayOfWeekOfYear - firstDayOfWeek,\n\
            daysToDayOfWeek = firstDayOfWeekOfYear - mom.day();\n\
\n\
\n\
        if (daysToDayOfWeek > end) {\n\
            daysToDayOfWeek -= 7;\n\
        }\n\
\n\
        if (daysToDayOfWeek < end - 7) {\n\
            daysToDayOfWeek += 7;\n\
        }\n\
\n\
        return Math.ceil(moment(mom).add('d', daysToDayOfWeek).dayOfYear() / 7);\n\
    }\n\
\n\
\n\
    /************************************\n\
        Top Level Functions\n\
    ************************************/\n\
\n\
    function makeMoment(config) {\n\
        var input = config._i,\n\
            format = config._f;\n\
\n\
        if (input === null || input === '') {\n\
            return null;\n\
        }\n\
\n\
        if (typeof input === 'string') {\n\
            config._i = input = getLangDefinition().preparse(input);\n\
        }\n\
\n\
        if (moment.isMoment(input)) {\n\
            config = extend({}, input);\n\
            config._d = new Date(+input._d);\n\
        } else if (format) {\n\
            if (isArray(format)) {\n\
                makeDateFromStringAndArray(config);\n\
            } else {\n\
                makeDateFromStringAndFormat(config);\n\
            }\n\
        } else {\n\
            makeDateFromInput(config);\n\
        }\n\
\n\
        return new Moment(config);\n\
    }\n\
\n\
    moment = function (input, format, lang) {\n\
        return makeMoment({\n\
            _i : input,\n\
            _f : format,\n\
            _l : lang,\n\
            _isUTC : false\n\
        });\n\
    };\n\
\n\
    // creating with utc\n\
    moment.utc = function (input, format, lang) {\n\
        return makeMoment({\n\
            _useUTC : true,\n\
            _isUTC : true,\n\
            _l : lang,\n\
            _i : input,\n\
            _f : format\n\
        });\n\
    };\n\
\n\
    // creating with unix timestamp (in seconds)\n\
    moment.unix = function (input) {\n\
        return moment(input * 1000);\n\
    };\n\
\n\
    // duration\n\
    moment.duration = function (input, key) {\n\
        var isDuration = moment.isDuration(input),\n\
            isNumber = (typeof input === 'number'),\n\
            duration = (isDuration ? input._data : (isNumber ? {} : input)),\n\
            ret;\n\
\n\
        if (isNumber) {\n\
            if (key) {\n\
                duration[key] = input;\n\
            } else {\n\
                duration.milliseconds = input;\n\
            }\n\
        }\n\
\n\
        ret = new Duration(duration);\n\
\n\
        if (isDuration && input.hasOwnProperty('_lang')) {\n\
            ret._lang = input._lang;\n\
        }\n\
\n\
        return ret;\n\
    };\n\
\n\
    // version number\n\
    moment.version = VERSION;\n\
\n\
    // default format\n\
    moment.defaultFormat = isoFormat;\n\
\n\
    // This function will load languages and then set the global language.  If\n\
    // no arguments are passed in, it will simply return the current global\n\
    // language key.\n\
    moment.lang = function (key, values) {\n\
        var i;\n\
\n\
        if (!key) {\n\
            return moment.fn._lang._abbr;\n\
        }\n\
        if (values) {\n\
            loadLang(key, values);\n\
        } else if (!languages[key]) {\n\
            getLangDefinition(key);\n\
        }\n\
        moment.duration.fn._lang = moment.fn._lang = getLangDefinition(key);\n\
    };\n\
\n\
    // returns language data\n\
    moment.langData = function (key) {\n\
        if (key && key._lang && key._lang._abbr) {\n\
            key = key._lang._abbr;\n\
        }\n\
        return getLangDefinition(key);\n\
    };\n\
\n\
    // compare moment object\n\
    moment.isMoment = function (obj) {\n\
        return obj instanceof Moment;\n\
    };\n\
\n\
    // for typechecking Duration objects\n\
    moment.isDuration = function (obj) {\n\
        return obj instanceof Duration;\n\
    };\n\
\n\
\n\
    /************************************\n\
        Moment Prototype\n\
    ************************************/\n\
\n\
\n\
    moment.fn = Moment.prototype = {\n\
\n\
        clone : function () {\n\
            return moment(this);\n\
        },\n\
\n\
        valueOf : function () {\n\
            return +this._d;\n\
        },\n\
\n\
        unix : function () {\n\
            return Math.floor(+this._d / 1000);\n\
        },\n\
\n\
        toString : function () {\n\
            return this.format(\"ddd MMM DD YYYY HH:mm:ss [GMT]ZZ\");\n\
        },\n\
\n\
        toDate : function () {\n\
            return this._d;\n\
        },\n\
\n\
        toJSON : function () {\n\
            return moment.utc(this).format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');\n\
        },\n\
\n\
        toArray : function () {\n\
            var m = this;\n\
            return [\n\
                m.year(),\n\
                m.month(),\n\
                m.date(),\n\
                m.hours(),\n\
                m.minutes(),\n\
                m.seconds(),\n\
                m.milliseconds()\n\
            ];\n\
        },\n\
\n\
        isValid : function () {\n\
            if (this._isValid == null) {\n\
                if (this._a) {\n\
                    this._isValid = !compareArrays(this._a, (this._isUTC ? moment.utc(this._a) : moment(this._a)).toArray());\n\
                } else {\n\
                    this._isValid = !isNaN(this._d.getTime());\n\
                }\n\
            }\n\
            return !!this._isValid;\n\
        },\n\
\n\
        utc : function () {\n\
            this._isUTC = true;\n\
            return this;\n\
        },\n\
\n\
        local : function () {\n\
            this._isUTC = false;\n\
            return this;\n\
        },\n\
\n\
        format : function (inputString) {\n\
            var output = formatMoment(this, inputString || moment.defaultFormat);\n\
            return this.lang().postformat(output);\n\
        },\n\
\n\
        add : function (input, val) {\n\
            var dur;\n\
            // switch args to support add('s', 1) and add(1, 's')\n\
            if (typeof input === 'string') {\n\
                dur = moment.duration(+val, input);\n\
            } else {\n\
                dur = moment.duration(input, val);\n\
            }\n\
            addOrSubtractDurationFromMoment(this, dur, 1);\n\
            return this;\n\
        },\n\
\n\
        subtract : function (input, val) {\n\
            var dur;\n\
            // switch args to support subtract('s', 1) and subtract(1, 's')\n\
            if (typeof input === 'string') {\n\
                dur = moment.duration(+val, input);\n\
            } else {\n\
                dur = moment.duration(input, val);\n\
            }\n\
            addOrSubtractDurationFromMoment(this, dur, -1);\n\
            return this;\n\
        },\n\
\n\
        diff : function (input, units, asFloat) {\n\
            var that = this._isUTC ? moment(input).utc() : moment(input).local(),\n\
                zoneDiff = (this.zone() - that.zone()) * 6e4,\n\
                diff, output;\n\
\n\
            if (units) {\n\
                // standardize on singular form\n\
                units = units.replace(/s$/, '');\n\
            }\n\
\n\
            if (units === 'year' || units === 'month') {\n\
                diff = (this.daysInMonth() + that.daysInMonth()) * 432e5; // 24 * 60 * 60 * 1000 / 2\n\
                output = ((this.year() - that.year()) * 12) + (this.month() - that.month());\n\
                output += ((this - moment(this).startOf('month')) - (that - moment(that).startOf('month'))) / diff;\n\
                if (units === 'year') {\n\
                    output = output / 12;\n\
                }\n\
            } else {\n\
                diff = (this - that) - zoneDiff;\n\
                output = units === 'second' ? diff / 1e3 : // 1000\n\
                    units === 'minute' ? diff / 6e4 : // 1000 * 60\n\
                    units === 'hour' ? diff / 36e5 : // 1000 * 60 * 60\n\
                    units === 'day' ? diff / 864e5 : // 1000 * 60 * 60 * 24\n\
                    units === 'week' ? diff / 6048e5 : // 1000 * 60 * 60 * 24 * 7\n\
                    diff;\n\
            }\n\
            return asFloat ? output : absRound(output);\n\
        },\n\
\n\
        from : function (time, withoutSuffix) {\n\
            return moment.duration(this.diff(time)).lang(this.lang()._abbr).humanize(!withoutSuffix);\n\
        },\n\
\n\
        fromNow : function (withoutSuffix) {\n\
            return this.from(moment(), withoutSuffix);\n\
        },\n\
\n\
        calendar : function () {\n\
            var diff = this.diff(moment().startOf('day'), 'days', true),\n\
                format = diff < -6 ? 'sameElse' :\n\
                diff < -1 ? 'lastWeek' :\n\
                diff < 0 ? 'lastDay' :\n\
                diff < 1 ? 'sameDay' :\n\
                diff < 2 ? 'nextDay' :\n\
                diff < 7 ? 'nextWeek' : 'sameElse';\n\
            return this.format(this.lang().calendar(format, this));\n\
        },\n\
\n\
        isLeapYear : function () {\n\
            var year = this.year();\n\
            return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;\n\
        },\n\
\n\
        isDST : function () {\n\
            return (this.zone() < moment([this.year()]).zone() ||\n\
                this.zone() < moment([this.year(), 5]).zone());\n\
        },\n\
\n\
        day : function (input) {\n\
            var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();\n\
            return input == null ? day :\n\
                this.add({ d : input - day });\n\
        },\n\
\n\
        startOf: function (units) {\n\
            units = units.replace(/s$/, '');\n\
            // the following switch intentionally omits break keywords\n\
            // to utilize falling through the cases.\n\
            switch (units) {\n\
            case 'year':\n\
                this.month(0);\n\
                /* falls through */\n\
            case 'month':\n\
                this.date(1);\n\
                /* falls through */\n\
            case 'week':\n\
            case 'day':\n\
                this.hours(0);\n\
                /* falls through */\n\
            case 'hour':\n\
                this.minutes(0);\n\
                /* falls through */\n\
            case 'minute':\n\
                this.seconds(0);\n\
                /* falls through */\n\
            case 'second':\n\
                this.milliseconds(0);\n\
                /* falls through */\n\
            }\n\
\n\
            // weeks are a special case\n\
            if (units === 'week') {\n\
                this.day(0);\n\
            }\n\
\n\
            return this;\n\
        },\n\
\n\
        endOf: function (units) {\n\
            return this.startOf(units).add(units.replace(/s?$/, 's'), 1).subtract('ms', 1);\n\
        },\n\
\n\
        isAfter: function (input, units) {\n\
            units = typeof units !== 'undefined' ? units : 'millisecond';\n\
            return +this.clone().startOf(units) > +moment(input).startOf(units);\n\
        },\n\
\n\
        isBefore: function (input, units) {\n\
            units = typeof units !== 'undefined' ? units : 'millisecond';\n\
            return +this.clone().startOf(units) < +moment(input).startOf(units);\n\
        },\n\
\n\
        isSame: function (input, units) {\n\
            units = typeof units !== 'undefined' ? units : 'millisecond';\n\
            return +this.clone().startOf(units) === +moment(input).startOf(units);\n\
        },\n\
\n\
        zone : function () {\n\
            return this._isUTC ? 0 : this._d.getTimezoneOffset();\n\
        },\n\
\n\
        daysInMonth : function () {\n\
            return moment.utc([this.year(), this.month() + 1, 0]).date();\n\
        },\n\
\n\
        dayOfYear : function (input) {\n\
            var dayOfYear = round((moment(this).startOf('day') - moment(this).startOf('year')) / 864e5) + 1;\n\
            return input == null ? dayOfYear : this.add(\"d\", (input - dayOfYear));\n\
        },\n\
\n\
        isoWeek : function (input) {\n\
            var week = weekOfYear(this, 1, 4);\n\
            return input == null ? week : this.add(\"d\", (input - week) * 7);\n\
        },\n\
\n\
        week : function (input) {\n\
            var week = this.lang().week(this);\n\
            return input == null ? week : this.add(\"d\", (input - week) * 7);\n\
        },\n\
\n\
        // If passed a language key, it will set the language for this\n\
        // instance.  Otherwise, it will return the language configuration\n\
        // variables for this instance.\n\
        lang : function (key) {\n\
            if (key === undefined) {\n\
                return this._lang;\n\
            } else {\n\
                this._lang = getLangDefinition(key);\n\
                return this;\n\
            }\n\
        }\n\
    };\n\
\n\
    // helper for adding shortcuts\n\
    function makeGetterAndSetter(name, key) {\n\
        moment.fn[name] = moment.fn[name + 's'] = function (input) {\n\
            var utc = this._isUTC ? 'UTC' : '';\n\
            if (input != null) {\n\
                this._d['set' + utc + key](input);\n\
                return this;\n\
            } else {\n\
                return this._d['get' + utc + key]();\n\
            }\n\
        };\n\
    }\n\
\n\
    // loop through and add shortcuts (Month, Date, Hours, Minutes, Seconds, Milliseconds)\n\
    for (i = 0; i < proxyGettersAndSetters.length; i ++) {\n\
        makeGetterAndSetter(proxyGettersAndSetters[i].toLowerCase().replace(/s$/, ''), proxyGettersAndSetters[i]);\n\
    }\n\
\n\
    // add shortcut for year (uses different syntax than the getter/setter 'year' == 'FullYear')\n\
    makeGetterAndSetter('year', 'FullYear');\n\
\n\
    // add plural methods\n\
    moment.fn.days = moment.fn.day;\n\
    moment.fn.weeks = moment.fn.week;\n\
    moment.fn.isoWeeks = moment.fn.isoWeek;\n\
\n\
    /************************************\n\
        Duration Prototype\n\
    ************************************/\n\
\n\
\n\
    moment.duration.fn = Duration.prototype = {\n\
        weeks : function () {\n\
            return absRound(this.days() / 7);\n\
        },\n\
\n\
        valueOf : function () {\n\
            return this._milliseconds +\n\
              this._days * 864e5 +\n\
              this._months * 2592e6;\n\
        },\n\
\n\
        humanize : function (withSuffix) {\n\
            var difference = +this,\n\
                output = relativeTime(difference, !withSuffix, this.lang());\n\
\n\
            if (withSuffix) {\n\
                output = this.lang().pastFuture(difference, output);\n\
            }\n\
\n\
            return this.lang().postformat(output);\n\
        },\n\
\n\
        lang : moment.fn.lang\n\
    };\n\
\n\
    function makeDurationGetter(name) {\n\
        moment.duration.fn[name] = function () {\n\
            return this._data[name];\n\
        };\n\
    }\n\
\n\
    function makeDurationAsGetter(name, factor) {\n\
        moment.duration.fn['as' + name] = function () {\n\
            return +this / factor;\n\
        };\n\
    }\n\
\n\
    for (i in unitMillisecondFactors) {\n\
        if (unitMillisecondFactors.hasOwnProperty(i)) {\n\
            makeDurationAsGetter(i, unitMillisecondFactors[i]);\n\
            makeDurationGetter(i.toLowerCase());\n\
        }\n\
    }\n\
\n\
    makeDurationAsGetter('Weeks', 6048e5);\n\
\n\
\n\
    /************************************\n\
        Default Lang\n\
    ************************************/\n\
\n\
\n\
    // Set default language, other languages will inherit from English.\n\
    moment.lang('en', {\n\
        ordinal : function (number) {\n\
            var b = number % 10,\n\
                output = (~~ (number % 100 / 10) === 1) ? 'th' :\n\
                (b === 1) ? 'st' :\n\
                (b === 2) ? 'nd' :\n\
                (b === 3) ? 'rd' : 'th';\n\
            return number + output;\n\
        }\n\
    });\n\
\n\
\n\
    /************************************\n\
        Exposing Moment\n\
    ************************************/\n\
\n\
\n\
    // CommonJS module is defined\n\
    if (hasModule) {\n\
        module.exports = moment;\n\
    }\n\
    /*global ender:false */\n\
    if (typeof ender === 'undefined') {\n\
        // here, `this` means `window` in the browser, or `global` on the server\n\
        // add `moment` as a global object via a string identifier,\n\
        // for Closure Compiler \"advanced\" mode\n\
        this['moment'] = moment;\n\
    }\n\
    /*global define:false */\n\
    if (typeof define === \"function\" && define.amd) {\n\
        define(\"moment\", [], function () {\n\
            return moment;\n\
        });\n\
    }\n\
}).call(this);\n\
//@ sourceURL=component-moment/index.js"
));
require.register("component-indexof/index.js", Function("exports, require, module",
"module.exports = function(arr, obj){\n\
  if (arr.indexOf) return arr.indexOf(obj);\n\
  for (var i = 0; i < arr.length; ++i) {\n\
    if (arr[i] === obj) return i;\n\
  }\n\
  return -1;\n\
};//@ sourceURL=component-indexof/index.js"
));
require.register("component-classes/index.js", Function("exports, require, module",
"/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var index = require('indexof');\n\
\n\
/**\n\
 * Whitespace regexp.\n\
 */\n\
\n\
var re = /\\s+/;\n\
\n\
/**\n\
 * toString reference.\n\
 */\n\
\n\
var toString = Object.prototype.toString;\n\
\n\
/**\n\
 * Wrap `el` in a `ClassList`.\n\
 *\n\
 * @param {Element} el\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(el){\n\
  return new ClassList(el);\n\
};\n\
\n\
/**\n\
 * Initialize a new ClassList for `el`.\n\
 *\n\
 * @param {Element} el\n\
 * @api private\n\
 */\n\
\n\
function ClassList(el) {\n\
  if (!el) throw new Error('A DOM element reference is required');\n\
  this.el = el;\n\
  this.list = el.classList;\n\
}\n\
\n\
/**\n\
 * Add class `name` if not already present.\n\
 *\n\
 * @param {String} name\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.add = function(name){\n\
  // classList\n\
  if (this.list) {\n\
    this.list.add(name);\n\
    return this;\n\
  }\n\
\n\
  // fallback\n\
  var arr = this.array();\n\
  var i = index(arr, name);\n\
  if (!~i) arr.push(name);\n\
  this.el.className = arr.join(' ');\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Remove class `name` when present, or\n\
 * pass a regular expression to remove\n\
 * any which match.\n\
 *\n\
 * @param {String|RegExp} name\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.remove = function(name){\n\
  if ('[object RegExp]' == toString.call(name)) {\n\
    return this.removeMatching(name);\n\
  }\n\
\n\
  // classList\n\
  if (this.list) {\n\
    this.list.remove(name);\n\
    return this;\n\
  }\n\
\n\
  // fallback\n\
  var arr = this.array();\n\
  var i = index(arr, name);\n\
  if (~i) arr.splice(i, 1);\n\
  this.el.className = arr.join(' ');\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Remove all classes matching `re`.\n\
 *\n\
 * @param {RegExp} re\n\
 * @return {ClassList}\n\
 * @api private\n\
 */\n\
\n\
ClassList.prototype.removeMatching = function(re){\n\
  var arr = this.array();\n\
  for (var i = 0; i < arr.length; i++) {\n\
    if (re.test(arr[i])) {\n\
      this.remove(arr[i]);\n\
    }\n\
  }\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Toggle class `name`.\n\
 *\n\
 * @param {String} name\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.toggle = function(name){\n\
  // classList\n\
  if (this.list) {\n\
    this.list.toggle(name);\n\
    return this;\n\
  }\n\
\n\
  // fallback\n\
  if (this.has(name)) {\n\
    this.remove(name);\n\
  } else {\n\
    this.add(name);\n\
  }\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Return an array of classes.\n\
 *\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.array = function(){\n\
  var str = this.el.className.replace(/^\\s+|\\s+$/g, '');\n\
  var arr = str.split(re);\n\
  if ('' === arr[0]) arr.shift();\n\
  return arr;\n\
};\n\
\n\
/**\n\
 * Check if class `name` is present.\n\
 *\n\
 * @param {String} name\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.has =\n\
ClassList.prototype.contains = function(name){\n\
  return this.list\n\
    ? this.list.contains(name)\n\
    : !! ~index(this.array(), name);\n\
};\n\
//@ sourceURL=component-classes/index.js"
));
require.register("component-domify/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `parse`.\n\
 */\n\
\n\
module.exports = parse;\n\
\n\
/**\n\
 * Wrap map from jquery.\n\
 */\n\
\n\
var map = {\n\
  option: [1, '<select multiple=\"multiple\">', '</select>'],\n\
  optgroup: [1, '<select multiple=\"multiple\">', '</select>'],\n\
  legend: [1, '<fieldset>', '</fieldset>'],\n\
  thead: [1, '<table>', '</table>'],\n\
  tbody: [1, '<table>', '</table>'],\n\
  tfoot: [1, '<table>', '</table>'],\n\
  colgroup: [1, '<table>', '</table>'],\n\
  caption: [1, '<table>', '</table>'],\n\
  tr: [2, '<table><tbody>', '</tbody></table>'],\n\
  td: [3, '<table><tbody><tr>', '</tr></tbody></table>'],\n\
  th: [3, '<table><tbody><tr>', '</tr></tbody></table>'],\n\
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],\n\
  _default: [0, '', '']\n\
};\n\
\n\
/**\n\
 * Parse `html` and return the children.\n\
 *\n\
 * @param {String} html\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
function parse(html) {\n\
  if ('string' != typeof html) throw new TypeError('String expected');\n\
\n\
  html = html.replace(/^\\s+|\\s+$/g, ''); // Remove leading/trailing whitespace\n\
\n\
  // tag name\n\
  var m = /<([\\w:]+)/.exec(html);\n\
  if (!m) return document.createTextNode(html);\n\
  var tag = m[1];\n\
\n\
  // body support\n\
  if (tag == 'body') {\n\
    var el = document.createElement('html');\n\
    el.innerHTML = html;\n\
    return el.removeChild(el.lastChild);\n\
  }\n\
\n\
  // wrap map\n\
  var wrap = map[tag] || map._default;\n\
  var depth = wrap[0];\n\
  var prefix = wrap[1];\n\
  var suffix = wrap[2];\n\
  var el = document.createElement('div');\n\
  el.innerHTML = prefix + html + suffix;\n\
  while (depth--) el = el.lastChild;\n\
\n\
  // Note: when moving children, don't rely on el.children\n\
  // being 'live' to support Polymer's broken behaviour.\n\
  // See: https://github.com/component/domify/pull/23\n\
  if (1 == el.children.length) {\n\
    return el.removeChild(el.children[0]);\n\
  }\n\
\n\
  var fragment = document.createDocumentFragment();\n\
  while (el.children.length) {\n\
    fragment.appendChild(el.removeChild(el.children[0]));\n\
  }\n\
\n\
  return fragment;\n\
}\n\
//@ sourceURL=component-domify/index.js"
));
require.register("component-emitter/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `Emitter`.\n\
 */\n\
\n\
module.exports = Emitter;\n\
\n\
/**\n\
 * Initialize a new `Emitter`.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
function Emitter(obj) {\n\
  if (obj) return mixin(obj);\n\
};\n\
\n\
/**\n\
 * Mixin the emitter properties.\n\
 *\n\
 * @param {Object} obj\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
function mixin(obj) {\n\
  for (var key in Emitter.prototype) {\n\
    obj[key] = Emitter.prototype[key];\n\
  }\n\
  return obj;\n\
}\n\
\n\
/**\n\
 * Listen on the given `event` with `fn`.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.on =\n\
Emitter.prototype.addEventListener = function(event, fn){\n\
  this._callbacks = this._callbacks || {};\n\
  (this._callbacks[event] = this._callbacks[event] || [])\n\
    .push(fn);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Adds an `event` listener that will be invoked a single\n\
 * time then automatically removed.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.once = function(event, fn){\n\
  var self = this;\n\
  this._callbacks = this._callbacks || {};\n\
\n\
  function on() {\n\
    self.off(event, on);\n\
    fn.apply(this, arguments);\n\
  }\n\
\n\
  on.fn = fn;\n\
  this.on(event, on);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Remove the given callback for `event` or all\n\
 * registered callbacks.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.off =\n\
Emitter.prototype.removeListener =\n\
Emitter.prototype.removeAllListeners =\n\
Emitter.prototype.removeEventListener = function(event, fn){\n\
  this._callbacks = this._callbacks || {};\n\
\n\
  // all\n\
  if (0 == arguments.length) {\n\
    this._callbacks = {};\n\
    return this;\n\
  }\n\
\n\
  // specific event\n\
  var callbacks = this._callbacks[event];\n\
  if (!callbacks) return this;\n\
\n\
  // remove all handlers\n\
  if (1 == arguments.length) {\n\
    delete this._callbacks[event];\n\
    return this;\n\
  }\n\
\n\
  // remove specific handler\n\
  var cb;\n\
  for (var i = 0; i < callbacks.length; i++) {\n\
    cb = callbacks[i];\n\
    if (cb === fn || cb.fn === fn) {\n\
      callbacks.splice(i, 1);\n\
      break;\n\
    }\n\
  }\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Emit `event` with the given args.\n\
 *\n\
 * @param {String} event\n\
 * @param {Mixed} ...\n\
 * @return {Emitter}\n\
 */\n\
\n\
Emitter.prototype.emit = function(event){\n\
  this._callbacks = this._callbacks || {};\n\
  var args = [].slice.call(arguments, 1)\n\
    , callbacks = this._callbacks[event];\n\
\n\
  if (callbacks) {\n\
    callbacks = callbacks.slice(0);\n\
    for (var i = 0, len = callbacks.length; i < len; ++i) {\n\
      callbacks[i].apply(this, args);\n\
    }\n\
  }\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Return array of callbacks for `event`.\n\
 *\n\
 * @param {String} event\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.listeners = function(event){\n\
  this._callbacks = this._callbacks || {};\n\
  return this._callbacks[event] || [];\n\
};\n\
\n\
/**\n\
 * Check if this emitter has `event` handlers.\n\
 *\n\
 * @param {String} event\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.hasListeners = function(event){\n\
  return !! this.listeners(event).length;\n\
};\n\
//@ sourceURL=component-emitter/index.js"
));
require.register("component-event/index.js", Function("exports, require, module",
"var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',\n\
    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',\n\
    prefix = bind !== 'addEventListener' ? 'on' : '';\n\
\n\
/**\n\
 * Bind `el` event `type` to `fn`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
exports.bind = function(el, type, fn, capture){\n\
  el[bind](prefix + type, fn, capture || false);\n\
\n\
  return fn;\n\
};\n\
\n\
/**\n\
 * Unbind `el` event `type`'s callback `fn`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
exports.unbind = function(el, type, fn, capture){\n\
  el[unbind](prefix + type, fn, capture || false);\n\
\n\
  return fn;\n\
};//@ sourceURL=component-event/index.js"
));
require.register("ianstormtaylor-redraw/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `redraw`.\n\
 */\n\
\n\
module.exports = redraw;\n\
\n\
\n\
/**\n\
 * Force a redraw on an `el`.\n\
 *\n\
 * @param {Element} el\n\
 */\n\
\n\
function redraw (el) {\n\
  el.offsetHeight;\n\
}//@ sourceURL=ianstormtaylor-redraw/index.js"
));
require.register("jkroso-classes/index.js", Function("exports, require, module",
"\n\
module.exports = document.createElement('div').classList\n\
  ? require('./modern')\n\
  : require('./fallback')//@ sourceURL=jkroso-classes/index.js"
));
require.register("jkroso-classes/fallback.js", Function("exports, require, module",
"\n\
var index = require('indexof')\n\
\n\
exports.add = function(name, el){\n\
\tvar arr = exports.array(el)\n\
\tif (index(arr, name) < 0) {\n\
\t\tarr.push(name)\n\
\t\tel.className = arr.join(' ')\n\
\t}\n\
}\n\
\n\
exports.remove = function(name, el){\n\
\tif (name instanceof RegExp) {\n\
\t\treturn exports.removeMatching(name, el)\n\
\t}\n\
\tvar arr = exports.array(el)\n\
\tvar i = index(arr, name)\n\
\tif (i >= 0) {\n\
\t\tarr.splice(i, 1)\n\
\t\tel.className = arr.join(' ')\n\
\t}\n\
}\n\
\n\
exports.removeMatching = function(re, el){\n\
\tvar arr = exports.array(el)\n\
\tfor (var i = 0; i < arr.length;) {\n\
\t\tif (re.test(arr[i])) arr.splice(i, 1)\n\
\t\telse i++\n\
\t}\n\
\tel.className = arr.join(' ')\n\
}\n\
\n\
exports.toggle = function(name, el){\n\
\tif (exports.has(name, el)) {\n\
\t\texports.remove(name, el)\n\
\t} else {\n\
\t\texports.add(name, el)\n\
\t}\n\
}\n\
\n\
exports.array = function(el){\n\
\treturn el.className.match(/([^\\s]+)/g) || []\n\
}\n\
\n\
exports.has =\n\
exports.contains = function(name, el){\n\
\treturn index(exports.array(el), name) >= 0\n\
}//@ sourceURL=jkroso-classes/fallback.js"
));
require.register("jkroso-classes/modern.js", Function("exports, require, module",
"\n\
/**\n\
 * Add class `name` if not already present.\n\
 *\n\
 * @param {String} name\n\
 * @param {Element} el\n\
 * @api public\n\
 */\n\
\n\
exports.add = function(name, el){\n\
\tel.classList.add(name)\n\
}\n\
\n\
/**\n\
 * Remove `name` if present\n\
 *\n\
 * @param {String|RegExp} name\n\
 * @param {Element} el\n\
 * @api public\n\
 */\n\
\n\
exports.remove = function(name, el){\n\
\tif (name instanceof RegExp) {\n\
\t\treturn exports.removeMatching(name, el)\n\
\t}\n\
\tel.classList.remove(name)\n\
}\n\
\n\
/**\n\
 * Remove all classes matching `re`.\n\
 *\n\
 * @param {RegExp} re\n\
 * @param {Element} el\n\
 * @api public\n\
 */\n\
\n\
exports.removeMatching = function(re, el){\n\
\tvar arr = exports.array(el)\n\
\tfor (var i = 0; i < arr.length; i++) {\n\
\t\tif (re.test(arr[i])) el.classList.remove(arr[i])\n\
\t}\n\
}\n\
\n\
/**\n\
 * Toggle class `name`.\n\
 *\n\
 * @param {String} name\n\
 * @param {Element} el\n\
 * @api public\n\
 */\n\
\n\
exports.toggle = function(name, el){\n\
\tel.classList.toggle(name)\n\
}\n\
\n\
/**\n\
 * Return an array of classes.\n\
 *\n\
 * @param {Element} el\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
exports.array = function(el){\n\
\treturn el.className.match(/([^\\s]+)/g) || []\n\
}\n\
\n\
/**\n\
 * Check if class `name` is present.\n\
 *\n\
 * @param {String} name\n\
 * @param {Element} el\n\
 * @api public\n\
 */\n\
\n\
exports.has =\n\
exports.contains = function(name, el){\n\
\treturn el.classList.contains(name)\n\
}//@ sourceURL=jkroso-classes/modern.js"
));
require.register("ianstormtaylor-classes/index.js", Function("exports, require, module",
"\n\
var classes = require('classes');\n\
\n\
\n\
/**\n\
 * Expose `mixin`.\n\
 */\n\
\n\
module.exports = exports = mixin;\n\
\n\
\n\
/**\n\
 * Mixin the classes methods.\n\
 *\n\
 * @param {Object} object\n\
 * @return {Object}\n\
 */\n\
\n\
function mixin (obj) {\n\
  for (var method in exports) obj[method] = exports[method];\n\
  return obj;\n\
}\n\
\n\
\n\
/**\n\
 * Add a class.\n\
 *\n\
 * @param {String} name\n\
 * @return {Object}\n\
 */\n\
\n\
exports.addClass = function (name) {\n\
  classes.add(name, this.el);\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Remove a class.\n\
 *\n\
 * @param {String} name\n\
 * @return {Object}\n\
 */\n\
\n\
exports.removeClass = function (name) {\n\
  classes.remove(name, this.el);\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Has a class?\n\
 *\n\
 * @param {String} name\n\
 * @return {Boolean}\n\
 */\n\
\n\
exports.hasClass = function (name) {\n\
  return classes.has(name, this.el);\n\
};\n\
\n\
\n\
/**\n\
 * Toggle a class.\n\
 *\n\
 * @param {String} name\n\
 * @return {Object}\n\
 */\n\
\n\
exports.toggleClass = function (name) {\n\
  classes.toggle(name, this.el);\n\
  return this;\n\
};\n\
//@ sourceURL=ianstormtaylor-classes/index.js"
));
require.register("component-bind/index.js", Function("exports, require, module",
"/**\n\
 * Slice reference.\n\
 */\n\
\n\
var slice = [].slice;\n\
\n\
/**\n\
 * Bind `obj` to `fn`.\n\
 *\n\
 * @param {Object} obj\n\
 * @param {Function|String} fn or string\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(obj, fn){\n\
  if ('string' == typeof fn) fn = obj[fn];\n\
  if ('function' != typeof fn) throw new Error('bind() requires a function');\n\
  var args = slice.call(arguments, 2);\n\
  return function(){\n\
    return fn.apply(obj, args.concat(slice.call(arguments)));\n\
  }\n\
};\n\
//@ sourceURL=component-bind/index.js"
));
require.register("component-type/index.js", Function("exports, require, module",
"\n\
/**\n\
 * toString ref.\n\
 */\n\
\n\
var toString = Object.prototype.toString;\n\
\n\
/**\n\
 * Return the type of `val`.\n\
 *\n\
 * @param {Mixed} val\n\
 * @return {String}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(val){\n\
  switch (toString.call(val)) {\n\
    case '[object Function]': return 'function';\n\
    case '[object Date]': return 'date';\n\
    case '[object RegExp]': return 'regexp';\n\
    case '[object Arguments]': return 'arguments';\n\
    case '[object Array]': return 'array';\n\
    case '[object String]': return 'string';\n\
  }\n\
\n\
  if (val === null) return 'null';\n\
  if (val === undefined) return 'undefined';\n\
  if (val && val.nodeType === 1) return 'element';\n\
  if (val === Object(val)) return 'object';\n\
\n\
  return typeof val;\n\
};\n\
//@ sourceURL=component-type/index.js"
));
require.register("segmentio-bind-all/index.js", Function("exports, require, module",
"\n\
try {\n\
  var bind = require('bind');\n\
  var type = require('type');\n\
} catch (e) {\n\
  var bind = require('bind-component');\n\
  var type = require('type-component');\n\
}\n\
\n\
module.exports = function (obj) {\n\
  for (var key in obj) {\n\
    var val = obj[key];\n\
    if (type(val) === 'function') obj[key] = bind(obj, obj[key]);\n\
  }\n\
  return obj;\n\
};//@ sourceURL=segmentio-bind-all/index.js"
));
require.register("segmentio-on-escape/index.js", Function("exports, require, module",
"\n\
var bind = require('event').bind\n\
  , indexOf = require('indexof');\n\
\n\
\n\
/**\n\
 * Expose `onEscape`.\n\
 */\n\
\n\
module.exports = exports = onEscape;\n\
\n\
\n\
/**\n\
 * Handlers.\n\
 */\n\
\n\
var fns = [];\n\
\n\
\n\
/**\n\
 * Escape binder.\n\
 *\n\
 * @param {Function} fn\n\
 */\n\
\n\
function onEscape (fn) {\n\
  fns.push(fn);\n\
}\n\
\n\
\n\
/**\n\
 * Bind a handler, for symmetry.\n\
 */\n\
\n\
exports.bind = onEscape;\n\
\n\
\n\
/**\n\
 * Unbind a handler.\n\
 *\n\
 * @param {Function} fn\n\
 */\n\
\n\
exports.unbind = function (fn) {\n\
  var index = indexOf(fns, fn);\n\
  if (index !== -1) fns.splice(index, 1);\n\
};\n\
\n\
\n\
/**\n\
 * Bind to `document` once.\n\
 */\n\
\n\
bind(document, 'keydown', function (e) {\n\
  if (27 !== e.keyCode) return;\n\
  for (var i = 0, fn; fn = fns[i]; i++) fn(e);\n\
});//@ sourceURL=segmentio-on-escape/index.js"
));
require.register("segmentio-overlay/lib/index.js", Function("exports, require, module",
"\n\
var after = require('after-transition').once\n\
  , bindAll = require('bind-all')\n\
  , Classes = require('classes')\n\
  , domify = require('domify')\n\
  , Emitter = require('emitter')\n\
  , escape = require('on-escape')\n\
  , event = require('event')\n\
  , redraw = require('redraw')\n\
  , template = require('./index.html');\n\
\n\
\n\
/**\n\
 * Expose `Overlay`.\n\
 */\n\
\n\
module.exports = Overlay;\n\
\n\
\n\
/**\n\
 * Initialize a new `Overlay`.\n\
 *\n\
 * @param {Element} target (optional)\n\
 */\n\
\n\
function Overlay (target) {\n\
  if (!(this instanceof Overlay)) return new Overlay(target);\n\
  bindAll(this);\n\
  this.el = domify(template);\n\
  if (!target) {\n\
    target = document.body;\n\
    this.addClass('fixed');\n\
  }\n\
  target.appendChild(this.el);\n\
  redraw(this.el); // to force an initial show to take\n\
}\n\
\n\
\n\
/**\n\
 * Mixin emitter.\n\
 */\n\
\n\
Emitter(Overlay.prototype);\n\
\n\
\n\
/**\n\
 * Mixin classes.\n\
 */\n\
\n\
Classes(Overlay.prototype);\n\
\n\
\n\
/**\n\
 * Show the overlay.\n\
 *\n\
 * @param {Function} callback\n\
 * @return {Overlay}\n\
 */\n\
\n\
Overlay.prototype.show = function (callback) {\n\
  var visible = ! this.hasClass('hidden');\n\
  var showing = this.hasClass('showing');\n\
\n\
  if('function' === typeof callback) {\n\
    visible && !showing ? callback() : this.once('show', callback);\n\
  }\n\
\n\
  if (visible || showing) return this;\n\
  this.addClass('showing');\n\
  this.emit('showing');\n\
\n\
  var self = this;\n\
  after(this.el, function () {\n\
    self.removeClass('showing');\n\
    self.emit('show');\n\
  });\n\
\n\
  this.removeClass('hidden');\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Hide the overlay.\n\
 *\n\
 * @param {Function} callback\n\
 * @return {Overlay}\n\
 */\n\
\n\
Overlay.prototype.hide = function (callback) {\n\
  var hidden = this.hasClass('hidden');\n\
  var hiding = this.hasClass('hiding');\n\
\n\
  if ('function' === typeof callback) {\n\
    hidden && !hiding ? callback() : this.once('hide', callback);\n\
  }\n\
\n\
  if (hidden || hiding) return this;\n\
  this.addClass('hiding');\n\
  this.emit('hiding');\n\
\n\
  var self = this;\n\
  after(this.el, function () {\n\
    self.removeClass('hiding');\n\
    self.emit('hide');\n\
  });\n\
\n\
  this.addClass('hidden');\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Remove the overlay from the DOM, hiding it first if it isn't hidden.\n\
 *\n\
 * @param {Function} callback\n\
 * @return {Overlay}\n\
 */\n\
\n\
Overlay.prototype.remove = function (callback) {\n\
  var removed = ! this.el.parentNode;\n\
  var removing = this.hasClass('removing');\n\
\n\
  if ('function' === typeof callback) {\n\
    removed && !removing ? callback() : this.once('remove', callback);\n\
  }\n\
\n\
  if (removed || removing) return this;\n\
  this.addClass('removing');\n\
  this.emit('removing');\n\
\n\
  var self = this;\n\
  var el = this.el;\n\
  this.hide(function () {\n\
    el.parentNode.removeChild(el);\n\
    self.removeClass('removing');\n\
    self.emit('remove');\n\
  });\n\
\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Bind to closeable events.\n\
 *\n\
 * @return {Overlay}\n\
 * @api private\n\
 */\n\
\n\
Overlay.prototype.bind = function () {\n\
  event.bind(this.el, 'click', this.hide);\n\
  escape.bind(this.hide);\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Unbind from closeable events.\n\
 *\n\
 * @return {Overlay}\n\
 * @api private\n\
 */\n\
\n\
Overlay.prototype.unbind = function () {\n\
  event.unbind(this.el, 'click', this.hide);\n\
  escape.unbind(this.hide);\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Make the overlay closeable.\n\
 *\n\
 * @return {Overlay}\n\
 */\n\
\n\
Overlay.prototype.closeable =\n\
Overlay.prototype.closable = function () {\n\
  this.addClass('closeable').addClass('closable');\n\
  this.on('show', this.bind);\n\
  this.on('hide', this.unbind);\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Make the overlay temporary, so that it will be removed when hidden.\n\
 *\n\
 * @return {Overlay}\n\
 */\n\
\n\
Overlay.prototype.temporary = function () {\n\
  this.addClass('temporary');\n\
  this.on('hide', this.remove);\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Attach or invoke callbacks for an\n\
 *///@ sourceURL=segmentio-overlay/lib/index.js"
));
require.register("yields-has-transitions/index.js", Function("exports, require, module",
"/**\n\
 * Check if `el` or browser supports transitions.\n\
 *\n\
 * @param {Element} el\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
exports = module.exports = function(el){\n\
  switch (arguments.length) {\n\
    case 0: return bool;\n\
    case 1: return bool\n\
      ? transitions(el)\n\
      : bool;\n\
  }\n\
};\n\
\n\
/**\n\
 * Check if the given `el` has transitions.\n\
 *\n\
 * @param {Element} el\n\
 * @return {Boolean}\n\
 * @api private\n\
 */\n\
\n\
function transitions(el, styl){\n\
  if (el.transition) return true;\n\
  styl = window.getComputedStyle(el);\n\
  return !! parseFloat(styl.transitionDuration, 10);\n\
}\n\
\n\
/**\n\
 * Style.\n\
 */\n\
\n\
var styl = document.body.style;\n\
\n\
/**\n\
 * Export support.\n\
 */\n\
\n\
var bool = 'transition' in styl\n\
  || 'webkitTransition' in styl\n\
  || 'MozTransition' in styl\n\
  || 'msTransition' in styl;\n\
//@ sourceURL=yields-has-transitions/index.js"
));
require.register("ecarter-css-emitter/index.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
var events = require('event');\n\
\n\
// CSS events\n\
\n\
var watch = [\n\
  'transitionend'\n\
, 'webkitTransitionEnd'\n\
, 'oTransitionEnd'\n\
, 'MSTransitionEnd'\n\
, 'animationend'\n\
, 'webkitAnimationEnd'\n\
, 'oAnimationEnd'\n\
, 'MSAnimationEnd'\n\
];\n\
\n\
/**\n\
 * Expose `CSSnext`\n\
 */\n\
\n\
module.exports = CssEmitter;\n\
\n\
/**\n\
 * Initialize a new `CssEmitter`\n\
 *\n\
 */\n\
\n\
function CssEmitter(element){\n\
  if (!(this instanceof CssEmitter)) return new CssEmitter(element);\n\
  this.el = element;\n\
}\n\
\n\
/**\n\
 * Bind CSS events.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
CssEmitter.prototype.bind = function(fn){\n\
  for (var i=0; i < watch.length; i++) {\n\
    events.bind(this.el, watch[i], fn);\n\
  }\n\
};\n\
\n\
/**\n\
 * Unbind CSS events\n\
 * \n\
 * @api public\n\
 */\n\
\n\
CssEmitter.prototype.unbind = function(fn){\n\
  for (var i=0; i < watch.length; i++) {\n\
    events.unbind(this.el, watch[i], fn);\n\
  }\n\
};\n\
\n\
\n\
//@ sourceURL=ecarter-css-emitter/index.js"
));
require.register("component-once/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Identifier.\n\
 */\n\
\n\
var n = 0;\n\
\n\
/**\n\
 * Global.\n\
 */\n\
\n\
var global = (function(){ return this })();\n\
\n\
/**\n\
 * Make `fn` callable only once.\n\
 *\n\
 * @param {Function} fn\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(fn) {\n\
  var id = n++;\n\
  var called;\n\
\n\
  function once(){\n\
    // no receiver\n\
    if (this == global) {\n\
      if (called) return;\n\
      called = true;\n\
      return fn.apply(this, arguments);\n\
    }\n\
\n\
    // receiver\n\
    var key = '__called_' + id + '__';\n\
    if (this[key]) return;\n\
    this[key] = true;\n\
    return fn.apply(this, arguments);\n\
  }\n\
\n\
  return once;\n\
};\n\
//@ sourceURL=component-once/index.js"
));
require.register("yields-after-transition/index.js", Function("exports, require, module",
"\n\
/**\n\
 * dependencies\n\
 */\n\
\n\
var has = require('has-transitions')\n\
  , emitter = require('css-emitter')\n\
  , once = require('once');\n\
\n\
/**\n\
 * Transition support.\n\
 */\n\
\n\
var supported = has();\n\
\n\
/**\n\
 * Export `after`\n\
 */\n\
\n\
module.exports = after;\n\
\n\
/**\n\
 * Invoke the given `fn` after transitions\n\
 *\n\
 * It will be invoked only if the browser\n\
 * supports transitions __and__\n\
 * the element has transitions\n\
 * set in `.style` or css.\n\
 *\n\
 * @param {Element} el\n\
 * @param {Function} fn\n\
 * @return {Function} fn\n\
 * @api public\n\
 */\n\
\n\
function after(el, fn){\n\
  if (!supported || !has(el)) return fn();\n\
  emitter(el).bind(fn);\n\
  return fn;\n\
};\n\
\n\
/**\n\
 * Same as `after()` only the function is invoked once.\n\
 *\n\
 * @param {Element} el\n\
 * @param {Function} fn\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
after.once = function(el, fn){\n\
  var callback = once(fn);\n\
  after(el, fn = function(){\n\
    emitter(el).unbind(fn);\n\
    callback();\n\
  });\n\
};\n\
//@ sourceURL=yields-after-transition/index.js"
));
require.register("segmentio-modal/lib/index.js", Function("exports, require, module",
"\n\
var after = require('after-transition').once\n\
  , bind = require('event').bind\n\
  , classes = require('classes')\n\
  , domify = require('domify')\n\
  , Emitter = require('emitter')\n\
  , overlay = require('overlay')\n\
  , redraw = require('redraw')\n\
  , template = require('./index.html');\n\
\n\
\n\
/**\n\
 * Expose `Modal`.\n\
 */\n\
\n\
module.exports = Modal;\n\
\n\
\n\
/**\n\
 * Initialize a new `Modal`.\n\
 *\n\
 * @param {Element} el\n\
 */\n\
\n\
function Modal (el) {\n\
  if (!(this instanceof Modal)) return new Modal(el);\n\
  this.view = el;\n\
  this.overlay = overlay().addClass('modal-overlay');\n\
  this.wrapper = domify(template);\n\
  this.modal = this.wrapper.querySelector('div');\n\
  this.close = this.wrapper.querySelector('a');\n\
  this.modal.appendChild(this.view);\n\
  this.bind();\n\
  document.body.appendChild(this.wrapper);\n\
  redraw(this.wrapper); // to force an initial show to take\n\
}\n\
\n\
\n\
/**\n\
 * Mixin emitter.\n\
 */\n\
\n\
Emitter(Modal.prototype);\n\
\n\
\n\
/**\n\
 * Bind to DOM events.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Modal.prototype.bind = function () {\n\
  var hide = this.hide.bind(this);\n\
  this.overlay.on('hiding', hide);\n\
  bind(this.close, 'click', hide);\n\
};\n\
\n\
\n\
/**\n\
 * Show the modal.\n\
 *\n\
 * @param {Function} callback\n\
 * @return {Modal}\n\
 */\n\
\n\
Modal.prototype.show = function (callback) {\n\
  var self = this;\n\
  this.overlay.show(function () {\n\
    self.emit('show');\n\
    if ('function' === typeof callback) callback();\n\
  });\n\
  this.removeClass('hidden', true);\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Hide the modal.\n\
 *\n\
 * @param {Function} callback\n\
 * @return {Modal}\n\
 */\n\
\n\
Modal.prototype.hide = function (callback) {\n\
  var self = this;\n\
  this.overlay.hide(function () {\n\
    self.emit('hide');\n\
    if ('function' === typeof callback) callback();\n\
  });\n\
  this.addClass('hidden', true);\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Remove the modal from the DOM.\n\
 *\n\
 * @param {Function} callback\n\
 * @return {Modal}\n\
 */\n\
\n\
Modal.prototype.remove = function (callback) {\n\
  var self = this;\n\
  var wrapper = this.wrapper;\n\
  this.overlay.remove(function () {\n\
    if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);\n\
    self.emit('remove');\n\
    if ('function' === typeof callback) callback();\n\
  });\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Make the modal closeable.\n\
 *\n\
 * @return {Modal}\n\
 */\n\
\n\
Modal.prototype.closeable =\n\
Modal.prototype.closable = function () {\n\
  this.overlay.closeable();\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Make the modal temporary.\n\
 *\n\
 * @return {Modal}\n\
 */\n\
\n\
Modal.prototype.temporary = function () {\n\
  this.overlay.temporary();\n\
  var self = this;\n\
  this.overlay.on('remove', function () {\n\
    self.remove();\n\
  });\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Add a class to the modal. If the `all` flag is set, then it will add the\n\
 * class to the overlay and wrapper too, for styling purposes.\n\
 *\n\
 * @param {String} name\n\
 * @param {Boolean} all\n\
 * @return {Modal}\n\
 */\n\
\n\
Modal.prototype.addClass = function (name, all) {\n\
  classes(this.modal).add(name);\n\
  if (all) {\n\
    classes(this.wrapper).add(name);\n\
    this.overlay.addClass(name);\n\
  }\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Remove a class from the modal. If the `all` flag is set, then it will remove\n\
 * the class from the overlay and wrapper too, for styling purposes.\n\
 *\n\
 * @param {String} name\n\
 * @param {Boolean} all\n\
 * @return {Modal}\n\
 */\n\
\n\
Modal.prototype.removeClass = function (name, all) {\n\
  classes(this.modal).remove(name);\n\
  if (all) {\n\
    classes(this.wrapper).remove(name);\n\
    this.overlay.removeClass(name);\n\
  }\n\
  return this;\n\
};\n\
//@ sourceURL=segmentio-modal/lib/index.js"
));
require.register("stagas-mod-player/index.js", Function("exports, require, module",
"/*\n\
  Useful docs\n\
    Explains effect calculations: http://www.mediatel.lu/workshop/audio/fileformat/h_mod.html\n\
\n\
*/\n\
\n\
/*\n\
ModPeriodTable[ft][n] = the period to use for note number n at finetune value ft.\n\
Finetune values are in twos-complement, i.e. [0,1,2,3,4,5,6,7,-8,-7,-6,-5,-4,-3,-2,-1]\n\
The first table is used to generate a reverse lookup table, to find out the note number\n\
for a period given in the MOD file.\n\
*/\n\
var ModPeriodTable = [\n\
  [1712, 1616, 1524, 1440, 1356, 1280, 1208, 1140, 1076, 1016, 960 , 906,\n\
   856 , 808 , 762 , 720 , 678 , 640 , 604 , 570 , 538 , 508 , 480 , 453,\n\
   428 , 404 , 381 , 360 , 339 , 320 , 302 , 285 , 269 , 254 , 240 , 226,\n\
   214 , 202 , 190 , 180 , 170 , 160 , 151 , 143 , 135 , 127 , 120 , 113,\n\
   107 , 101 , 95  , 90  , 85  , 80  , 75  , 71  , 67  , 63  , 60  , 56 ],\n\
  [1700, 1604, 1514, 1430, 1348, 1274, 1202, 1134, 1070, 1010, 954 , 900,\n\
   850 , 802 , 757 , 715 , 674 , 637 , 601 , 567 , 535 , 505 , 477 , 450,\n\
   425 , 401 , 379 , 357 , 337 , 318 , 300 , 284 , 268 , 253 , 239 , 225,\n\
   213 , 201 , 189 , 179 , 169 , 159 , 150 , 142 , 134 , 126 , 119 , 113,\n\
   106 , 100 , 94  , 89  , 84  , 79  , 75  , 71  , 67  , 63  , 59  , 56 ],\n\
  [1688, 1592, 1504, 1418, 1340, 1264, 1194, 1126, 1064, 1004, 948 , 894,\n\
   844 , 796 , 752 , 709 , 670 , 632 , 597 , 563 , 532 , 502 , 474 , 447,\n\
   422 , 398 , 376 , 355 , 335 , 316 , 298 , 282 , 266 , 251 , 237 , 224,\n\
   211 , 199 , 188 , 177 , 167 , 158 , 149 , 141 , 133 , 125 , 118 , 112,\n\
   105 , 99  , 94  , 88  , 83  , 79  , 74  , 70  , 66  , 62  , 59  , 56 ],\n\
  [1676, 1582, 1492, 1408, 1330, 1256, 1184, 1118, 1056, 996 , 940 , 888,\n\
   838 , 791 , 746 , 704 , 665 , 628 , 592 , 559 , 528 , 498 , 470 , 444,\n\
   419 , 395 , 373 , 352 , 332 , 314 , 296 , 280 , 264 , 249 , 235 , 222,\n\
   209 , 198 , 187 , 176 , 166 , 157 , 148 , 140 , 132 , 125 , 118 , 111,\n\
   104 , 99  , 93  , 88  , 83  , 78  , 74  , 70  , 66  , 62  , 59  , 55 ],\n\
  [1664, 1570, 1482, 1398, 1320, 1246, 1176, 1110, 1048, 990 , 934 , 882,\n\
   832 , 785 , 741 , 699 , 660 , 623 , 588 , 555 , 524 , 495 , 467 , 441,\n\
   416 , 392 , 370 , 350 , 330 , 312 , 294 , 278 , 262 , 247 , 233 , 220,\n\
   208 , 196 , 185 , 175 , 165 , 156 , 147 , 139 , 131 , 124 , 117 , 110,\n\
   104 , 98  , 92  , 87  , 82  , 78  , 73  , 69  , 65  , 62  , 58  , 55 ],\n\
  [1652, 1558, 1472, 1388, 1310, 1238, 1168, 1102, 1040, 982 , 926 , 874,\n\
   826 , 779 , 736 , 694 , 655 , 619 , 584 , 551 , 520 , 491 , 463 , 437,\n\
   413 , 390 , 368 , 347 , 328 , 309 , 292 , 276 , 260 , 245 , 232 , 219,\n\
   206 , 195 , 184 , 174 , 164 , 155 , 146 , 138 , 130 , 123 , 116 , 109,\n\
   103 , 97  , 92  , 87  , 82  , 77  , 73  , 69  , 65  , 61  , 58  , 54 ],\n\
  [1640, 1548, 1460, 1378, 1302, 1228, 1160, 1094, 1032, 974 , 920 , 868,\n\
   820 , 774 , 730 , 689 , 651 , 614 , 580 , 547 , 516 , 487 , 460 , 434,\n\
   410 , 387 , 365 , 345 , 325 , 307 , 290 , 274 , 258 , 244 , 230 , 217,\n\
   205 , 193 , 183 , 172 , 163 , 154 , 145 , 137 , 129 , 122 , 115 , 109,\n\
   102 , 96  , 91  , 86  , 81  , 77  , 72  , 68  , 64  , 61  , 57  , 54 ],\n\
  [1628, 1536, 1450, 1368, 1292, 1220, 1150, 1086, 1026, 968 , 914 , 862,\n\
   814 , 768 , 725 , 684 , 646 , 610 , 575 , 543 , 513 , 484 , 457 , 431,\n\
   407 , 384 , 363 , 342 , 323 , 305 , 288 , 272 , 256 , 242 , 228 , 216,\n\
   204 , 192 , 181 , 171 , 161 , 152 , 144 , 136 , 128 , 121 , 114 , 108,\n\
   102 , 96  , 90  , 85  , 80  , 76  , 72  , 68  , 64  , 60  , 57  , 54 ],\n\
  [1814, 1712, 1616, 1524, 1440, 1356, 1280, 1208, 1140, 1076, 1016, 960,\n\
   907 , 856 , 808 , 762 , 720 , 678 , 640 , 604 , 570 , 538 , 508 , 480,\n\
   453 , 428 , 404 , 381 , 360 , 339 , 320 , 302 , 285 , 269 , 254 , 240,\n\
   226 , 214 , 202 , 190 , 180 , 170 , 160 , 151 , 143 , 135 , 127 , 120,\n\
   113 , 107 , 101 , 95  , 90  , 85  , 80  , 75  , 71  , 67  , 63  , 60 ],\n\
  [1800, 1700, 1604, 1514, 1430, 1350, 1272, 1202, 1134, 1070, 1010, 954,\n\
   900 , 850 , 802 , 757 , 715 , 675 , 636 , 601 , 567 , 535 , 505 , 477,\n\
   450 , 425 , 401 , 379 , 357 , 337 , 318 , 300 , 284 , 268 , 253 , 238,\n\
   225 , 212 , 200 , 189 , 179 , 169 , 159 , 150 , 142 , 134 , 126 , 119,\n\
   112 , 106 , 100 , 94  , 89  , 84  , 79  , 75  , 71  , 67  , 63  , 59 ],\n\
  [1788, 1688, 1592, 1504, 1418, 1340, 1264, 1194, 1126, 1064, 1004, 948,\n\
   894 , 844 , 796 , 752 , 709 , 670 , 632 , 597 , 563 , 532 , 502 , 474,\n\
   447 , 422 , 398 , 376 , 355 , 335 , 316 , 298 , 282 , 266 , 251 , 237,\n\
   223 , 211 , 199 , 188 , 177 , 167 , 158 , 149 , 141 , 133 , 125 , 118,\n\
   111 , 105 , 99  , 94  , 88  , 83  , 79  , 74  , 70  , 66  , 62  , 59 ],\n\
  [1774, 1676, 1582, 1492, 1408, 1330, 1256, 1184, 1118, 1056, 996 , 940,\n\
   887 , 838 , 791 , 746 , 704 , 665 , 628 , 592 , 559 , 528 , 498 , 470,\n\
   444 , 419 , 395 , 373 , 352 , 332 , 314 , 296 , 280 , 264 , 249 , 235,\n\
   222 , 209 , 198 , 187 , 176 , 166 , 157 , 148 , 140 , 132 , 125 , 118,\n\
   111 , 104 , 99  , 93  , 88  , 83  , 78  , 74  , 70  , 66  , 62  , 59 ],\n\
  [1762, 1664, 1570, 1482, 1398, 1320, 1246, 1176, 1110, 1048, 988 , 934,\n\
   881 , 832 , 785 , 741 , 699 , 660 , 623 , 588 , 555 , 524 , 494 , 467,\n\
   441 , 416 , 392 , 370 , 350 , 330 , 312 , 294 , 278 , 262 , 247 , 233,\n\
   220 , 208 , 196 , 185 , 175 , 165 , 156 , 147 , 139 , 131 , 123 , 117,\n\
   110 , 104 , 98  , 92  , 87  , 82  , 78  , 73  , 69  , 65  , 61  , 58 ],\n\
  [1750, 1652, 1558, 1472, 1388, 1310, 1238, 1168, 1102, 1040, 982 , 926,\n\
   875 , 826 , 779 , 736 , 694 , 655 , 619 , 584 , 551 , 520 , 491 , 463,\n\
   437 , 413 , 390 , 368 , 347 , 328 , 309 , 292 , 276 , 260 , 245 , 232,\n\
   219 , 206 , 195 , 184 , 174 , 164 , 155 , 146 , 138 , 130 , 123 , 116,\n\
   109 , 103 , 97  , 92  , 87  , 82  , 77  , 73  , 69  , 65  , 61  , 58 ],\n\
  [1736, 1640, 1548, 1460, 1378, 1302, 1228, 1160, 1094, 1032, 974 , 920,\n\
   868 , 820 , 774 , 730 , 689 , 651 , 614 , 580 , 547 , 516 , 487 , 460,\n\
   434 , 410 , 387 , 365 , 345 , 325 , 307 , 290 , 274 , 258 , 244 , 230,\n\
   217 , 205 , 193 , 183 , 172 , 163 , 154 , 145 , 137 , 129 , 122 , 115,\n\
   108 , 102 , 96  , 91  , 86  , 81  , 77  , 72  , 68  , 64  , 61  , 57 ],\n\
  [1724, 1628, 1536, 1450, 1368, 1292, 1220, 1150, 1086, 1026, 968 , 914,\n\
   862 , 814 , 768 , 725 , 684 , 646 , 610 , 575 , 543 , 513 , 484 , 457,\n\
   431 , 407 , 384 , 363 , 342 , 323 , 305 , 288 , 272 , 256 , 242 , 228,\n\
   216 , 203 , 192 , 181 , 171 , 161 , 152 , 144 , 136 , 128 , 121 , 114,\n\
   108 , 101 , 96  , 90  , 85  , 80  , 76  , 72  , 68  , 64  , 60  , 57 ]];\n\
   \n\
var SineTable = [\n\
  0,24,49,74,97,120,141,161,180,197,212,224,235,244,250,253,\n\
  255,253,250,244,235,224,212,197,180,161,141,120,97,74,49,\n\
  24,0,-24,-49,-74,-97,-120,-141,-161,-180,-197,-212,-224,\n\
  -235,-244,-250,-253,-255,-253,-250,-244,-235,-224,-212,-197,\n\
  -180,-161,-141,-120,-97,-74,-49,-24\n\
];\n\
\n\
var ModPeriodToNoteNumber = {};\n\
for (var i = 0; i < ModPeriodTable[0].length; i++) {\n\
  ModPeriodToNoteNumber[ModPeriodTable[0][i]] = i;\n\
}\n\
\n\
module.exports = ModPlayer;\n\
\n\
/**\n\
 * Module Player class.\n\
 *\n\
 * @param {ModParser} mod \n\
 * @param {Number} rate \n\
 * @api public\n\
 */\n\
\n\
function ModPlayer(mod, rate) {\n\
  /* timing calculations */\n\
  var ticksPerSecond = 7093789.2; /* PAL frequency */\n\
  var ticksPerFrame; /* calculated by setBpm */\n\
  var ticksPerOutputSample = Math.round(ticksPerSecond / rate);\n\
  var ticksSinceStartOfFrame = 0;\n\
  \n\
  function setBpm(bpm) {\n\
    /* x beats per minute => x*4 rows per minute */\n\
    ticksPerFrame = Math.round(ticksPerSecond * 2.5/bpm);\n\
  }\n\
  setBpm(125);\n\
  \n\
  /* initial player state */\n\
  var framesPerRow = 6;\n\
  var currentFrame = 0;\n\
  var currentPattern;\n\
  var currentPosition;\n\
  var currentRow;\n\
  var exLoop = false;   //whether E6x looping is currently set\n\
  var exLoopStart = 0;  //loop point set up by E60\n\
  var exLoopEnd = 0;    //end of loop (where we hit a E6x cmd) for accurate counting\n\
  var exLoopCount = 0;  //loops remaining\n\
  var doBreak = false;  //Bxx, Dxx - jump to order and pattern break\n\
  var breakPos = 0;\n\
  var breakRow = 0;\n\
  var delayRows = false; //EEx pattern delay.\n\
  \n\
  var channels = [];\n\
  for (var chan = 0; chan < mod.channelCount; chan++) {\n\
    channels[chan] = {\n\
      playing: false,\n\
      sample: mod.samples[0],\n\
      finetune: 0,\n\
      volume: 0,\n\
      pan: 0x7F,  //unimplemented\n\
      volumeDelta: 0,\n\
      periodDelta: 0,\n\
      fineVolumeDelta: 0,\n\
      finePeriodDelta: 0,\n\
      tonePortaTarget: 0, //target for 3xx, 5xy as period value\n\
      tonePortaDelta: 0,\n\
      tonePortaVolStep: 0, //remember pitch slide step for when 5xx is used\n\
      tonePortaActive: false,\n\
      cut: false,     //tick to cut at, or false if no cut\n\
      delay: false,   //tick to delay note until, or false if no delay\n\
      arpeggioActive: false\n\
    };\n\
  }\n\
  \n\
  function loadRow(rowNumber) {\n\
    currentRow = rowNumber;\n\
    currentFrame = 0;\n\
    doBreak = false;\n\
    breakPos = 0;\n\
    breakRow = 0;\n\
\n\
    for (var chan = 0; chan < mod.channelCount; chan++) {\n\
      var channel = channels[chan];\n\
      var prevNote = channel.prevNote;\n\
      var note = currentPattern[currentRow][chan];\n\
      if (channel.sampleNum == undefined) {\n\
          channel.sampleNum = 0;\n\
      }\n\
      if (note.period != 0 || note.sample != 0) {\n\
        channel.playing = true;\n\
        channel.samplePosition = 0;\n\
        channel.ticksSinceStartOfSample = 0; /* that's 'sample' as in 'individual volume reading' */\n\
        if (note.sample != 0) {\n\
          channel.sample = mod.samples[note.sample - 1];\n\
          channel.sampleNum = note.sample - 1;\n\
          channel.volume = channel.sample.volume;\n\
          channel.finetune = channel.sample.finetune;\n\
        }\n\
        if (note.period != 0) { // && note.effect != 0x03\n\
          //the note specified in a tone porta command is not actually played\n\
          if (note.effect != 0x03) {\n\
            channel.noteNumber = ModPeriodToNoteNumber[note.period];\n\
            channel.ticksPerSample = ModPeriodTable[channel.finetune][channel.noteNumber] * 2;\n\
          } else {\n\
            channel.noteNumber = ModPeriodToNoteNumber[prevNote.period]\n\
            channel.ticksPerSample = ModPeriodTable[channel.finetune][channel.noteNumber] * 2;\n\
          }\n\
        }\n\
      }\n\
      channel.finePeriodDelta = 0;\n\
      channel.fineVolumeDelta = 0;\n\
      channel.cut = false;\n\
      channel.delay = false;\n\
      channel.retrigger = false;\n\
      channel.tonePortaActive = false;\n\
      if (note.effect != 0 || note.effectParameter != 0) {\n\
        channel.volumeDelta = 0; /* new effects cancel volumeDelta */\n\
        channel.periodDelta = 0; /* new effects cancel periodDelta */\n\
        channel.arpeggioActive = false;\n\
        switch (note.effect) {\n\
          case 0x00: /* arpeggio: 0xy */\n\
            channel.arpeggioActive = true;\n\
            channel.arpeggioNotes = [\n\
              channel.noteNumber,\n\
              channel.noteNumber + (note.effectParameter >> 4),\n\
              channel.noteNumber + (note.effectParameter & 0x0f)\n\
            ]\n\
            channel.arpeggioCounter = 0;\n\
            break;\n\
          case 0x01: /* pitch slide up - 1xx */\n\
            channel.periodDelta = -note.effectParameter;\n\
            break;\n\
          case 0x02: /* pitch slide down - 2xx */\n\
            channel.periodDelta = note.effectParameter;\n\
            break;\n\
          case 0x03: /* slide to note 3xy - */\n\
            channel.tonePortaActive = true;\n\
            channel.tonePortaTarget = (note.period != 0) ? note.period : channel.tonePortaTarget;\n\
            var dir = (channel.tonePortaTarget < prevNote.period) ? -1 : 1;\n\
            channel.tonePortaDelta = (note.effectParameter * dir);\n\
            channel.tonePortaVolStep = (note.effectParameter * dir);\n\
            channel.tonePortaDir = dir;\n\
            break;\n\
          case 0x05: /* portamento to note with volume slide 5xy */\n\
            channel.tonePortaActive = true;\n\
            if (note.effectParameter & 0xf0) {\n\
              channel.volumeDelta = note.effectParameter >> 4;\n\
            } else {\n\
              channel.volumeDelta = -note.effectParameter;\n\
            }\n\
            channel.tonePortaDelta = channel.tonePortaVolStep;\n\
            break;\n\
          case 0x09: /* sample offset - 9xx */\n\
            channel.samplePosition = 256 * note.effectParameter;\n\
            break;\n\
          case 0x0A: /* volume slide - Axy */\n\
            if (note.effectParameter & 0xf0) {\n\
              /* volume increase by x */\n\
              channel.volumeDelta = note.effectParameter >> 4;\n\
            } else {\n\
              /* volume decrease by y */\n\
              channel.volumeDelta = -note.effectParameter;\n\
            }\n\
            break;\n\
          case 0x0B: /* jump to order */\n\
            doBreak = true;\n\
            breakPos = note.effectParameter;\n\
            breakRow = 0;\n\
            break;\n\
          case 0x0C: /* volume */\n\
            if (note.effectParameter > 64) {\n\
              channel.volume = 64;\n\
            } else {\n\
              channel.volume = note.effectParameter;\n\
            }\n\
            break;\n\
          case 0x0D: /* pattern break; jump to next pattern at specified row */\n\
            doBreak = true;\n\
            breakPos = currentPosition + 1;\n\
            //Row is written as DECIMAL so grab the high part as a single digit and do some math\n\
            breakRow = ((note.effectParameter & 0xF0) >> 4) * 10 + (note.effectParameter & 0x0F);\n\
            break;\n\
            \n\
          case 0x0E:\n\
            switch (note.extEffect) { //yes we're doing nested switch\n\
              case 0x01: /* fine pitch slide up - E1x */\n\
                channel.finePeriodDelta = -note.extEffectParameter;\n\
                break;\n\
              case 0x02: /* fine pitch slide down - E2x */\n\
                channel.finePeriodDelta = note.extEffectParameter;\n\
                break;\n\
              case 0x05: /* set finetune - E5x */\n\
                channel.finetune = note.extEffectParameter;\n\
                break;\n\
              case 0x09: /* retrigger sample - E9x */\n\
                channel.retrigger = note.extEffectParameter;\n\
                break;\n\
              case 0x0A: /* fine volume slide up - EAx */\n\
                channel.fineVolumeDelta = note.extEffectParameter;\n\
                break;\n\
              case 0x0B: /* fine volume slide down - EBx */\n\
                channel.fineVolumeDelta = -note.extEffectParameter;\n\
                break;\n\
              case 0x0C: /* note cute - ECx */\n\
                channel.cut = note.extEffectParameter;\n\
                break;\n\
              case 0x0D: /* note delay - EDx */\n\
                channel.delay = note.extEffectParameter;\n\
                break;\n\
              case 0x0E: /* pattern delay EEx */\n\
                delayRows = note.extEffectParameter;\n\
                break;\n\
              case 0x06:\n\
                //set loop start with E60\n\
                if (note.extEffectParameter == 0) {\n\
                  exLoopStart = currentRow;\n\
                } else {\n\
                  //set loop end with E6x\n\
                  exLoopEnd = currentRow;\n\
                  //activate the loop only if it's new\n\
                  if (!exLoop) {\n\
                    exLoop = true;\n\
                    exLoopCount = note.extEffectParameter;\n\
                  }\n\
                }\n\
                break;\n\
            }\n\
            \n\
            break;\n\
            \n\
          case 0x0F: /* tempo change. <=32 sets ticks/row, greater sets beats/min instead */\n\
            var newSpeed = (note.effectParameter == 0) ? 1 : note.effectParameter; /* 0 is treated as 1 */\n\
            if (newSpeed <= 32) { \n\
              framesPerRow = newSpeed;\n\
            } else {\n\
              setBpm(newSpeed);\n\
            }\n\
            break;\n\
        }\n\
      }\n\
      \n\
      //for figuring out tone portamento effect\n\
      if (note.period != 0) { channel.prevNote = note; }\n\
      \n\
      if (channel.tonePortaActive == false) {\n\
        channel.tonePortaDelta = 0;\n\
        channel.tonePortaTarget = 0;\n\
        channel.tonePortaVolStep = 0;\n\
      }\n\
    }\n\
    \n\
  }\n\
  \n\
  function loadPattern(patternNumber) {\n\
    var row = doBreak ? breakRow : 0;\n\
    currentPattern = mod.patterns[patternNumber];\n\
    loadRow(row);\n\
  }\n\
  \n\
  function loadPosition(positionNumber) {\n\
    //Handle invalid position numbers that may be passed by invalid loop points\n\
    positionNumber = (positionNumber > mod.positionCount - 1) ? 0 : positionNumber; \n\
    currentPosition = positionNumber;\n\
    loadPattern(mod.positions[currentPosition]);\n\
  }\n\
  \n\
  loadPosition(0);\n\
  \n\
  function getNextPosition() {\n\
    if (currentPosition + 1 >= mod.positionCount) {\n\
      loadPosition(mod.positionLoopPoint);\n\
    } else {\n\
      loadPosition(currentPosition + 1);\n\
    }\n\
  }\n\
  \n\
  function getNextRow() {\n\
    /*\n\
      Determine where we're gonna go based on active effect.\n\
      Either:\n\
        break (jump to new pattern),\n\
        do extended loop,\n\
        advance normally\n\
    */\n\
    if (doBreak) {\n\
      //Dxx commands at the end of modules are fairly common for some reason\n\
      //so make sure jumping past the end loops back to the start\n\
      breakPos = (breakPos >= mod.positionCount) ? mod.positionLoopPoint : breakPos;\n\
      loadPosition(breakPos);\n\
    } else if (exLoop && currentRow == exLoopEnd && exLoopCount > 0) {\n\
      //count down the loop and jump back\n\
      loadRow(exLoopStart);\n\
      exLoopCount--;\n\
    } else {\n\
      if (currentRow == 63) {\n\
        getNextPosition();\n\
      } else {\n\
        loadRow(currentRow + 1);\n\
      }\n\
    }\n\
    \n\
    if (exLoopCount < 0) { exLoop = false; }\n\
  }\n\
\n\
  function doFrame() {\n\
    /* apply volume/pitch slide before fetching row, because the first frame of a row does NOT\n\
    have the slide applied */\n\
\n\
    for (var chan = 0; chan < mod.channelCount; chan++) {\n\
      var channel = channels[chan];\n\
      var finetune = channel.finetune;\n\
      if (currentFrame == 0) { /* apply fine slides only once */\n\
        channel.ticksPerSample += channel.finePeriodDelta * 2;\n\
        channel.volume += channel.fineVolumeDelta;\n\
      }\n\
      channel.volume += channel.volumeDelta;\n\
      if (channel.volume > 64) {\n\
        channel.volume = 64;\n\
      } else if (channel.volume < 0) {\n\
        channel.volume = 0;\n\
      }\n\
      if (channel.cut !== false && currentFrame >= channel.cut) {\n\
        channel.volume = 0;\n\
      }\n\
      if (channel.delay !== false && currentFrame <= channel.delay) {\n\
        channel.volume = 0;\n\
      }\n\
      if (channel.retrigger !== false) {\n\
        //short-circuit prevents x mod 0\n\
        if (channel.retrigger == 0 || currentFrame % channel.retrigger == 0) { \n\
          channel.samplePosition = 0;\n\
        }\n\
      }\n\
      channel.ticksPerSample += channel.periodDelta * 2;\n\
      if (channel.tonePortaActive) {\n\
        channel.ticksPerSample += channel.tonePortaDelta * 2;\n\
        //don't slide below or above allowed note, depending on slide direction\n\
        if (channel.tonePortaDir == 1 && channel.ticksPerSample > channel.tonePortaTarget * 2) {\n\
          channel.ticksPerSample = channel.tonePortaTarget * 2;\n\
        } else if (channel.tonePortaDir == -1 && channel.ticksPerSample < channel.tonePortaTarget * 2)  {\n\
          channel.ticksPerSample = channel.tonePortaTarget * 2;\n\
        }\n\
      }\n\
      \n\
      if (channel.ticksPerSample > 4096) {\n\
        channel.ticksPerSample = 4096;\n\
      } else if (channel.ticksPerSample < 96) { /* equivalent to period 48, a bit higher than the highest note */\n\
        channel.ticksPerSample = 96;\n\
      }\n\
      if (channel.arpeggioActive) {\n\
        channel.arpeggioCounter++;\n\
        var noteNumber = channel.arpeggioNotes[channel.arpeggioCounter % 3];\n\
        channel.ticksPerSample = ModPeriodTable[finetune][noteNumber] * 2;\n\
      }\n\
    }\n\
\n\
    currentFrame++;\n\
    if (currentFrame == framesPerRow) {\n\
      currentFrame = 0;\n\
      //Don't advance to reading more rows if pattern delay effect is active\n\
      if (delayRows !== false) {\n\
        delayRows--;\n\
        if (delayRows < 0) { delayRows = false; }\n\
      } else {\n\
        getNextRow();\n\
      }\n\
    }\n\
  }\n\
  \n\
  this.process = function(L, R, sampleLength) {\n\
    for (var i=0; i<sampleLength; i++) {\n\
      ticksSinceStartOfFrame += ticksPerOutputSample;\n\
      while (ticksSinceStartOfFrame >= ticksPerFrame) {\n\
        doFrame();\n\
        ticksSinceStartOfFrame -= ticksPerFrame;\n\
      }\n\
      \n\
      leftOutputLevel = 0;\n\
      rightOutputLevel = 0;\n\
      for (var chan = 0; chan < mod.channelCount; chan++) {\n\
        var channel = channels[chan];\n\
        if (channel.playing) {\n\
          channel.ticksSinceStartOfSample += ticksPerOutputSample;\n\
          while (channel.ticksSinceStartOfSample >= channel.ticksPerSample) {\n\
            channel.samplePosition++;\n\
            if (channel.sample.repeatLength > 2 && channel.samplePosition >= channel.sample.repeatOffset + channel.sample.repeatLength) {\n\
              channel.samplePosition = channel.sample.repeatOffset;\n\
            } else if (channel.samplePosition >= channel.sample.length) {\n\
              channel.playing = false;\n\
              break;\n\
            } else \n\
            channel.ticksSinceStartOfSample -= channel.ticksPerSample;\n\
          }\n\
          if (channel.playing) {\n\
            \n\
            var rawVol = mod.sampleData[channel.sampleNum][channel.samplePosition];\n\
            var vol = (((rawVol + 128) & 0xff) - 128) * channel.volume; /* range (-128*64)..(127*64) */\n\
            if (chan & 3 == 0 || chan & 3 == 3) { /* hard panning(?): left, right, right, left */\n\
              leftOutputLevel += (vol + channel.pan) * 3;\n\
              rightOutputLevel += (vol + 0xFF - channel.pan);\n\
            } else {\n\
              leftOutputLevel += (vol + 0xFF - channel.pan)\n\
              rightOutputLevel += (vol + channel.pan) * 3;\n\
            }\n\
            /* range of outputlevels is 128*64*2*channelCount */\n\
            /* (well, it could be more for odd channel counts) */\n\
          }\n\
        }\n\
      }\n\
      \n\
      L[i] = leftOutputLevel / (128 * 128 * mod.channelCount);\n\
      R[i] = rightOutputLevel / (128 * 128 * mod.channelCount);\n\
    }\n\
  };\n\
}\n\
//@ sourceURL=stagas-mod-player/index.js"
));

require.register("monstercat-jade-runtime/index.js", Function("exports, require, module",
"var exports = module.exports\n\
/*!\n\
 * Jade - runtime\n\
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>\n\
 * MIT Licensed\n\
 */\n\
\n\
/**\n\
 * Lame Array.isArray() polyfill for now.\n\
 */\n\
\n\
if (!Array.isArray) {\n\
  Array.isArray = function(arr){\n\
    return '[object Array]' == Object.prototype.toString.call(arr);\n\
  };\n\
}\n\
\n\
/**\n\
 * Lame Object.keys() polyfill for now.\n\
 */\n\
\n\
if (!Object.keys) {\n\
  Object.keys = function(obj){\n\
    var arr = [];\n\
    for (var key in obj) {\n\
      if (obj.hasOwnProperty(key)) {\n\
        arr.push(key);\n\
      }\n\
    }\n\
    return arr;\n\
  }\n\
}\n\
\n\
/**\n\
 * Merge two attribute objects giving precedence\n\
 * to values in object `b`. Classes are special-cased\n\
 * allowing for arrays and merging/joining appropriately\n\
 * resulting in a string.\n\
 *\n\
 * @param {Object} a\n\
 * @param {Object} b\n\
 * @return {Object} a\n\
 * @api private\n\
 */\n\
\n\
exports.merge = function merge(a, b) {\n\
  var ac = a['class'];\n\
  var bc = b['class'];\n\
\n\
  if (ac || bc) {\n\
    ac = ac || [];\n\
    bc = bc || [];\n\
    if (!Array.isArray(ac)) ac = [ac];\n\
    if (!Array.isArray(bc)) bc = [bc];\n\
    ac = ac.filter(nulls);\n\
    bc = bc.filter(nulls);\n\
    a['class'] = ac.concat(bc).join(' ');\n\
  }\n\
\n\
  for (var key in b) {\n\
    if (key != 'class') {\n\
      a[key] = b[key];\n\
    }\n\
  }\n\
\n\
  return a;\n\
};\n\
\n\
/**\n\
 * Filter null `val`s.\n\
 *\n\
 * @param {Mixed} val\n\
 * @return {Mixed}\n\
 * @api private\n\
 */\n\
\n\
function nulls(val) {\n\
  return val != null;\n\
}\n\
\n\
/**\n\
 * Render the given attributes object.\n\
 *\n\
 * @param {Object} obj\n\
 * @param {Object} escaped\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
exports.attrs = function attrs(obj, escaped){\n\
  var buf = []\n\
    , terse = obj.terse;\n\
\n\
  delete obj.terse;\n\
  var keys = Object.keys(obj)\n\
    , len = keys.length;\n\
\n\
  if (len) {\n\
    buf.push('');\n\
    for (var i = 0; i < len; ++i) {\n\
      var key = keys[i]\n\
        , val = obj[key];\n\
\n\
      if ('boolean' == typeof val || null == val) {\n\
        if (val) {\n\
          terse\n\
            ? buf.push(key)\n\
            : buf.push(key + '=\"' + key + '\"');\n\
        }\n\
      } else if (0 == key.indexOf('data') && 'string' != typeof val) {\n\
        buf.push(key + \"='\" + JSON.stringify(val) + \"'\");\n\
      } else if ('class' == key && Array.isArray(val)) {\n\
        buf.push(key + '=\"' + exports.escape(val.join(' ')) + '\"');\n\
      } else if (escaped && escaped[key]) {\n\
        buf.push(key + '=\"' + exports.escape(val) + '\"');\n\
      } else {\n\
        buf.push(key + '=\"' + val + '\"');\n\
      }\n\
    }\n\
  }\n\
\n\
  return buf.join(' ');\n\
};\n\
\n\
/**\n\
 * Escape the given string of `html`.\n\
 *\n\
 * @param {String} html\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
exports.escape = function escape(html){\n\
  return String(html)\n\
    .replace(/&(?!(\\w+|\\#\\d+);)/g, '&amp;')\n\
    .replace(/</g, '&lt;')\n\
    .replace(/>/g, '&gt;')\n\
    .replace(/\"/g, '&quot;');\n\
};\n\
\n\
/**\n\
 * Re-throw the given `err` in context to the\n\
 * the jade in `filename` at the given `lineno`.\n\
 *\n\
 * @param {Error} err\n\
 * @param {String} filename\n\
 * @param {String} lineno\n\
 * @api private\n\
 */\n\
\n\
exports.rethrow = function rethrow(err, filename, lineno){\n\
  if (!filename) throw err;\n\
\n\
  var context = 3\n\
    , str = require('fs').readFileSync(filename, 'utf8')\n\
    , lines = str.split('\\n\
')\n\
    , start = Math.max(lineno - context, 0)\n\
    , end = Math.min(lines.length, lineno + context);\n\
\n\
  // Error context\n\
  var context = lines.slice(start, end).map(function(line, i){\n\
    var curr = i + start + 1;\n\
    return (curr == lineno ? '  > ' : '    ')\n\
      + curr\n\
      + '| '\n\
      + line;\n\
  }).join('\\n\
');\n\
\n\
  // Alter exception message\n\
  err.path = filename;\n\
  err.message = (filename || 'Jade') + ':' + lineno\n\
    + '\\n\
' + context + '\\n\
\\n\
' + err.message;\n\
  throw err;\n\
};\n\
//@ sourceURL=monstercat-jade-runtime/index.js"
));
require.register("stagas-within/index.js", Function("exports, require, module",
"\n\
/**\n\
 * within\n\
 */\n\
\n\
module.exports = within\n\
\n\
/**\n\
 * Check if an event came from inside of a given element\n\
 *\n\
 * @param object the event object\n\
 * @param Element the element in question\n\
 * @param string the fallback property if relatedTarget is not defined\n\
 * @return boolean\n\
 */\n\
\n\
function within (evt, elem, fallback) {\n\
  var targ = evt.relatedTarget, ret;\n\
  if (targ == null) {\n\
    targ = evt[fallback] || null;\n\
  }\n\
  try {\n\
    while (targ && targ !== elem) {\n\
      targ = targ.parentNode;\n\
    }\n\
    ret = (targ === elem);\n\
  } catch(e) {\n\
    ret = false;\n\
  }\n\
  return ret;\n\
}\n\
//@ sourceURL=stagas-within/index.js"
));
require.register("stagas-mouseenter/index.js", Function("exports, require, module",
"\n\
/**\n\
 * mouseenter\n\
 */\n\
\n\
var within = require('within')\n\
var events = require('event')\n\
\n\
module.exports = mouseenter\n\
\n\
var listeners = []\n\
var fns = []\n\
\n\
function mouseenter (el, fn) {\n\
  function listener (ev) {\n\
    var inside = within(ev, ev.target, 'fromElement')\n\
    if (inside) return\n\
    if (fn) fn.call(this, ev)\n\
  }\n\
  listeners.push(listener)\n\
  fns.push(fn)\n\
  events.bind(el, 'mouseover', listener)\n\
}\n\
\n\
mouseenter.bind = mouseenter\n\
\n\
mouseenter.unbind = function (el, fn) {\n\
  var idx = fns.indexOf(fn)\n\
  if (!~idx) return\n\
  fns.splice(idx, 1)\n\
  events.unbind(el, 'mouseover', listeners.splice(idx, 1)[0])\n\
}\n\
//@ sourceURL=stagas-mouseenter/index.js"
));
require.register("stagas-mouseleave/index.js", Function("exports, require, module",
"\n\
/**\n\
 * mouseleave\n\
 */\n\
\n\
var within = require('within')\n\
var events = require('event')\n\
\n\
module.exports = mouseleave\n\
\n\
var listeners = []\n\
var fns = []\n\
\n\
function mouseleave (el, fn) {\n\
  function listener (ev) {\n\
    var inside = within(ev, ev.target, 'toElement')\n\
    if (inside) return\n\
    if (fn) fn.call(this, ev)\n\
  }\n\
  listeners.push(listener)\n\
  fns.push(fn)\n\
  events.bind(el, 'mouseout', listener)\n\
}\n\
\n\
mouseleave.bind = mouseleave\n\
\n\
mouseleave.unbind = function (el, fn) {\n\
  var idx = fns.indexOf(fn)\n\
  if (!~idx) return\n\
  fns.splice(idx, 1)\n\
  events.unbind(el, 'mouseout', listeners.splice(idx, 1)[0])\n\
}\n\
//@ sourceURL=stagas-mouseleave/index.js"
));
require.register("stagas-hover/index.js", Function("exports, require, module",
"\n\
/**\n\
 * \n\
 * hover\n\
 * \n\
 */\n\
\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var mouseenter = require('mouseenter')\n\
var mouseleave = require('mouseleave')\n\
\n\
/**\n\
 * Export hover.\n\
 */\n\
\n\
module.exports = hover\n\
\n\
/**\n\
 * Binds `mouseenter` and `mouseleave` events\n\
 * on an `el`.\n\
 *\n\
 * @param {element} el\n\
 * @param {fn} onmouseenter\n\
 * @param {fn} onmouseleave\n\
 * @param {number} leavedelay\n\
 *\n\
 * @return {element} el\n\
 */\n\
\n\
function hover (el, onmouseenter, onmouseleave, leavedelay) {\n\
  if (leavedelay) {\n\
    var t\n\
    mouseenter(el, function (ev) {\n\
      clearTimeout(t)\n\
      onmouseenter(ev)\n\
    })\n\
    mouseleave(el, function (ev) {\n\
      clearTimeout(t)\n\
      t = setTimeout(onmouseleave, leavedelay, ev)\n\
    })\n\
  }\n\
  else {\n\
    mouseenter(el, onmouseenter)\n\
    mouseleave(el, onmouseleave)\n\
  }\n\
  return el\n\
}\n\
\n\
/**\n\
 * Hovers only once.\n\
 *\n\
 * @param {element} el \n\
 * @param {fn} onmouseenter \n\
 * @param {fn} onmouseleave \n\
 *\n\
 * @return {element} el\n\
 */\n\
\n\
hover.once = function (el, onmouseenter, onmouseleave) {\n\
  mouseenter(el, onmouseenter)\n\
  mouseleave(el, function wrapper (ev) {\n\
    mouseenter.unbind(el, onmouseenter)\n\
    mouseleave.unbind(el, wrapper)\n\
\n\
    onmouseleave.apply(this, arguments)\n\
  })\n\
}\n\
//@ sourceURL=stagas-hover/index.js"
));
require.register("component-range/index.js", Function("exports, require, module",
"\n\
module.exports = function(from, to, inclusive){\n\
  var ret = [];\n\
  if (inclusive) to++;\n\
\n\
  for (var n = from; n < to; ++n) {\n\
    ret.push(n);\n\
  }\n\
\n\
  return ret;\n\
}//@ sourceURL=component-range/index.js"
));
require.register("component-to-function/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `toFunction()`.\n\
 */\n\
\n\
module.exports = toFunction;\n\
\n\
/**\n\
 * Convert `obj` to a `Function`.\n\
 *\n\
 * @param {Mixed} obj\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function toFunction(obj) {\n\
  switch ({}.toString.call(obj)) {\n\
    case '[object Object]':\n\
      return objectToFunction(obj);\n\
    case '[object Function]':\n\
      return obj;\n\
    case '[object String]':\n\
      return stringToFunction(obj);\n\
    case '[object RegExp]':\n\
      return regexpToFunction(obj);\n\
    default:\n\
      return defaultToFunction(obj);\n\
  }\n\
}\n\
\n\
/**\n\
 * Default to strict equality.\n\
 *\n\
 * @param {Mixed} val\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function defaultToFunction(val) {\n\
  return function(obj){\n\
    return val === obj;\n\
  }\n\
}\n\
\n\
/**\n\
 * Convert `re` to a function.\n\
 *\n\
 * @param {RegExp} re\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function regexpToFunction(re) {\n\
  return function(obj){\n\
    return re.test(obj);\n\
  }\n\
}\n\
\n\
/**\n\
 * Convert property `str` to a function.\n\
 *\n\
 * @param {String} str\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function stringToFunction(str) {\n\
  // immediate such as \"> 20\"\n\
  if (/^ *\\W+/.test(str)) return new Function('_', 'return _ ' + str);\n\
\n\
  // properties such as \"name.first\" or \"age > 18\"\n\
  return new Function('_', 'return _.' + str);\n\
}\n\
\n\
/**\n\
 * Convert `object` to a function.\n\
 *\n\
 * @param {Object} object\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function objectToFunction(obj) {\n\
  var match = {}\n\
  for (var key in obj) {\n\
    match[key] = typeof obj[key] === 'string'\n\
      ? defaultToFunction(obj[key])\n\
      : toFunction(obj[key])\n\
  }\n\
  return function(val){\n\
    if (typeof val !== 'object') return false;\n\
    for (var key in match) {\n\
      if (!(key in val)) return false;\n\
      if (!match[key](val[key])) return false;\n\
    }\n\
    return true;\n\
  }\n\
}\n\
//@ sourceURL=component-to-function/index.js"
));
require.register("component-each/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var toFunction = require('to-function');\n\
var type;\n\
\n\
try {\n\
  type = require('type-component');\n\
} catch (e) {\n\
  type = require('type');\n\
}\n\
\n\
/**\n\
 * HOP reference.\n\
 */\n\
\n\
var has = Object.prototype.hasOwnProperty;\n\
\n\
/**\n\
 * Iterate the given `obj` and invoke `fn(val, i)`.\n\
 *\n\
 * @param {String|Array|Object} obj\n\
 * @param {Function} fn\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(obj, fn){\n\
  fn = toFunction(fn);\n\
  switch (type(obj)) {\n\
    case 'array':\n\
      return array(obj, fn);\n\
    case 'object':\n\
      if ('number' == typeof obj.length) return array(obj, fn);\n\
      return object(obj, fn);\n\
    case 'string':\n\
      return string(obj, fn);\n\
  }\n\
};\n\
\n\
/**\n\
 * Iterate string chars.\n\
 *\n\
 * @param {String} obj\n\
 * @param {Function} fn\n\
 * @api private\n\
 */\n\
\n\
function string(obj, fn) {\n\
  for (var i = 0; i < obj.length; ++i) {\n\
    fn(obj.charAt(i), i);\n\
  }\n\
}\n\
\n\
/**\n\
 * Iterate object keys.\n\
 *\n\
 * @param {Object} obj\n\
 * @param {Function} fn\n\
 * @api private\n\
 */\n\
\n\
function object(obj, fn) {\n\
  for (var key in obj) {\n\
    if (has.call(obj, key)) {\n\
      fn(key, obj[key]);\n\
    }\n\
  }\n\
}\n\
\n\
/**\n\
 * Iterate array-ish.\n\
 *\n\
 * @param {Array|Object} obj\n\
 * @param {Function} fn\n\
 * @api private\n\
 */\n\
\n\
function array(obj, fn) {\n\
  for (var i = 0; i < obj.length; ++i) {\n\
    fn(obj[i], i);\n\
  }\n\
}\n\
//@ sourceURL=component-each/index.js"
));
require.register("monstercat-rating/index.js", Function("exports, require, module",
"\n\
var domify = require('domify');\n\
var hover = require('hover');\n\
var each = require('each');\n\
var events = require('event');\n\
var bind = require('bind');\n\
var Emitter = require('emitter');\n\
var classes = require('classes');\n\
var exclrange = require('range');\n\
var range = function(a, b){ return exclrange(a, b, true); };\n\
\n\
module.exports = Rating;\n\
\n\
function Rating(opts) {\n\
  if (!(this instanceof Rating)) return new Rating(opts);\n\
  Emitter.call(this);\n\
  var self = this;\n\
  opts = opts || {};\n\
\n\
  var data = {};\n\
  data.stars = opts.stars != null? opts.stars : 5;\n\
  var el = this.el = domify(require('./template')(data));\n\
\n\
  this.stars = data.stars;\n\
  this.els = [].slice.call(el.children);\n\
  this.delay = opts.delay != null? opts.delay : 100;\n\
  this.current = [];\n\
  this.disabled = false;\n\
\n\
  var timeout = null;\n\
  var reset = true;\n\
\n\
  var over = function(star, i){\n\
    if (timeout !== null) {\n\
      clearTimeout(timeout);\n\
      timeout = null;\n\
    }\n\
\n\
    if (reset) {\n\
      reset = false;\n\
      self.emit('mouseenter', star, i);\n\
    }\n\
\n\
    if (!this.disabled) {\n\
      this.highlight(range(1, i), true);\n\
      this.highlight(range(i+1, this.stars), false);\n\
    }\n\
  };\n\
\n\
  var out = function(star, i) {\n\
    timeout = setTimeout(function(){\n\
      reset = true;\n\
      self.emit('mouseleave', star, i);\n\
      if (!this.disabled) {\n\
        self.highlight(range(1, self.stars), false);\n\
        self.highlight(self.current, true);\n\
      }\n\
    }, this.delay);\n\
  };\n\
\n\
  var click = function(star, i) {\n\
    this.emit(\"click\", star, i, self.disabled);\n\
    if (!self.disabled)\n\
      self.rate(i);\n\
    classes(star).toggle('clicked');\n\
  }\n\
\n\
  each(el.children, function(star, i){\n\
    var bnd = function(fn) { return bind(self, fn, star, i+1); };\n\
    hover(star, bnd(over), bnd(out));\n\
    events.bind(star, 'click', bnd(click));\n\
  });\n\
}\n\
\n\
Emitter(Rating.prototype);\n\
\n\
Rating.prototype.rate = function Rating_rate(rating) {\n\
  this.rating = rating;\n\
  this.current = range(1, rating);\n\
  this.set(this.current);\n\
  this.emit('rating', rating)\n\
};\n\
\n\
Rating.prototype.set = function Rating_set(setting) {\n\
  this.current = setting;\n\
  this.highlight(range(1, this.stars), false);\n\
  this.highlight(this.current, true);\n\
}\n\
\n\
Rating.prototype.highlight = function Rating_highlight(ns, highlight) {\n\
  highlight = highlight == null? true : highlight;\n\
\n\
  var self = this;\n\
  each(ns, function(n){\n\
    var el = self.els[n-1];\n\
    var c = classes(el);\n\
    if (highlight)\n\
      c.add('highlight');\n\
    else\n\
      c.remove('highlight');\n\
  });\n\
};\n\
\n\
Rating.prototype.attach = function Rating_attach(el) {\n\
  el.appendChild(this.el);\n\
};\n\
\n\
Rating.prototype.enable = function Rating_enable() {\n\
  this.disabled = false;\n\
  classes(this.el).remove('disabled');\n\
};\n\
\n\
Rating.prototype.disable = function Rating_disable() {\n\
  this.disabled = true;\n\
  classes(this.el).add('disabled');\n\
};\n\
//@ sourceURL=monstercat-rating/index.js"
));
require.register("monstercat-rating/template.js", Function("exports, require, module",
"var jade = require('jade-runtime');\n\
module.exports = \n\
function anonymous(locals, attrs, escape, rethrow, merge) {\n\
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;\n\
var buf = [];\n\
with (locals || {}) {\n\
var interp;\n\
buf.push('<div class=\"stars\">');\n\
 for (var i = 0; i < stars; ++i)\n\
{\n\
buf.push('<div class=\"star\"></div>');\n\
}\n\
buf.push('</div>');\n\
}\n\
return buf.join(\"\");\n\
};\n\
//@ sourceURL=monstercat-rating/template.js"
));






























require.register("segmentio-overlay/lib/index.html", Function("exports, require, module",
"module.exports = '<div class=\"overlay hidden\"></div>';//@ sourceURL=segmentio-overlay/lib/index.html"
));



require.register("segmentio-modal/lib/index.html", Function("exports, require, module",
"module.exports = '<div class=\"modal-wrapper hidden\">\\n\
  <div class=\"modal hidden\">\\n\
    <a class=\"modal-close-button\"></a>\\n\
  </div>\\n\
</div>';//@ sourceURL=segmentio-modal/lib/index.html"
));







require.alias("component-moment/index.js", "app/deps/moment/index.js");
require.alias("component-moment/index.js", "moment/index.js");

require.alias("segmentio-modal/lib/index.js", "app/deps/modal/lib/index.js");
require.alias("segmentio-modal/lib/index.js", "app/deps/modal/index.js");
require.alias("segmentio-modal/lib/index.js", "modal/index.js");
require.alias("component-classes/index.js", "segmentio-modal/deps/classes/index.js");
require.alias("component-indexof/index.js", "component-classes/deps/indexof/index.js");

require.alias("component-domify/index.js", "segmentio-modal/deps/domify/index.js");

require.alias("component-emitter/index.js", "segmentio-modal/deps/emitter/index.js");

require.alias("component-event/index.js", "segmentio-modal/deps/event/index.js");

require.alias("ianstormtaylor-redraw/index.js", "segmentio-modal/deps/redraw/index.js");

require.alias("segmentio-overlay/lib/index.js", "segmentio-modal/deps/overlay/lib/index.js");
require.alias("segmentio-overlay/lib/index.js", "segmentio-modal/deps/overlay/index.js");
require.alias("component-domify/index.js", "segmentio-overlay/deps/domify/index.js");

require.alias("component-emitter/index.js", "segmentio-overlay/deps/emitter/index.js");

require.alias("component-event/index.js", "segmentio-overlay/deps/event/index.js");

require.alias("ianstormtaylor-classes/index.js", "segmentio-overlay/deps/classes/index.js");
require.alias("jkroso-classes/index.js", "ianstormtaylor-classes/deps/classes/index.js");
require.alias("jkroso-classes/fallback.js", "ianstormtaylor-classes/deps/classes/fallback.js");
require.alias("jkroso-classes/modern.js", "ianstormtaylor-classes/deps/classes/modern.js");
require.alias("component-indexof/index.js", "jkroso-classes/deps/indexof/index.js");

require.alias("ianstormtaylor-redraw/index.js", "segmentio-overlay/deps/redraw/index.js");

require.alias("segmentio-bind-all/index.js", "segmentio-overlay/deps/bind-all/index.js");
require.alias("component-bind/index.js", "segmentio-bind-all/deps/bind/index.js");

require.alias("component-type/index.js", "segmentio-bind-all/deps/type/index.js");

require.alias("segmentio-on-escape/index.js", "segmentio-overlay/deps/on-escape/index.js");
require.alias("component-event/index.js", "segmentio-on-escape/deps/event/index.js");

require.alias("component-indexof/index.js", "segmentio-on-escape/deps/indexof/index.js");

require.alias("yields-after-transition/index.js", "segmentio-overlay/deps/after-transition/index.js");
require.alias("yields-after-transition/index.js", "segmentio-overlay/deps/after-transition/index.js");
require.alias("yields-has-transitions/index.js", "yields-after-transition/deps/has-transitions/index.js");
require.alias("yields-has-transitions/index.js", "yields-after-transition/deps/has-transitions/index.js");
require.alias("yields-has-transitions/index.js", "yields-has-transitions/index.js");
require.alias("ecarter-css-emitter/index.js", "yields-after-transition/deps/css-emitter/index.js");
require.alias("component-emitter/index.js", "ecarter-css-emitter/deps/emitter/index.js");

require.alias("component-event/index.js", "ecarter-css-emitter/deps/event/index.js");

require.alias("component-once/index.js", "yields-after-transition/deps/once/index.js");

require.alias("yields-after-transition/index.js", "yields-after-transition/index.js");
require.alias("segmentio-overlay/lib/index.js", "segmentio-overlay/index.js");
require.alias("yields-after-transition/index.js", "segmentio-modal/deps/after-transition/index.js");
require.alias("yields-after-transition/index.js", "segmentio-modal/deps/after-transition/index.js");
require.alias("yields-has-transitions/index.js", "yields-after-transition/deps/has-transitions/index.js");
require.alias("yields-has-transitions/index.js", "yields-after-transition/deps/has-transitions/index.js");
require.alias("yields-has-transitions/index.js", "yields-has-transitions/index.js");
require.alias("ecarter-css-emitter/index.js", "yields-after-transition/deps/css-emitter/index.js");
require.alias("component-emitter/index.js", "ecarter-css-emitter/deps/emitter/index.js");

require.alias("component-event/index.js", "ecarter-css-emitter/deps/event/index.js");

require.alias("component-once/index.js", "yields-after-transition/deps/once/index.js");

require.alias("yields-after-transition/index.js", "yields-after-transition/index.js");
require.alias("segmentio-modal/lib/index.js", "segmentio-modal/index.js");
require.alias("stagas-mod-player/index.js", "app/deps/mod-player/index.js");
require.alias("stagas-mod-player/index.js", "mod-player/index.js");
require.alias("component-emitter/index.js", "stagas-mod-player/deps/emitter/index.js");


require.alias("monstercat-rating/index.js", "app/deps/rating/index.js");
require.alias("monstercat-rating/template.js", "app/deps/rating/template.js");
require.alias("monstercat-rating/index.js", "app/deps/rating/index.js");
require.alias("monstercat-rating/index.js", "rating/index.js");
require.alias("monstercat-jade-runtime/index.js", "monstercat-rating/deps/jade-runtime/index.js");

require.alias("stagas-hover/index.js", "monstercat-rating/deps/hover/index.js");
require.alias("stagas-mouseenter/index.js", "stagas-hover/deps/mouseenter/index.js");
require.alias("stagas-within/index.js", "stagas-mouseenter/deps/within/index.js");

require.alias("component-event/index.js", "stagas-mouseenter/deps/event/index.js");

require.alias("stagas-mouseleave/index.js", "stagas-hover/deps/mouseleave/index.js");
require.alias("stagas-within/index.js", "stagas-mouseleave/deps/within/index.js");

require.alias("component-event/index.js", "stagas-mouseleave/deps/event/index.js");

require.alias("component-range/index.js", "monstercat-rating/deps/range/index.js");

require.alias("component-emitter/index.js", "monstercat-rating/deps/emitter/index.js");

require.alias("component-classes/index.js", "monstercat-rating/deps/classes/index.js");
require.alias("component-indexof/index.js", "component-classes/deps/indexof/index.js");

require.alias("component-event/index.js", "monstercat-rating/deps/event/index.js");

require.alias("component-bind/index.js", "monstercat-rating/deps/bind/index.js");

require.alias("component-each/index.js", "monstercat-rating/deps/each/index.js");
require.alias("component-to-function/index.js", "component-each/deps/to-function/index.js");

require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("component-domify/index.js", "monstercat-rating/deps/domify/index.js");

require.alias("monstercat-rating/index.js", "monstercat-rating/index.js");