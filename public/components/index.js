
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
require.register("component-moment/index.js", function(exports, require, module){
// moment.js
// version : 2.0.0
// author : Tim Wood
// license : MIT
// momentjs.com

(function (undefined) {

    /************************************
        Constants
    ************************************/

    var moment,
        VERSION = "2.0.0",
        round = Math.round, i,
        // internal storage for language config files
        languages = {},

        // check for nodeJS
        hasModule = (typeof module !== 'undefined' && module.exports),

        // ASP.NET json date format regex
        aspNetJsonRegex = /^\/?Date\((\-?\d+)/i,

        // format tokens
        formattingTokens = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|YYYYY|YYYY|YY|a|A|hh?|HH?|mm?|ss?|SS?S?|X|zz?|ZZ?|.)/g,
        localFormattingTokens = /(\[[^\[]*\])|(\\)?(LT|LL?L?L?|l{1,4})/g,

        // parsing tokens
        parseMultipleFormatChunker = /([0-9a-zA-Z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)/gi,

        // parsing token regexes
        parseTokenOneOrTwoDigits = /\d\d?/, // 0 - 99
        parseTokenOneToThreeDigits = /\d{1,3}/, // 0 - 999
        parseTokenThreeDigits = /\d{3}/, // 000 - 999
        parseTokenFourDigits = /\d{1,4}/, // 0 - 9999
        parseTokenSixDigits = /[+\-]?\d{1,6}/, // -999,999 - 999,999
        parseTokenWord = /[0-9]*[a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF]+\s*?[\u0600-\u06FF]+/i, // any word (or two) characters or numbers including two word month in arabic.
        parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/i, // +00:00 -00:00 +0000 -0000 or Z
        parseTokenT = /T/i, // T (ISO seperator)
        parseTokenTimestampMs = /[\+\-]?\d+(\.\d{1,3})?/, // 123456789 123456789.123

        // preliminary iso regex
        // 0000-00-00 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000
        isoRegex = /^\s*\d{4}-\d\d-\d\d((T| )(\d\d(:\d\d(:\d\d(\.\d\d?\d?)?)?)?)?([\+\-]\d\d:?\d\d)?)?/,
        isoFormat = 'YYYY-MM-DDTHH:mm:ssZ',

        // iso time formats and regexes
        isoTimes = [
            ['HH:mm:ss.S', /(T| )\d\d:\d\d:\d\d\.\d{1,3}/],
            ['HH:mm:ss', /(T| )\d\d:\d\d:\d\d/],
            ['HH:mm', /(T| )\d\d:\d\d/],
            ['HH', /(T| )\d\d/]
        ],

        // timezone chunker "+10:00" > ["10", "00"] or "-1530" > ["-15", "30"]
        parseTimezoneChunker = /([\+\-]|\d\d)/gi,

        // getter and setter names
        proxyGettersAndSetters = 'Month|Date|Hours|Minutes|Seconds|Milliseconds'.split('|'),
        unitMillisecondFactors = {
            'Milliseconds' : 1,
            'Seconds' : 1e3,
            'Minutes' : 6e4,
            'Hours' : 36e5,
            'Days' : 864e5,
            'Months' : 2592e6,
            'Years' : 31536e6
        },

        // format function strings
        formatFunctions = {},

        // tokens to ordinalize and pad
        ordinalizeTokens = 'DDD w W M D d'.split(' '),
        paddedTokens = 'M D H h m s w W'.split(' '),

        formatTokenFunctions = {
            M    : function () {
                return this.month() + 1;
            },
            MMM  : function (format) {
                return this.lang().monthsShort(this, format);
            },
            MMMM : function (format) {
                return this.lang().months(this, format);
            },
            D    : function () {
                return this.date();
            },
            DDD  : function () {
                return this.dayOfYear();
            },
            d    : function () {
                return this.day();
            },
            dd   : function (format) {
                return this.lang().weekdaysMin(this, format);
            },
            ddd  : function (format) {
                return this.lang().weekdaysShort(this, format);
            },
            dddd : function (format) {
                return this.lang().weekdays(this, format);
            },
            w    : function () {
                return this.week();
            },
            W    : function () {
                return this.isoWeek();
            },
            YY   : function () {
                return leftZeroFill(this.year() % 100, 2);
            },
            YYYY : function () {
                return leftZeroFill(this.year(), 4);
            },
            YYYYY : function () {
                return leftZeroFill(this.year(), 5);
            },
            a    : function () {
                return this.lang().meridiem(this.hours(), this.minutes(), true);
            },
            A    : function () {
                return this.lang().meridiem(this.hours(), this.minutes(), false);
            },
            H    : function () {
                return this.hours();
            },
            h    : function () {
                return this.hours() % 12 || 12;
            },
            m    : function () {
                return this.minutes();
            },
            s    : function () {
                return this.seconds();
            },
            S    : function () {
                return ~~(this.milliseconds() / 100);
            },
            SS   : function () {
                return leftZeroFill(~~(this.milliseconds() / 10), 2);
            },
            SSS  : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            Z    : function () {
                var a = -this.zone(),
                    b = "+";
                if (a < 0) {
                    a = -a;
                    b = "-";
                }
                return b + leftZeroFill(~~(a / 60), 2) + ":" + leftZeroFill(~~a % 60, 2);
            },
            ZZ   : function () {
                var a = -this.zone(),
                    b = "+";
                if (a < 0) {
                    a = -a;
                    b = "-";
                }
                return b + leftZeroFill(~~(10 * a / 6), 4);
            },
            X    : function () {
                return this.unix();
            }
        };

    function padToken(func, count) {
        return function (a) {
            return leftZeroFill(func.call(this, a), count);
        };
    }
    function ordinalizeToken(func) {
        return function (a) {
            return this.lang().ordinal(func.call(this, a));
        };
    }

    while (ordinalizeTokens.length) {
        i = ordinalizeTokens.pop();
        formatTokenFunctions[i + 'o'] = ordinalizeToken(formatTokenFunctions[i]);
    }
    while (paddedTokens.length) {
        i = paddedTokens.pop();
        formatTokenFunctions[i + i] = padToken(formatTokenFunctions[i], 2);
    }
    formatTokenFunctions.DDDD = padToken(formatTokenFunctions.DDD, 3);


    /************************************
        Constructors
    ************************************/

    function Language() {

    }

    // Moment prototype object
    function Moment(config) {
        extend(this, config);
    }

    // Duration Constructor
    function Duration(duration) {
        var data = this._data = {},
            years = duration.years || duration.year || duration.y || 0,
            months = duration.months || duration.month || duration.M || 0,
            weeks = duration.weeks || duration.week || duration.w || 0,
            days = duration.days || duration.day || duration.d || 0,
            hours = duration.hours || duration.hour || duration.h || 0,
            minutes = duration.minutes || duration.minute || duration.m || 0,
            seconds = duration.seconds || duration.second || duration.s || 0,
            milliseconds = duration.milliseconds || duration.millisecond || duration.ms || 0;

        // representation for dateAddRemove
        this._milliseconds = milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 36e5; // 1000 * 60 * 60
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = days +
            weeks * 7;
        // It is impossible translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = months +
            years * 12;

        // The following code bubbles up values, see the tests for
        // examples of what that means.
        data.milliseconds = milliseconds % 1000;
        seconds += absRound(milliseconds / 1000);

        data.seconds = seconds % 60;
        minutes += absRound(seconds / 60);

        data.minutes = minutes % 60;
        hours += absRound(minutes / 60);

        data.hours = hours % 24;
        days += absRound(hours / 24);

        days += weeks * 7;
        data.days = days % 30;

        months += absRound(days / 30);

        data.months = months % 12;
        years += absRound(months / 12);

        data.years = years;
    }


    /************************************
        Helpers
    ************************************/


    function extend(a, b) {
        for (var i in b) {
            if (b.hasOwnProperty(i)) {
                a[i] = b[i];
            }
        }
        return a;
    }

    function absRound(number) {
        if (number < 0) {
            return Math.ceil(number);
        } else {
            return Math.floor(number);
        }
    }

    // left zero fill a number
    // see http://jsperf.com/left-zero-filling for performance comparison
    function leftZeroFill(number, targetLength) {
        var output = number + '';
        while (output.length < targetLength) {
            output = '0' + output;
        }
        return output;
    }

    // helper function for _.addTime and _.subtractTime
    function addOrSubtractDurationFromMoment(mom, duration, isAdding) {
        var ms = duration._milliseconds,
            d = duration._days,
            M = duration._months,
            currentDate;

        if (ms) {
            mom._d.setTime(+mom + ms * isAdding);
        }
        if (d) {
            mom.date(mom.date() + d * isAdding);
        }
        if (M) {
            currentDate = mom.date();
            mom.date(1)
                .month(mom.month() + M * isAdding)
                .date(Math.min(currentDate, mom.daysInMonth()));
        }
    }

    // check if is an array
    function isArray(input) {
        return Object.prototype.toString.call(input) === '[object Array]';
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if (~~array1[i] !== ~~array2[i]) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }


    /************************************
        Languages
    ************************************/


    Language.prototype = {
        set : function (config) {
            var prop, i;
            for (i in config) {
                prop = config[i];
                if (typeof prop === 'function') {
                    this[i] = prop;
                } else {
                    this['_' + i] = prop;
                }
            }
        },

        _months : "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
        months : function (m) {
            return this._months[m.month()];
        },

        _monthsShort : "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
        monthsShort : function (m) {
            return this._monthsShort[m.month()];
        },

        monthsParse : function (monthName) {
            var i, mom, regex, output;

            if (!this._monthsParse) {
                this._monthsParse = [];
            }

            for (i = 0; i < 12; i++) {
                // make the regex if we don't have it already
                if (!this._monthsParse[i]) {
                    mom = moment([2000, i]);
                    regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                    this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (this._monthsParse[i].test(monthName)) {
                    return i;
                }
            }
        },

        _weekdays : "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
        weekdays : function (m) {
            return this._weekdays[m.day()];
        },

        _weekdaysShort : "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
        weekdaysShort : function (m) {
            return this._weekdaysShort[m.day()];
        },

        _weekdaysMin : "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
        weekdaysMin : function (m) {
            return this._weekdaysMin[m.day()];
        },

        _longDateFormat : {
            LT : "h:mm A",
            L : "MM/DD/YYYY",
            LL : "MMMM D YYYY",
            LLL : "MMMM D YYYY LT",
            LLLL : "dddd, MMMM D YYYY LT"
        },
        longDateFormat : function (key) {
            var output = this._longDateFormat[key];
            if (!output && this._longDateFormat[key.toUpperCase()]) {
                output = this._longDateFormat[key.toUpperCase()].replace(/MMMM|MM|DD|dddd/g, function (val) {
                    return val.slice(1);
                });
                this._longDateFormat[key] = output;
            }
            return output;
        },

        meridiem : function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? 'pm' : 'PM';
            } else {
                return isLower ? 'am' : 'AM';
            }
        },

        _calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[last] dddd [at] LT',
            sameElse : 'L'
        },
        calendar : function (key, mom) {
            var output = this._calendar[key];
            return typeof output === 'function' ? output.apply(mom) : output;
        },

        _relativeTime : {
            future : "in %s",
            past : "%s ago",
            s : "a few seconds",
            m : "a minute",
            mm : "%d minutes",
            h : "an hour",
            hh : "%d hours",
            d : "a day",
            dd : "%d days",
            M : "a month",
            MM : "%d months",
            y : "a year",
            yy : "%d years"
        },
        relativeTime : function (number, withoutSuffix, string, isFuture) {
            var output = this._relativeTime[string];
            return (typeof output === 'function') ?
                output(number, withoutSuffix, string, isFuture) :
                output.replace(/%d/i, number);
        },
        pastFuture : function (diff, output) {
            var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
            return typeof format === 'function' ? format(output) : format.replace(/%s/i, output);
        },

        ordinal : function (number) {
            return this._ordinal.replace("%d", number);
        },
        _ordinal : "%d",

        preparse : function (string) {
            return string;
        },

        postformat : function (string) {
            return string;
        },

        week : function (mom) {
            return weekOfYear(mom, this._week.dow, this._week.doy);
        },
        _week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        }
    };

    // Loads a language definition into the `languages` cache.  The function
    // takes a key and optionally values.  If not in the browser and no values
    // are provided, it will load the language file module.  As a convenience,
    // this function also returns the language values.
    function loadLang(key, values) {
        values.abbr = key;
        if (!languages[key]) {
            languages[key] = new Language();
        }
        languages[key].set(values);
        return languages[key];
    }

    // Determines which language definition to use and returns it.
    //
    // With no parameters, it will return the global language.  If you
    // pass in a language key, such as 'en', it will return the
    // definition for 'en', so long as 'en' has already been loaded using
    // moment.lang.
    function getLangDefinition(key) {
        if (!key) {
            return moment.fn._lang;
        }
        if (!languages[key] && hasModule) {
            require('./lang/' + key);
        }
        return languages[key];
    }


    /************************************
        Formatting
    ************************************/


    function removeFormattingTokens(input) {
        if (input.match(/\[.*\]/)) {
            return input.replace(/^\[|\]$/g, "");
        }
        return input.replace(/\\/g, "");
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = "";
            for (i = 0; i < length; i++) {
                output += typeof array[i].call === 'function' ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return m.lang().longDateFormat(input) || input;
        }

        while (i-- && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
        }

        if (!formatFunctions[format]) {
            formatFunctions[format] = makeFormatFunction(format);
        }

        return formatFunctions[format](m);
    }


    /************************************
        Parsing
    ************************************/


    // get the regex to find the next token
    function getParseRegexForToken(token) {
        switch (token) {
        case 'DDDD':
            return parseTokenThreeDigits;
        case 'YYYY':
            return parseTokenFourDigits;
        case 'YYYYY':
            return parseTokenSixDigits;
        case 'S':
        case 'SS':
        case 'SSS':
        case 'DDD':
            return parseTokenOneToThreeDigits;
        case 'MMM':
        case 'MMMM':
        case 'dd':
        case 'ddd':
        case 'dddd':
        case 'a':
        case 'A':
            return parseTokenWord;
        case 'X':
            return parseTokenTimestampMs;
        case 'Z':
        case 'ZZ':
            return parseTokenTimezone;
        case 'T':
            return parseTokenT;
        case 'MM':
        case 'DD':
        case 'YY':
        case 'HH':
        case 'hh':
        case 'mm':
        case 'ss':
        case 'M':
        case 'D':
        case 'd':
        case 'H':
        case 'h':
        case 'm':
        case 's':
            return parseTokenOneOrTwoDigits;
        default :
            return new RegExp(token.replace('\\', ''));
        }
    }

    // function to convert string input to date
    function addTimeToArrayFromToken(token, input, config) {
        var a, b,
            datePartArray = config._a;

        switch (token) {
        // MONTH
        case 'M' : // fall through to MM
        case 'MM' :
            datePartArray[1] = (input == null) ? 0 : ~~input - 1;
            break;
        case 'MMM' : // fall through to MMMM
        case 'MMMM' :
            a = getLangDefinition(config._l).monthsParse(input);
            // if we didn't find a month name, mark the date as invalid.
            if (a != null) {
                datePartArray[1] = a;
            } else {
                config._isValid = false;
            }
            break;
        // DAY OF MONTH
        case 'D' : // fall through to DDDD
        case 'DD' : // fall through to DDDD
        case 'DDD' : // fall through to DDDD
        case 'DDDD' :
            if (input != null) {
                datePartArray[2] = ~~input;
            }
            break;
        // YEAR
        case 'YY' :
            datePartArray[0] = ~~input + (~~input > 68 ? 1900 : 2000);
            break;
        case 'YYYY' :
        case 'YYYYY' :
            datePartArray[0] = ~~input;
            break;
        // AM / PM
        case 'a' : // fall through to A
        case 'A' :
            config._isPm = ((input + '').toLowerCase() === 'pm');
            break;
        // 24 HOUR
        case 'H' : // fall through to hh
        case 'HH' : // fall through to hh
        case 'h' : // fall through to hh
        case 'hh' :
            datePartArray[3] = ~~input;
            break;
        // MINUTE
        case 'm' : // fall through to mm
        case 'mm' :
            datePartArray[4] = ~~input;
            break;
        // SECOND
        case 's' : // fall through to ss
        case 'ss' :
            datePartArray[5] = ~~input;
            break;
        // MILLISECOND
        case 'S' :
        case 'SS' :
        case 'SSS' :
            datePartArray[6] = ~~ (('0.' + input) * 1000);
            break;
        // UNIX TIMESTAMP WITH MS
        case 'X':
            config._d = new Date(parseFloat(input) * 1000);
            break;
        // TIMEZONE
        case 'Z' : // fall through to ZZ
        case 'ZZ' :
            config._useUTC = true;
            a = (input + '').match(parseTimezoneChunker);
            if (a && a[1]) {
                config._tzh = ~~a[1];
            }
            if (a && a[2]) {
                config._tzm = ~~a[2];
            }
            // reverse offsets
            if (a && a[0] === '+') {
                config._tzh = -config._tzh;
                config._tzm = -config._tzm;
            }
            break;
        }

        // if the input is null, the date is not valid
        if (input == null) {
            config._isValid = false;
        }
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function dateFromArray(config) {
        var i, date, input = [];

        if (config._d) {
            return;
        }

        for (i = 0; i < 7; i++) {
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
        }

        // add the offsets to the time to be parsed so that we can have a clean array for checking isValid
        input[3] += config._tzh || 0;
        input[4] += config._tzm || 0;

        date = new Date(0);

        if (config._useUTC) {
            date.setUTCFullYear(input[0], input[1], input[2]);
            date.setUTCHours(input[3], input[4], input[5], input[6]);
        } else {
            date.setFullYear(input[0], input[1], input[2]);
            date.setHours(input[3], input[4], input[5], input[6]);
        }

        config._d = date;
    }

    // date from string and format string
    function makeDateFromStringAndFormat(config) {
        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var tokens = config._f.match(formattingTokens),
            string = config._i,
            i, parsedInput;

        config._a = [];

        for (i = 0; i < tokens.length; i++) {
            parsedInput = (getParseRegexForToken(tokens[i]).exec(string) || [])[0];
            if (parsedInput) {
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
            }
            // don't parse if its not a known token
            if (formatTokenFunctions[tokens[i]]) {
                addTimeToArrayFromToken(tokens[i], parsedInput, config);
            }
        }
        // handle am pm
        if (config._isPm && config._a[3] < 12) {
            config._a[3] += 12;
        }
        // if is 12 am, change hours to 0
        if (config._isPm === false && config._a[3] === 12) {
            config._a[3] = 0;
        }
        // return
        dateFromArray(config);
    }

    // date from string and array of format strings
    function makeDateFromStringAndArray(config) {
        var tempConfig,
            tempMoment,
            bestMoment,

            scoreToBeat = 99,
            i,
            currentScore;

        for (i = config._f.length; i > 0; i--) {
            tempConfig = extend({}, config);
            tempConfig._f = config._f[i - 1];
            makeDateFromStringAndFormat(tempConfig);
            tempMoment = new Moment(tempConfig);

            if (tempMoment.isValid()) {
                bestMoment = tempMoment;
                break;
            }

            currentScore = compareArrays(tempConfig._a, tempMoment.toArray());

            if (currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                bestMoment = tempMoment;
            }
        }

        extend(config, bestMoment);
    }

    // date from iso format
    function makeDateFromString(config) {
        var i,
            string = config._i;
        if (isoRegex.exec(string)) {
            config._f = 'YYYY-MM-DDT';
            for (i = 0; i < 4; i++) {
                if (isoTimes[i][1].exec(string)) {
                    config._f += isoTimes[i][0];
                    break;
                }
            }
            if (parseTokenTimezone.exec(string)) {
                config._f += " Z";
            }
            makeDateFromStringAndFormat(config);
        } else {
            config._d = new Date(string);
        }
    }

    function makeDateFromInput(config) {
        var input = config._i,
            matched = aspNetJsonRegex.exec(input);

        if (input === undefined) {
            config._d = new Date();
        } else if (matched) {
            config._d = new Date(+matched[1]);
        } else if (typeof input === 'string') {
            makeDateFromString(config);
        } else if (isArray(input)) {
            config._a = input.slice(0);
            dateFromArray(config);
        } else {
            config._d = input instanceof Date ? new Date(+input) : new Date(input);
        }
    }


    /************************************
        Relative Time
    ************************************/


    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, lang) {
        return lang.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function relativeTime(milliseconds, withoutSuffix, lang) {
        var seconds = round(Math.abs(milliseconds) / 1000),
            minutes = round(seconds / 60),
            hours = round(minutes / 60),
            days = round(hours / 24),
            years = round(days / 365),
            args = seconds < 45 && ['s', seconds] ||
                minutes === 1 && ['m'] ||
                minutes < 45 && ['mm', minutes] ||
                hours === 1 && ['h'] ||
                hours < 22 && ['hh', hours] ||
                days === 1 && ['d'] ||
                days <= 25 && ['dd', days] ||
                days <= 45 && ['M'] ||
                days < 345 && ['MM', round(days / 30)] ||
                years === 1 && ['y'] || ['yy', years];
        args[2] = withoutSuffix;
        args[3] = milliseconds > 0;
        args[4] = lang;
        return substituteTimeAgo.apply({}, args);
    }


    /************************************
        Week of Year
    ************************************/


    // firstDayOfWeek       0 = sun, 6 = sat
    //                      the day of the week that starts the week
    //                      (usually sunday or monday)
    // firstDayOfWeekOfYear 0 = sun, 6 = sat
    //                      the first week is the week that contains the first
    //                      of this day of the week
    //                      (eg. ISO weeks use thursday (4))
    function weekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {
        var end = firstDayOfWeekOfYear - firstDayOfWeek,
            daysToDayOfWeek = firstDayOfWeekOfYear - mom.day();


        if (daysToDayOfWeek > end) {
            daysToDayOfWeek -= 7;
        }

        if (daysToDayOfWeek < end - 7) {
            daysToDayOfWeek += 7;
        }

        return Math.ceil(moment(mom).add('d', daysToDayOfWeek).dayOfYear() / 7);
    }


    /************************************
        Top Level Functions
    ************************************/

    function makeMoment(config) {
        var input = config._i,
            format = config._f;

        if (input === null || input === '') {
            return null;
        }

        if (typeof input === 'string') {
            config._i = input = getLangDefinition().preparse(input);
        }

        if (moment.isMoment(input)) {
            config = extend({}, input);
            config._d = new Date(+input._d);
        } else if (format) {
            if (isArray(format)) {
                makeDateFromStringAndArray(config);
            } else {
                makeDateFromStringAndFormat(config);
            }
        } else {
            makeDateFromInput(config);
        }

        return new Moment(config);
    }

    moment = function (input, format, lang) {
        return makeMoment({
            _i : input,
            _f : format,
            _l : lang,
            _isUTC : false
        });
    };

    // creating with utc
    moment.utc = function (input, format, lang) {
        return makeMoment({
            _useUTC : true,
            _isUTC : true,
            _l : lang,
            _i : input,
            _f : format
        });
    };

    // creating with unix timestamp (in seconds)
    moment.unix = function (input) {
        return moment(input * 1000);
    };

    // duration
    moment.duration = function (input, key) {
        var isDuration = moment.isDuration(input),
            isNumber = (typeof input === 'number'),
            duration = (isDuration ? input._data : (isNumber ? {} : input)),
            ret;

        if (isNumber) {
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        }

        ret = new Duration(duration);

        if (isDuration && input.hasOwnProperty('_lang')) {
            ret._lang = input._lang;
        }

        return ret;
    };

    // version number
    moment.version = VERSION;

    // default format
    moment.defaultFormat = isoFormat;

    // This function will load languages and then set the global language.  If
    // no arguments are passed in, it will simply return the current global
    // language key.
    moment.lang = function (key, values) {
        var i;

        if (!key) {
            return moment.fn._lang._abbr;
        }
        if (values) {
            loadLang(key, values);
        } else if (!languages[key]) {
            getLangDefinition(key);
        }
        moment.duration.fn._lang = moment.fn._lang = getLangDefinition(key);
    };

    // returns language data
    moment.langData = function (key) {
        if (key && key._lang && key._lang._abbr) {
            key = key._lang._abbr;
        }
        return getLangDefinition(key);
    };

    // compare moment object
    moment.isMoment = function (obj) {
        return obj instanceof Moment;
    };

    // for typechecking Duration objects
    moment.isDuration = function (obj) {
        return obj instanceof Duration;
    };


    /************************************
        Moment Prototype
    ************************************/


    moment.fn = Moment.prototype = {

        clone : function () {
            return moment(this);
        },

        valueOf : function () {
            return +this._d;
        },

        unix : function () {
            return Math.floor(+this._d / 1000);
        },

        toString : function () {
            return this.format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ");
        },

        toDate : function () {
            return this._d;
        },

        toJSON : function () {
            return moment.utc(this).format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
        },

        toArray : function () {
            var m = this;
            return [
                m.year(),
                m.month(),
                m.date(),
                m.hours(),
                m.minutes(),
                m.seconds(),
                m.milliseconds()
            ];
        },

        isValid : function () {
            if (this._isValid == null) {
                if (this._a) {
                    this._isValid = !compareArrays(this._a, (this._isUTC ? moment.utc(this._a) : moment(this._a)).toArray());
                } else {
                    this._isValid = !isNaN(this._d.getTime());
                }
            }
            return !!this._isValid;
        },

        utc : function () {
            this._isUTC = true;
            return this;
        },

        local : function () {
            this._isUTC = false;
            return this;
        },

        format : function (inputString) {
            var output = formatMoment(this, inputString || moment.defaultFormat);
            return this.lang().postformat(output);
        },

        add : function (input, val) {
            var dur;
            // switch args to support add('s', 1) and add(1, 's')
            if (typeof input === 'string') {
                dur = moment.duration(+val, input);
            } else {
                dur = moment.duration(input, val);
            }
            addOrSubtractDurationFromMoment(this, dur, 1);
            return this;
        },

        subtract : function (input, val) {
            var dur;
            // switch args to support subtract('s', 1) and subtract(1, 's')
            if (typeof input === 'string') {
                dur = moment.duration(+val, input);
            } else {
                dur = moment.duration(input, val);
            }
            addOrSubtractDurationFromMoment(this, dur, -1);
            return this;
        },

        diff : function (input, units, asFloat) {
            var that = this._isUTC ? moment(input).utc() : moment(input).local(),
                zoneDiff = (this.zone() - that.zone()) * 6e4,
                diff, output;

            if (units) {
                // standardize on singular form
                units = units.replace(/s$/, '');
            }

            if (units === 'year' || units === 'month') {
                diff = (this.daysInMonth() + that.daysInMonth()) * 432e5; // 24 * 60 * 60 * 1000 / 2
                output = ((this.year() - that.year()) * 12) + (this.month() - that.month());
                output += ((this - moment(this).startOf('month')) - (that - moment(that).startOf('month'))) / diff;
                if (units === 'year') {
                    output = output / 12;
                }
            } else {
                diff = (this - that) - zoneDiff;
                output = units === 'second' ? diff / 1e3 : // 1000
                    units === 'minute' ? diff / 6e4 : // 1000 * 60
                    units === 'hour' ? diff / 36e5 : // 1000 * 60 * 60
                    units === 'day' ? diff / 864e5 : // 1000 * 60 * 60 * 24
                    units === 'week' ? diff / 6048e5 : // 1000 * 60 * 60 * 24 * 7
                    diff;
            }
            return asFloat ? output : absRound(output);
        },

        from : function (time, withoutSuffix) {
            return moment.duration(this.diff(time)).lang(this.lang()._abbr).humanize(!withoutSuffix);
        },

        fromNow : function (withoutSuffix) {
            return this.from(moment(), withoutSuffix);
        },

        calendar : function () {
            var diff = this.diff(moment().startOf('day'), 'days', true),
                format = diff < -6 ? 'sameElse' :
                diff < -1 ? 'lastWeek' :
                diff < 0 ? 'lastDay' :
                diff < 1 ? 'sameDay' :
                diff < 2 ? 'nextDay' :
                diff < 7 ? 'nextWeek' : 'sameElse';
            return this.format(this.lang().calendar(format, this));
        },

        isLeapYear : function () {
            var year = this.year();
            return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
        },

        isDST : function () {
            return (this.zone() < moment([this.year()]).zone() ||
                this.zone() < moment([this.year(), 5]).zone());
        },

        day : function (input) {
            var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
            return input == null ? day :
                this.add({ d : input - day });
        },

        startOf: function (units) {
            units = units.replace(/s$/, '');
            // the following switch intentionally omits break keywords
            // to utilize falling through the cases.
            switch (units) {
            case 'year':
                this.month(0);
                /* falls through */
            case 'month':
                this.date(1);
                /* falls through */
            case 'week':
            case 'day':
                this.hours(0);
                /* falls through */
            case 'hour':
                this.minutes(0);
                /* falls through */
            case 'minute':
                this.seconds(0);
                /* falls through */
            case 'second':
                this.milliseconds(0);
                /* falls through */
            }

            // weeks are a special case
            if (units === 'week') {
                this.day(0);
            }

            return this;
        },

        endOf: function (units) {
            return this.startOf(units).add(units.replace(/s?$/, 's'), 1).subtract('ms', 1);
        },

        isAfter: function (input, units) {
            units = typeof units !== 'undefined' ? units : 'millisecond';
            return +this.clone().startOf(units) > +moment(input).startOf(units);
        },

        isBefore: function (input, units) {
            units = typeof units !== 'undefined' ? units : 'millisecond';
            return +this.clone().startOf(units) < +moment(input).startOf(units);
        },

        isSame: function (input, units) {
            units = typeof units !== 'undefined' ? units : 'millisecond';
            return +this.clone().startOf(units) === +moment(input).startOf(units);
        },

        zone : function () {
            return this._isUTC ? 0 : this._d.getTimezoneOffset();
        },

        daysInMonth : function () {
            return moment.utc([this.year(), this.month() + 1, 0]).date();
        },

        dayOfYear : function (input) {
            var dayOfYear = round((moment(this).startOf('day') - moment(this).startOf('year')) / 864e5) + 1;
            return input == null ? dayOfYear : this.add("d", (input - dayOfYear));
        },

        isoWeek : function (input) {
            var week = weekOfYear(this, 1, 4);
            return input == null ? week : this.add("d", (input - week) * 7);
        },

        week : function (input) {
            var week = this.lang().week(this);
            return input == null ? week : this.add("d", (input - week) * 7);
        },

        // If passed a language key, it will set the language for this
        // instance.  Otherwise, it will return the language configuration
        // variables for this instance.
        lang : function (key) {
            if (key === undefined) {
                return this._lang;
            } else {
                this._lang = getLangDefinition(key);
                return this;
            }
        }
    };

    // helper for adding shortcuts
    function makeGetterAndSetter(name, key) {
        moment.fn[name] = moment.fn[name + 's'] = function (input) {
            var utc = this._isUTC ? 'UTC' : '';
            if (input != null) {
                this._d['set' + utc + key](input);
                return this;
            } else {
                return this._d['get' + utc + key]();
            }
        };
    }

    // loop through and add shortcuts (Month, Date, Hours, Minutes, Seconds, Milliseconds)
    for (i = 0; i < proxyGettersAndSetters.length; i ++) {
        makeGetterAndSetter(proxyGettersAndSetters[i].toLowerCase().replace(/s$/, ''), proxyGettersAndSetters[i]);
    }

    // add shortcut for year (uses different syntax than the getter/setter 'year' == 'FullYear')
    makeGetterAndSetter('year', 'FullYear');

    // add plural methods
    moment.fn.days = moment.fn.day;
    moment.fn.weeks = moment.fn.week;
    moment.fn.isoWeeks = moment.fn.isoWeek;

    /************************************
        Duration Prototype
    ************************************/


    moment.duration.fn = Duration.prototype = {
        weeks : function () {
            return absRound(this.days() / 7);
        },

        valueOf : function () {
            return this._milliseconds +
              this._days * 864e5 +
              this._months * 2592e6;
        },

        humanize : function (withSuffix) {
            var difference = +this,
                output = relativeTime(difference, !withSuffix, this.lang());

            if (withSuffix) {
                output = this.lang().pastFuture(difference, output);
            }

            return this.lang().postformat(output);
        },

        lang : moment.fn.lang
    };

    function makeDurationGetter(name) {
        moment.duration.fn[name] = function () {
            return this._data[name];
        };
    }

    function makeDurationAsGetter(name, factor) {
        moment.duration.fn['as' + name] = function () {
            return +this / factor;
        };
    }

    for (i in unitMillisecondFactors) {
        if (unitMillisecondFactors.hasOwnProperty(i)) {
            makeDurationAsGetter(i, unitMillisecondFactors[i]);
            makeDurationGetter(i.toLowerCase());
        }
    }

    makeDurationAsGetter('Weeks', 6048e5);


    /************************************
        Default Lang
    ************************************/


    // Set default language, other languages will inherit from English.
    moment.lang('en', {
        ordinal : function (number) {
            var b = number % 10,
                output = (~~ (number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });


    /************************************
        Exposing Moment
    ************************************/


    // CommonJS module is defined
    if (hasModule) {
        module.exports = moment;
    }
    /*global ender:false */
    if (typeof ender === 'undefined') {
        // here, `this` means `window` in the browser, or `global` on the server
        // add `moment` as a global object via a string identifier,
        // for Closure Compiler "advanced" mode
        this['moment'] = moment;
    }
    /*global define:false */
    if (typeof define === "function" && define.amd) {
        define("moment", [], function () {
            return moment;
        });
    }
}).call(this);

});
require.register("component-indexof/index.js", function(exports, require, module){
module.exports = function(arr, obj){
  if (arr.indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
});
require.register("component-classes/index.js", function(exports, require, module){
/**
 * Module dependencies.
 */

var index = require('indexof');

/**
 * Whitespace regexp.
 */

var re = /\s+/;

/**
 * toString reference.
 */

var toString = Object.prototype.toString;

/**
 * Wrap `el` in a `ClassList`.
 *
 * @param {Element} el
 * @return {ClassList}
 * @api public
 */

module.exports = function(el){
  return new ClassList(el);
};

/**
 * Initialize a new ClassList for `el`.
 *
 * @param {Element} el
 * @api private
 */

function ClassList(el) {
  if (!el) throw new Error('A DOM element reference is required');
  this.el = el;
  this.list = el.classList;
}

/**
 * Add class `name` if not already present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.add = function(name){
  // classList
  if (this.list) {
    this.list.add(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (!~i) arr.push(name);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove class `name` when present, or
 * pass a regular expression to remove
 * any which match.
 *
 * @param {String|RegExp} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.remove = function(name){
  if ('[object RegExp]' == toString.call(name)) {
    return this.removeMatching(name);
  }

  // classList
  if (this.list) {
    this.list.remove(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (~i) arr.splice(i, 1);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove all classes matching `re`.
 *
 * @param {RegExp} re
 * @return {ClassList}
 * @api private
 */

ClassList.prototype.removeMatching = function(re){
  var arr = this.array();
  for (var i = 0; i < arr.length; i++) {
    if (re.test(arr[i])) {
      this.remove(arr[i]);
    }
  }
  return this;
};

/**
 * Toggle class `name`.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.toggle = function(name){
  // classList
  if (this.list) {
    this.list.toggle(name);
    return this;
  }

  // fallback
  if (this.has(name)) {
    this.remove(name);
  } else {
    this.add(name);
  }
  return this;
};

/**
 * Return an array of classes.
 *
 * @return {Array}
 * @api public
 */

ClassList.prototype.array = function(){
  var str = this.el.className.replace(/^\s+|\s+$/g, '');
  var arr = str.split(re);
  if ('' === arr[0]) arr.shift();
  return arr;
};

/**
 * Check if class `name` is present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.has =
ClassList.prototype.contains = function(name){
  return this.list
    ? this.list.contains(name)
    : !! ~index(this.array(), name);
};

});
require.register("component-domify/index.js", function(exports, require, module){

/**
 * Expose `parse`.
 */

module.exports = parse;

/**
 * Wrap map from jquery.
 */

var map = {
  option: [1, '<select multiple="multiple">', '</select>'],
  optgroup: [1, '<select multiple="multiple">', '</select>'],
  legend: [1, '<fieldset>', '</fieldset>'],
  thead: [1, '<table>', '</table>'],
  tbody: [1, '<table>', '</table>'],
  tfoot: [1, '<table>', '</table>'],
  colgroup: [1, '<table>', '</table>'],
  caption: [1, '<table>', '</table>'],
  tr: [2, '<table><tbody>', '</tbody></table>'],
  td: [3, '<table><tbody><tr>', '</tr></tbody></table>'],
  th: [3, '<table><tbody><tr>', '</tr></tbody></table>'],
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
  _default: [0, '', '']
};

/**
 * Parse `html` and return the children.
 *
 * @param {String} html
 * @return {Array}
 * @api private
 */

function parse(html) {
  if ('string' != typeof html) throw new TypeError('String expected');

  html = html.replace(/^\s+|\s+$/g, ''); // Remove leading/trailing whitespace

  // tag name
  var m = /<([\w:]+)/.exec(html);
  if (!m) return document.createTextNode(html);
  var tag = m[1];

  // body support
  if (tag == 'body') {
    var el = document.createElement('html');
    el.innerHTML = html;
    return el.removeChild(el.lastChild);
  }

  // wrap map
  var wrap = map[tag] || map._default;
  var depth = wrap[0];
  var prefix = wrap[1];
  var suffix = wrap[2];
  var el = document.createElement('div');
  el.innerHTML = prefix + html + suffix;
  while (depth--) el = el.lastChild;

  // Note: when moving children, don't rely on el.children
  // being 'live' to support Polymer's broken behaviour.
  // See: https://github.com/component/domify/pull/23
  if (1 == el.children.length) {
    return el.removeChild(el.children[0]);
  }

  var fragment = document.createDocumentFragment();
  while (el.children.length) {
    fragment.appendChild(el.removeChild(el.children[0]));
  }

  return fragment;
}

});
require.register("component-emitter/index.js", function(exports, require, module){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

});
require.register("component-event/index.js", function(exports, require, module){
var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',
    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',
    prefix = bind !== 'addEventListener' ? 'on' : '';

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, type, fn, capture){
  el[bind](prefix + type, fn, capture || false);

  return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  el[unbind](prefix + type, fn, capture || false);

  return fn;
};
});
require.register("ianstormtaylor-redraw/index.js", function(exports, require, module){

/**
 * Expose `redraw`.
 */

module.exports = redraw;


/**
 * Force a redraw on an `el`.
 *
 * @param {Element} el
 */

function redraw (el) {
  el.offsetHeight;
}
});
require.register("jkroso-classes/index.js", function(exports, require, module){

module.exports = document.createElement('div').classList
  ? require('./modern')
  : require('./fallback')
});
require.register("jkroso-classes/fallback.js", function(exports, require, module){

var index = require('indexof')

exports.add = function(name, el){
	var arr = exports.array(el)
	if (index(arr, name) < 0) {
		arr.push(name)
		el.className = arr.join(' ')
	}
}

exports.remove = function(name, el){
	if (name instanceof RegExp) {
		return exports.removeMatching(name, el)
	}
	var arr = exports.array(el)
	var i = index(arr, name)
	if (i >= 0) {
		arr.splice(i, 1)
		el.className = arr.join(' ')
	}
}

exports.removeMatching = function(re, el){
	var arr = exports.array(el)
	for (var i = 0; i < arr.length;) {
		if (re.test(arr[i])) arr.splice(i, 1)
		else i++
	}
	el.className = arr.join(' ')
}

exports.toggle = function(name, el){
	if (exports.has(name, el)) {
		exports.remove(name, el)
	} else {
		exports.add(name, el)
	}
}

exports.array = function(el){
	return el.className.match(/([^\s]+)/g) || []
}

exports.has =
exports.contains = function(name, el){
	return index(exports.array(el), name) >= 0
}
});
require.register("jkroso-classes/modern.js", function(exports, require, module){

/**
 * Add class `name` if not already present.
 *
 * @param {String} name
 * @param {Element} el
 * @api public
 */

exports.add = function(name, el){
	el.classList.add(name)
}

/**
 * Remove `name` if present
 *
 * @param {String|RegExp} name
 * @param {Element} el
 * @api public
 */

exports.remove = function(name, el){
	if (name instanceof RegExp) {
		return exports.removeMatching(name, el)
	}
	el.classList.remove(name)
}

/**
 * Remove all classes matching `re`.
 *
 * @param {RegExp} re
 * @param {Element} el
 * @api public
 */

exports.removeMatching = function(re, el){
	var arr = exports.array(el)
	for (var i = 0; i < arr.length; i++) {
		if (re.test(arr[i])) el.classList.remove(arr[i])
	}
}

/**
 * Toggle class `name`.
 *
 * @param {String} name
 * @param {Element} el
 * @api public
 */

exports.toggle = function(name, el){
	el.classList.toggle(name)
}

/**
 * Return an array of classes.
 *
 * @param {Element} el
 * @return {Array}
 * @api public
 */

exports.array = function(el){
	return el.className.match(/([^\s]+)/g) || []
}

/**
 * Check if class `name` is present.
 *
 * @param {String} name
 * @param {Element} el
 * @api public
 */

exports.has =
exports.contains = function(name, el){
	return el.classList.contains(name)
}
});
require.register("ianstormtaylor-classes/index.js", function(exports, require, module){

var classes = require('classes');


/**
 * Expose `mixin`.
 */

module.exports = exports = mixin;


/**
 * Mixin the classes methods.
 *
 * @param {Object} object
 * @return {Object}
 */

function mixin (obj) {
  for (var method in exports) obj[method] = exports[method];
  return obj;
}


/**
 * Add a class.
 *
 * @param {String} name
 * @return {Object}
 */

exports.addClass = function (name) {
  classes.add(name, this.el);
  return this;
};


/**
 * Remove a class.
 *
 * @param {String} name
 * @return {Object}
 */

exports.removeClass = function (name) {
  classes.remove(name, this.el);
  return this;
};


/**
 * Has a class?
 *
 * @param {String} name
 * @return {Boolean}
 */

exports.hasClass = function (name) {
  return classes.has(name, this.el);
};


/**
 * Toggle a class.
 *
 * @param {String} name
 * @return {Object}
 */

exports.toggleClass = function (name) {
  classes.toggle(name, this.el);
  return this;
};

});
require.register("component-bind/index.js", function(exports, require, module){
/**
 * Slice reference.
 */

var slice = [].slice;

/**
 * Bind `obj` to `fn`.
 *
 * @param {Object} obj
 * @param {Function|String} fn or string
 * @return {Function}
 * @api public
 */

module.exports = function(obj, fn){
  if ('string' == typeof fn) fn = obj[fn];
  if ('function' != typeof fn) throw new Error('bind() requires a function');
  var args = slice.call(arguments, 2);
  return function(){
    return fn.apply(obj, args.concat(slice.call(arguments)));
  }
};

});
require.register("component-type/index.js", function(exports, require, module){

/**
 * toString ref.
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Function]': return 'function';
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
    case '[object String]': return 'string';
  }

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val && val.nodeType === 1) return 'element';
  if (val === Object(val)) return 'object';

  return typeof val;
};

});
require.register("segmentio-bind-all/index.js", function(exports, require, module){

try {
  var bind = require('bind');
  var type = require('type');
} catch (e) {
  var bind = require('bind-component');
  var type = require('type-component');
}

module.exports = function (obj) {
  for (var key in obj) {
    var val = obj[key];
    if (type(val) === 'function') obj[key] = bind(obj, obj[key]);
  }
  return obj;
};
});
require.register("segmentio-on-escape/index.js", function(exports, require, module){

var bind = require('event').bind
  , indexOf = require('indexof');


/**
 * Expose `onEscape`.
 */

module.exports = exports = onEscape;


/**
 * Handlers.
 */

var fns = [];


/**
 * Escape binder.
 *
 * @param {Function} fn
 */

function onEscape (fn) {
  fns.push(fn);
}


/**
 * Bind a handler, for symmetry.
 */

exports.bind = onEscape;


/**
 * Unbind a handler.
 *
 * @param {Function} fn
 */

exports.unbind = function (fn) {
  var index = indexOf(fns, fn);
  if (index !== -1) fns.splice(index, 1);
};


/**
 * Bind to `document` once.
 */

bind(document, 'keydown', function (e) {
  if (27 !== e.keyCode) return;
  for (var i = 0, fn; fn = fns[i]; i++) fn(e);
});
});
require.register("segmentio-overlay/lib/index.js", function(exports, require, module){

var after = require('after-transition').once
  , bindAll = require('bind-all')
  , Classes = require('classes')
  , domify = require('domify')
  , Emitter = require('emitter')
  , escape = require('on-escape')
  , event = require('event')
  , redraw = require('redraw')
  , template = require('./index.html');


/**
 * Expose `Overlay`.
 */

module.exports = Overlay;


/**
 * Initialize a new `Overlay`.
 *
 * @param {Element} target (optional)
 */

function Overlay (target) {
  if (!(this instanceof Overlay)) return new Overlay(target);
  bindAll(this);
  this.el = domify(template);
  if (!target) {
    target = document.body;
    this.addClass('fixed');
  }
  target.appendChild(this.el);
  redraw(this.el); // to force an initial show to take
}


/**
 * Mixin emitter.
 */

Emitter(Overlay.prototype);


/**
 * Mixin classes.
 */

Classes(Overlay.prototype);


/**
 * Show the overlay.
 *
 * @param {Function} callback
 * @return {Overlay}
 */

Overlay.prototype.show = function (callback) {
  var visible = ! this.hasClass('hidden');
  var showing = this.hasClass('showing');

  if('function' === typeof callback) {
    visible && !showing ? callback() : this.once('show', callback);
  }

  if (visible || showing) return this;
  this.addClass('showing');
  this.emit('showing');

  var self = this;
  after(this.el, function () {
    self.removeClass('showing');
    self.emit('show');
  });

  this.removeClass('hidden');
  return this;
};


/**
 * Hide the overlay.
 *
 * @param {Function} callback
 * @return {Overlay}
 */

Overlay.prototype.hide = function (callback) {
  var hidden = this.hasClass('hidden');
  var hiding = this.hasClass('hiding');

  if ('function' === typeof callback) {
    hidden && !hiding ? callback() : this.once('hide', callback);
  }

  if (hidden || hiding) return this;
  this.addClass('hiding');
  this.emit('hiding');

  var self = this;
  after(this.el, function () {
    self.removeClass('hiding');
    self.emit('hide');
  });

  this.addClass('hidden');
  return this;
};


/**
 * Remove the overlay from the DOM, hiding it first if it isn't hidden.
 *
 * @param {Function} callback
 * @return {Overlay}
 */

Overlay.prototype.remove = function (callback) {
  var removed = ! this.el.parentNode;
  var removing = this.hasClass('removing');

  if ('function' === typeof callback) {
    removed && !removing ? callback() : this.once('remove', callback);
  }

  if (removed || removing) return this;
  this.addClass('removing');
  this.emit('removing');

  var self = this;
  var el = this.el;
  this.hide(function () {
    el.parentNode.removeChild(el);
    self.removeClass('removing');
    self.emit('remove');
  });

  return this;
};


/**
 * Bind to closeable events.
 *
 * @return {Overlay}
 * @api private
 */

Overlay.prototype.bind = function () {
  event.bind(this.el, 'click', this.hide);
  escape.bind(this.hide);
  return this;
};


/**
 * Unbind from closeable events.
 *
 * @return {Overlay}
 * @api private
 */

Overlay.prototype.unbind = function () {
  event.unbind(this.el, 'click', this.hide);
  escape.unbind(this.hide);
  return this;
};


/**
 * Make the overlay closeable.
 *
 * @return {Overlay}
 */

Overlay.prototype.closeable =
Overlay.prototype.closable = function () {
  this.addClass('closeable').addClass('closable');
  this.on('show', this.bind);
  this.on('hide', this.unbind);
  return this;
};


/**
 * Make the overlay temporary, so that it will be removed when hidden.
 *
 * @return {Overlay}
 */

Overlay.prototype.temporary = function () {
  this.addClass('temporary');
  this.on('hide', this.remove);
  return this;
};


/**
 * Attach or invoke callbacks for an
 */
});
require.register("yields-has-transitions/index.js", function(exports, require, module){
/**
 * Check if `el` or browser supports transitions.
 *
 * @param {Element} el
 * @return {Boolean}
 * @api public
 */

exports = module.exports = function(el){
  switch (arguments.length) {
    case 0: return bool;
    case 1: return bool
      ? transitions(el)
      : bool;
  }
};

/**
 * Check if the given `el` has transitions.
 *
 * @param {Element} el
 * @return {Boolean}
 * @api private
 */

function transitions(el, styl){
  if (el.transition) return true;
  styl = window.getComputedStyle(el);
  return !! parseFloat(styl.transitionDuration, 10);
}

/**
 * Style.
 */

var styl = document.body.style;

/**
 * Export support.
 */

var bool = 'transition' in styl
  || 'webkitTransition' in styl
  || 'MozTransition' in styl
  || 'msTransition' in styl;

});
require.register("ecarter-css-emitter/index.js", function(exports, require, module){
/**
 * Module Dependencies
 */

var events = require('event');

// CSS events

var watch = [
  'transitionend'
, 'webkitTransitionEnd'
, 'oTransitionEnd'
, 'MSTransitionEnd'
, 'animationend'
, 'webkitAnimationEnd'
, 'oAnimationEnd'
, 'MSAnimationEnd'
];

/**
 * Expose `CSSnext`
 */

module.exports = CssEmitter;

/**
 * Initialize a new `CssEmitter`
 *
 */

function CssEmitter(element){
  if (!(this instanceof CssEmitter)) return new CssEmitter(element);
  this.el = element;
}

/**
 * Bind CSS events.
 *
 * @api public
 */

CssEmitter.prototype.bind = function(fn){
  for (var i=0; i < watch.length; i++) {
    events.bind(this.el, watch[i], fn);
  }
};

/**
 * Unbind CSS events
 * 
 * @api public
 */

CssEmitter.prototype.unbind = function(fn){
  for (var i=0; i < watch.length; i++) {
    events.unbind(this.el, watch[i], fn);
  }
};



});
require.register("component-once/index.js", function(exports, require, module){

/**
 * Identifier.
 */

var n = 0;

/**
 * Global.
 */

var global = (function(){ return this })();

/**
 * Make `fn` callable only once.
 *
 * @param {Function} fn
 * @return {Function}
 * @api public
 */

module.exports = function(fn) {
  var id = n++;
  var called;

  function once(){
    // no receiver
    if (this == global) {
      if (called) return;
      called = true;
      return fn.apply(this, arguments);
    }

    // receiver
    var key = '__called_' + id + '__';
    if (this[key]) return;
    this[key] = true;
    return fn.apply(this, arguments);
  }

  return once;
};

});
require.register("yields-after-transition/index.js", function(exports, require, module){

/**
 * dependencies
 */

var has = require('has-transitions')
  , emitter = require('css-emitter')
  , once = require('once');

/**
 * Transition support.
 */

var supported = has();

/**
 * Export `after`
 */

module.exports = after;

/**
 * Invoke the given `fn` after transitions
 *
 * It will be invoked only if the browser
 * supports transitions __and__
 * the element has transitions
 * set in `.style` or css.
 *
 * @param {Element} el
 * @param {Function} fn
 * @return {Function} fn
 * @api public
 */

function after(el, fn){
  if (!supported || !has(el)) return fn();
  emitter(el).bind(fn);
  return fn;
};

/**
 * Same as `after()` only the function is invoked once.
 *
 * @param {Element} el
 * @param {Function} fn
 * @return {Function}
 * @api public
 */

after.once = function(el, fn){
  var callback = once(fn);
  after(el, fn = function(){
    emitter(el).unbind(fn);
    callback();
  });
};

});
require.register("segmentio-modal/lib/index.js", function(exports, require, module){

var after = require('after-transition').once
  , bind = require('event').bind
  , classes = require('classes')
  , domify = require('domify')
  , Emitter = require('emitter')
  , overlay = require('overlay')
  , redraw = require('redraw')
  , template = require('./index.html');


/**
 * Expose `Modal`.
 */

module.exports = Modal;


/**
 * Initialize a new `Modal`.
 *
 * @param {Element} el
 */

function Modal (el) {
  if (!(this instanceof Modal)) return new Modal(el);
  this.view = el;
  this.overlay = overlay().addClass('modal-overlay');
  this.wrapper = domify(template);
  this.modal = this.wrapper.querySelector('div');
  this.close = this.wrapper.querySelector('a');
  this.modal.appendChild(this.view);
  this.bind();
  document.body.appendChild(this.wrapper);
  redraw(this.wrapper); // to force an initial show to take
}


/**
 * Mixin emitter.
 */

Emitter(Modal.prototype);


/**
 * Bind to DOM events.
 *
 * @api private
 */

Modal.prototype.bind = function () {
  var hide = this.hide.bind(this);
  this.overlay.on('hiding', hide);
  bind(this.close, 'click', hide);
};


/**
 * Show the modal.
 *
 * @param {Function} callback
 * @return {Modal}
 */

Modal.prototype.show = function (callback) {
  var self = this;
  this.overlay.show(function () {
    self.emit('show');
    if ('function' === typeof callback) callback();
  });
  this.removeClass('hidden', true);
  return this;
};


/**
 * Hide the modal.
 *
 * @param {Function} callback
 * @return {Modal}
 */

Modal.prototype.hide = function (callback) {
  var self = this;
  this.overlay.hide(function () {
    self.emit('hide');
    if ('function' === typeof callback) callback();
  });
  this.addClass('hidden', true);
  return this;
};


/**
 * Remove the modal from the DOM.
 *
 * @param {Function} callback
 * @return {Modal}
 */

Modal.prototype.remove = function (callback) {
  var self = this;
  var wrapper = this.wrapper;
  this.overlay.remove(function () {
    if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
    self.emit('remove');
    if ('function' === typeof callback) callback();
  });
  return this;
};


/**
 * Make the modal closeable.
 *
 * @return {Modal}
 */

Modal.prototype.closeable =
Modal.prototype.closable = function () {
  this.overlay.closeable();
  return this;
};


/**
 * Make the modal temporary.
 *
 * @return {Modal}
 */

Modal.prototype.temporary = function () {
  this.overlay.temporary();
  var self = this;
  this.overlay.on('remove', function () {
    self.remove();
  });
  return this;
};


/**
 * Add a class to the modal. If the `all` flag is set, then it will add the
 * class to the overlay and wrapper too, for styling purposes.
 *
 * @param {String} name
 * @param {Boolean} all
 * @return {Modal}
 */

Modal.prototype.addClass = function (name, all) {
  classes(this.modal).add(name);
  if (all) {
    classes(this.wrapper).add(name);
    this.overlay.addClass(name);
  }
  return this;
};


/**
 * Remove a class from the modal. If the `all` flag is set, then it will remove
 * the class from the overlay and wrapper too, for styling purposes.
 *
 * @param {String} name
 * @param {Boolean} all
 * @return {Modal}
 */

Modal.prototype.removeClass = function (name, all) {
  classes(this.modal).remove(name);
  if (all) {
    classes(this.wrapper).remove(name);
    this.overlay.removeClass(name);
  }
  return this;
};

});
require.register("stagas-mod-player/index.js", function(exports, require, module){
/*
  Useful docs
    Explains effect calculations: http://www.mediatel.lu/workshop/audio/fileformat/h_mod.html

*/

/*
ModPeriodTable[ft][n] = the period to use for note number n at finetune value ft.
Finetune values are in twos-complement, i.e. [0,1,2,3,4,5,6,7,-8,-7,-6,-5,-4,-3,-2,-1]
The first table is used to generate a reverse lookup table, to find out the note number
for a period given in the MOD file.
*/
var ModPeriodTable = [
  [1712, 1616, 1524, 1440, 1356, 1280, 1208, 1140, 1076, 1016, 960 , 906,
   856 , 808 , 762 , 720 , 678 , 640 , 604 , 570 , 538 , 508 , 480 , 453,
   428 , 404 , 381 , 360 , 339 , 320 , 302 , 285 , 269 , 254 , 240 , 226,
   214 , 202 , 190 , 180 , 170 , 160 , 151 , 143 , 135 , 127 , 120 , 113,
   107 , 101 , 95  , 90  , 85  , 80  , 75  , 71  , 67  , 63  , 60  , 56 ],
  [1700, 1604, 1514, 1430, 1348, 1274, 1202, 1134, 1070, 1010, 954 , 900,
   850 , 802 , 757 , 715 , 674 , 637 , 601 , 567 , 535 , 505 , 477 , 450,
   425 , 401 , 379 , 357 , 337 , 318 , 300 , 284 , 268 , 253 , 239 , 225,
   213 , 201 , 189 , 179 , 169 , 159 , 150 , 142 , 134 , 126 , 119 , 113,
   106 , 100 , 94  , 89  , 84  , 79  , 75  , 71  , 67  , 63  , 59  , 56 ],
  [1688, 1592, 1504, 1418, 1340, 1264, 1194, 1126, 1064, 1004, 948 , 894,
   844 , 796 , 752 , 709 , 670 , 632 , 597 , 563 , 532 , 502 , 474 , 447,
   422 , 398 , 376 , 355 , 335 , 316 , 298 , 282 , 266 , 251 , 237 , 224,
   211 , 199 , 188 , 177 , 167 , 158 , 149 , 141 , 133 , 125 , 118 , 112,
   105 , 99  , 94  , 88  , 83  , 79  , 74  , 70  , 66  , 62  , 59  , 56 ],
  [1676, 1582, 1492, 1408, 1330, 1256, 1184, 1118, 1056, 996 , 940 , 888,
   838 , 791 , 746 , 704 , 665 , 628 , 592 , 559 , 528 , 498 , 470 , 444,
   419 , 395 , 373 , 352 , 332 , 314 , 296 , 280 , 264 , 249 , 235 , 222,
   209 , 198 , 187 , 176 , 166 , 157 , 148 , 140 , 132 , 125 , 118 , 111,
   104 , 99  , 93  , 88  , 83  , 78  , 74  , 70  , 66  , 62  , 59  , 55 ],
  [1664, 1570, 1482, 1398, 1320, 1246, 1176, 1110, 1048, 990 , 934 , 882,
   832 , 785 , 741 , 699 , 660 , 623 , 588 , 555 , 524 , 495 , 467 , 441,
   416 , 392 , 370 , 350 , 330 , 312 , 294 , 278 , 262 , 247 , 233 , 220,
   208 , 196 , 185 , 175 , 165 , 156 , 147 , 139 , 131 , 124 , 117 , 110,
   104 , 98  , 92  , 87  , 82  , 78  , 73  , 69  , 65  , 62  , 58  , 55 ],
  [1652, 1558, 1472, 1388, 1310, 1238, 1168, 1102, 1040, 982 , 926 , 874,
   826 , 779 , 736 , 694 , 655 , 619 , 584 , 551 , 520 , 491 , 463 , 437,
   413 , 390 , 368 , 347 , 328 , 309 , 292 , 276 , 260 , 245 , 232 , 219,
   206 , 195 , 184 , 174 , 164 , 155 , 146 , 138 , 130 , 123 , 116 , 109,
   103 , 97  , 92  , 87  , 82  , 77  , 73  , 69  , 65  , 61  , 58  , 54 ],
  [1640, 1548, 1460, 1378, 1302, 1228, 1160, 1094, 1032, 974 , 920 , 868,
   820 , 774 , 730 , 689 , 651 , 614 , 580 , 547 , 516 , 487 , 460 , 434,
   410 , 387 , 365 , 345 , 325 , 307 , 290 , 274 , 258 , 244 , 230 , 217,
   205 , 193 , 183 , 172 , 163 , 154 , 145 , 137 , 129 , 122 , 115 , 109,
   102 , 96  , 91  , 86  , 81  , 77  , 72  , 68  , 64  , 61  , 57  , 54 ],
  [1628, 1536, 1450, 1368, 1292, 1220, 1150, 1086, 1026, 968 , 914 , 862,
   814 , 768 , 725 , 684 , 646 , 610 , 575 , 543 , 513 , 484 , 457 , 431,
   407 , 384 , 363 , 342 , 323 , 305 , 288 , 272 , 256 , 242 , 228 , 216,
   204 , 192 , 181 , 171 , 161 , 152 , 144 , 136 , 128 , 121 , 114 , 108,
   102 , 96  , 90  , 85  , 80  , 76  , 72  , 68  , 64  , 60  , 57  , 54 ],
  [1814, 1712, 1616, 1524, 1440, 1356, 1280, 1208, 1140, 1076, 1016, 960,
   907 , 856 , 808 , 762 , 720 , 678 , 640 , 604 , 570 , 538 , 508 , 480,
   453 , 428 , 404 , 381 , 360 , 339 , 320 , 302 , 285 , 269 , 254 , 240,
   226 , 214 , 202 , 190 , 180 , 170 , 160 , 151 , 143 , 135 , 127 , 120,
   113 , 107 , 101 , 95  , 90  , 85  , 80  , 75  , 71  , 67  , 63  , 60 ],
  [1800, 1700, 1604, 1514, 1430, 1350, 1272, 1202, 1134, 1070, 1010, 954,
   900 , 850 , 802 , 757 , 715 , 675 , 636 , 601 , 567 , 535 , 505 , 477,
   450 , 425 , 401 , 379 , 357 , 337 , 318 , 300 , 284 , 268 , 253 , 238,
   225 , 212 , 200 , 189 , 179 , 169 , 159 , 150 , 142 , 134 , 126 , 119,
   112 , 106 , 100 , 94  , 89  , 84  , 79  , 75  , 71  , 67  , 63  , 59 ],
  [1788, 1688, 1592, 1504, 1418, 1340, 1264, 1194, 1126, 1064, 1004, 948,
   894 , 844 , 796 , 752 , 709 , 670 , 632 , 597 , 563 , 532 , 502 , 474,
   447 , 422 , 398 , 376 , 355 , 335 , 316 , 298 , 282 , 266 , 251 , 237,
   223 , 211 , 199 , 188 , 177 , 167 , 158 , 149 , 141 , 133 , 125 , 118,
   111 , 105 , 99  , 94  , 88  , 83  , 79  , 74  , 70  , 66  , 62  , 59 ],
  [1774, 1676, 1582, 1492, 1408, 1330, 1256, 1184, 1118, 1056, 996 , 940,
   887 , 838 , 791 , 746 , 704 , 665 , 628 , 592 , 559 , 528 , 498 , 470,
   444 , 419 , 395 , 373 , 352 , 332 , 314 , 296 , 280 , 264 , 249 , 235,
   222 , 209 , 198 , 187 , 176 , 166 , 157 , 148 , 140 , 132 , 125 , 118,
   111 , 104 , 99  , 93  , 88  , 83  , 78  , 74  , 70  , 66  , 62  , 59 ],
  [1762, 1664, 1570, 1482, 1398, 1320, 1246, 1176, 1110, 1048, 988 , 934,
   881 , 832 , 785 , 741 , 699 , 660 , 623 , 588 , 555 , 524 , 494 , 467,
   441 , 416 , 392 , 370 , 350 , 330 , 312 , 294 , 278 , 262 , 247 , 233,
   220 , 208 , 196 , 185 , 175 , 165 , 156 , 147 , 139 , 131 , 123 , 117,
   110 , 104 , 98  , 92  , 87  , 82  , 78  , 73  , 69  , 65  , 61  , 58 ],
  [1750, 1652, 1558, 1472, 1388, 1310, 1238, 1168, 1102, 1040, 982 , 926,
   875 , 826 , 779 , 736 , 694 , 655 , 619 , 584 , 551 , 520 , 491 , 463,
   437 , 413 , 390 , 368 , 347 , 328 , 309 , 292 , 276 , 260 , 245 , 232,
   219 , 206 , 195 , 184 , 174 , 164 , 155 , 146 , 138 , 130 , 123 , 116,
   109 , 103 , 97  , 92  , 87  , 82  , 77  , 73  , 69  , 65  , 61  , 58 ],
  [1736, 1640, 1548, 1460, 1378, 1302, 1228, 1160, 1094, 1032, 974 , 920,
   868 , 820 , 774 , 730 , 689 , 651 , 614 , 580 , 547 , 516 , 487 , 460,
   434 , 410 , 387 , 365 , 345 , 325 , 307 , 290 , 274 , 258 , 244 , 230,
   217 , 205 , 193 , 183 , 172 , 163 , 154 , 145 , 137 , 129 , 122 , 115,
   108 , 102 , 96  , 91  , 86  , 81  , 77  , 72  , 68  , 64  , 61  , 57 ],
  [1724, 1628, 1536, 1450, 1368, 1292, 1220, 1150, 1086, 1026, 968 , 914,
   862 , 814 , 768 , 725 , 684 , 646 , 610 , 575 , 543 , 513 , 484 , 457,
   431 , 407 , 384 , 363 , 342 , 323 , 305 , 288 , 272 , 256 , 242 , 228,
   216 , 203 , 192 , 181 , 171 , 161 , 152 , 144 , 136 , 128 , 121 , 114,
   108 , 101 , 96  , 90  , 85  , 80  , 76  , 72  , 68  , 64  , 60  , 57 ]];
   
var SineTable = [
  0,24,49,74,97,120,141,161,180,197,212,224,235,244,250,253,
  255,253,250,244,235,224,212,197,180,161,141,120,97,74,49,
  24,0,-24,-49,-74,-97,-120,-141,-161,-180,-197,-212,-224,
  -235,-244,-250,-253,-255,-253,-250,-244,-235,-224,-212,-197,
  -180,-161,-141,-120,-97,-74,-49,-24
];

var ModPeriodToNoteNumber = {};
for (var i = 0; i < ModPeriodTable[0].length; i++) {
  ModPeriodToNoteNumber[ModPeriodTable[0][i]] = i;
}

module.exports = ModPlayer;

/**
 * Module Player class.
 *
 * @param {ModParser} mod 
 * @param {Number} rate 
 * @api public
 */

function ModPlayer(mod, rate) {
  /* timing calculations */
  var ticksPerSecond = 7093789.2; /* PAL frequency */
  var ticksPerFrame; /* calculated by setBpm */
  var ticksPerOutputSample = Math.round(ticksPerSecond / rate);
  var ticksSinceStartOfFrame = 0;
  
  function setBpm(bpm) {
    /* x beats per minute => x*4 rows per minute */
    ticksPerFrame = Math.round(ticksPerSecond * 2.5/bpm);
  }
  setBpm(125);
  
  /* initial player state */
  var framesPerRow = 6;
  var currentFrame = 0;
  var currentPattern;
  var currentPosition;
  var currentRow;
  var exLoop = false;   //whether E6x looping is currently set
  var exLoopStart = 0;  //loop point set up by E60
  var exLoopEnd = 0;    //end of loop (where we hit a E6x cmd) for accurate counting
  var exLoopCount = 0;  //loops remaining
  var doBreak = false;  //Bxx, Dxx - jump to order and pattern break
  var breakPos = 0;
  var breakRow = 0;
  var delayRows = false; //EEx pattern delay.
  
  var channels = [];
  for (var chan = 0; chan < mod.channelCount; chan++) {
    channels[chan] = {
      playing: false,
      sample: mod.samples[0],
      finetune: 0,
      volume: 0,
      pan: 0x7F,  //unimplemented
      volumeDelta: 0,
      periodDelta: 0,
      fineVolumeDelta: 0,
      finePeriodDelta: 0,
      tonePortaTarget: 0, //target for 3xx, 5xy as period value
      tonePortaDelta: 0,
      tonePortaVolStep: 0, //remember pitch slide step for when 5xx is used
      tonePortaActive: false,
      cut: false,     //tick to cut at, or false if no cut
      delay: false,   //tick to delay note until, or false if no delay
      arpeggioActive: false
    };
  }
  
  function loadRow(rowNumber) {
    currentRow = rowNumber;
    currentFrame = 0;
    doBreak = false;
    breakPos = 0;
    breakRow = 0;

    for (var chan = 0; chan < mod.channelCount; chan++) {
      var channel = channels[chan];
      var prevNote = channel.prevNote;
      var note = currentPattern[currentRow][chan];
      if (channel.sampleNum == undefined) {
          channel.sampleNum = 0;
      }
      if (note.period != 0 || note.sample != 0) {
        channel.playing = true;
        channel.samplePosition = 0;
        channel.ticksSinceStartOfSample = 0; /* that's 'sample' as in 'individual volume reading' */
        if (note.sample != 0) {
          channel.sample = mod.samples[note.sample - 1];
          channel.sampleNum = note.sample - 1;
          channel.volume = channel.sample.volume;
          channel.finetune = channel.sample.finetune;
        }
        if (note.period != 0) { // && note.effect != 0x03
          //the note specified in a tone porta command is not actually played
          if (note.effect != 0x03) {
            channel.noteNumber = ModPeriodToNoteNumber[note.period];
            channel.ticksPerSample = ModPeriodTable[channel.finetune][channel.noteNumber] * 2;
          } else {
            channel.noteNumber = ModPeriodToNoteNumber[prevNote.period]
            channel.ticksPerSample = ModPeriodTable[channel.finetune][channel.noteNumber] * 2;
          }
        }
      }
      channel.finePeriodDelta = 0;
      channel.fineVolumeDelta = 0;
      channel.cut = false;
      channel.delay = false;
      channel.retrigger = false;
      channel.tonePortaActive = false;
      if (note.effect != 0 || note.effectParameter != 0) {
        channel.volumeDelta = 0; /* new effects cancel volumeDelta */
        channel.periodDelta = 0; /* new effects cancel periodDelta */
        channel.arpeggioActive = false;
        switch (note.effect) {
          case 0x00: /* arpeggio: 0xy */
            channel.arpeggioActive = true;
            channel.arpeggioNotes = [
              channel.noteNumber,
              channel.noteNumber + (note.effectParameter >> 4),
              channel.noteNumber + (note.effectParameter & 0x0f)
            ]
            channel.arpeggioCounter = 0;
            break;
          case 0x01: /* pitch slide up - 1xx */
            channel.periodDelta = -note.effectParameter;
            break;
          case 0x02: /* pitch slide down - 2xx */
            channel.periodDelta = note.effectParameter;
            break;
          case 0x03: /* slide to note 3xy - */
            channel.tonePortaActive = true;
            channel.tonePortaTarget = (note.period != 0) ? note.period : channel.tonePortaTarget;
            var dir = (channel.tonePortaTarget < prevNote.period) ? -1 : 1;
            channel.tonePortaDelta = (note.effectParameter * dir);
            channel.tonePortaVolStep = (note.effectParameter * dir);
            channel.tonePortaDir = dir;
            break;
          case 0x05: /* portamento to note with volume slide 5xy */
            channel.tonePortaActive = true;
            if (note.effectParameter & 0xf0) {
              channel.volumeDelta = note.effectParameter >> 4;
            } else {
              channel.volumeDelta = -note.effectParameter;
            }
            channel.tonePortaDelta = channel.tonePortaVolStep;
            break;
          case 0x09: /* sample offset - 9xx */
            channel.samplePosition = 256 * note.effectParameter;
            break;
          case 0x0A: /* volume slide - Axy */
            if (note.effectParameter & 0xf0) {
              /* volume increase by x */
              channel.volumeDelta = note.effectParameter >> 4;
            } else {
              /* volume decrease by y */
              channel.volumeDelta = -note.effectParameter;
            }
            break;
          case 0x0B: /* jump to order */
            doBreak = true;
            breakPos = note.effectParameter;
            breakRow = 0;
            break;
          case 0x0C: /* volume */
            if (note.effectParameter > 64) {
              channel.volume = 64;
            } else {
              channel.volume = note.effectParameter;
            }
            break;
          case 0x0D: /* pattern break; jump to next pattern at specified row */
            doBreak = true;
            breakPos = currentPosition + 1;
            //Row is written as DECIMAL so grab the high part as a single digit and do some math
            breakRow = ((note.effectParameter & 0xF0) >> 4) * 10 + (note.effectParameter & 0x0F);
            break;
            
          case 0x0E:
            switch (note.extEffect) { //yes we're doing nested switch
              case 0x01: /* fine pitch slide up - E1x */
                channel.finePeriodDelta = -note.extEffectParameter;
                break;
              case 0x02: /* fine pitch slide down - E2x */
                channel.finePeriodDelta = note.extEffectParameter;
                break;
              case 0x05: /* set finetune - E5x */
                channel.finetune = note.extEffectParameter;
                break;
              case 0x09: /* retrigger sample - E9x */
                channel.retrigger = note.extEffectParameter;
                break;
              case 0x0A: /* fine volume slide up - EAx */
                channel.fineVolumeDelta = note.extEffectParameter;
                break;
              case 0x0B: /* fine volume slide down - EBx */
                channel.fineVolumeDelta = -note.extEffectParameter;
                break;
              case 0x0C: /* note cute - ECx */
                channel.cut = note.extEffectParameter;
                break;
              case 0x0D: /* note delay - EDx */
                channel.delay = note.extEffectParameter;
                break;
              case 0x0E: /* pattern delay EEx */
                delayRows = note.extEffectParameter;
                break;
              case 0x06:
                //set loop start with E60
                if (note.extEffectParameter == 0) {
                  exLoopStart = currentRow;
                } else {
                  //set loop end with E6x
                  exLoopEnd = currentRow;
                  //activate the loop only if it's new
                  if (!exLoop) {
                    exLoop = true;
                    exLoopCount = note.extEffectParameter;
                  }
                }
                break;
            }
            
            break;
            
          case 0x0F: /* tempo change. <=32 sets ticks/row, greater sets beats/min instead */
            var newSpeed = (note.effectParameter == 0) ? 1 : note.effectParameter; /* 0 is treated as 1 */
            if (newSpeed <= 32) { 
              framesPerRow = newSpeed;
            } else {
              setBpm(newSpeed);
            }
            break;
        }
      }
      
      //for figuring out tone portamento effect
      if (note.period != 0) { channel.prevNote = note; }
      
      if (channel.tonePortaActive == false) {
        channel.tonePortaDelta = 0;
        channel.tonePortaTarget = 0;
        channel.tonePortaVolStep = 0;
      }
    }
    
  }
  
  function loadPattern(patternNumber) {
    var row = doBreak ? breakRow : 0;
    currentPattern = mod.patterns[patternNumber];
    loadRow(row);
  }
  
  function loadPosition(positionNumber) {
    //Handle invalid position numbers that may be passed by invalid loop points
    positionNumber = (positionNumber > mod.positionCount - 1) ? 0 : positionNumber; 
    currentPosition = positionNumber;
    loadPattern(mod.positions[currentPosition]);
  }
  
  loadPosition(0);
  
  function getNextPosition() {
    if (currentPosition + 1 >= mod.positionCount) {
      loadPosition(mod.positionLoopPoint);
    } else {
      loadPosition(currentPosition + 1);
    }
  }
  
  function getNextRow() {
    /*
      Determine where we're gonna go based on active effect.
      Either:
        break (jump to new pattern),
        do extended loop,
        advance normally
    */
    if (doBreak) {
      //Dxx commands at the end of modules are fairly common for some reason
      //so make sure jumping past the end loops back to the start
      breakPos = (breakPos >= mod.positionCount) ? mod.positionLoopPoint : breakPos;
      loadPosition(breakPos);
    } else if (exLoop && currentRow == exLoopEnd && exLoopCount > 0) {
      //count down the loop and jump back
      loadRow(exLoopStart);
      exLoopCount--;
    } else {
      if (currentRow == 63) {
        getNextPosition();
      } else {
        loadRow(currentRow + 1);
      }
    }
    
    if (exLoopCount < 0) { exLoop = false; }
  }

  function doFrame() {
    /* apply volume/pitch slide before fetching row, because the first frame of a row does NOT
    have the slide applied */

    for (var chan = 0; chan < mod.channelCount; chan++) {
      var channel = channels[chan];
      var finetune = channel.finetune;
      if (currentFrame == 0) { /* apply fine slides only once */
        channel.ticksPerSample += channel.finePeriodDelta * 2;
        channel.volume += channel.fineVolumeDelta;
      }
      channel.volume += channel.volumeDelta;
      if (channel.volume > 64) {
        channel.volume = 64;
      } else if (channel.volume < 0) {
        channel.volume = 0;
      }
      if (channel.cut !== false && currentFrame >= channel.cut) {
        channel.volume = 0;
      }
      if (channel.delay !== false && currentFrame <= channel.delay) {
        channel.volume = 0;
      }
      if (channel.retrigger !== false) {
        //short-circuit prevents x mod 0
        if (channel.retrigger == 0 || currentFrame % channel.retrigger == 0) { 
          channel.samplePosition = 0;
        }
      }
      channel.ticksPerSample += channel.periodDelta * 2;
      if (channel.tonePortaActive) {
        channel.ticksPerSample += channel.tonePortaDelta * 2;
        //don't slide below or above allowed note, depending on slide direction
        if (channel.tonePortaDir == 1 && channel.ticksPerSample > channel.tonePortaTarget * 2) {
          channel.ticksPerSample = channel.tonePortaTarget * 2;
        } else if (channel.tonePortaDir == -1 && channel.ticksPerSample < channel.tonePortaTarget * 2)  {
          channel.ticksPerSample = channel.tonePortaTarget * 2;
        }
      }
      
      if (channel.ticksPerSample > 4096) {
        channel.ticksPerSample = 4096;
      } else if (channel.ticksPerSample < 96) { /* equivalent to period 48, a bit higher than the highest note */
        channel.ticksPerSample = 96;
      }
      if (channel.arpeggioActive) {
        channel.arpeggioCounter++;
        var noteNumber = channel.arpeggioNotes[channel.arpeggioCounter % 3];
        channel.ticksPerSample = ModPeriodTable[finetune][noteNumber] * 2;
      }
    }

    currentFrame++;
    if (currentFrame == framesPerRow) {
      currentFrame = 0;
      //Don't advance to reading more rows if pattern delay effect is active
      if (delayRows !== false) {
        delayRows--;
        if (delayRows < 0) { delayRows = false; }
      } else {
        getNextRow();
      }
    }
  }
  
  this.process = function(L, R, sampleLength) {
    for (var i=0; i<sampleLength; i++) {
      ticksSinceStartOfFrame += ticksPerOutputSample;
      while (ticksSinceStartOfFrame >= ticksPerFrame) {
        doFrame();
        ticksSinceStartOfFrame -= ticksPerFrame;
      }
      
      leftOutputLevel = 0;
      rightOutputLevel = 0;
      for (var chan = 0; chan < mod.channelCount; chan++) {
        var channel = channels[chan];
        if (channel.playing) {
          channel.ticksSinceStartOfSample += ticksPerOutputSample;
          while (channel.ticksSinceStartOfSample >= channel.ticksPerSample) {
            channel.samplePosition++;
            if (channel.sample.repeatLength > 2 && channel.samplePosition >= channel.sample.repeatOffset + channel.sample.repeatLength) {
              channel.samplePosition = channel.sample.repeatOffset;
            } else if (channel.samplePosition >= channel.sample.length) {
              channel.playing = false;
              break;
            } else 
            channel.ticksSinceStartOfSample -= channel.ticksPerSample;
          }
          if (channel.playing) {
            
            var rawVol = mod.sampleData[channel.sampleNum][channel.samplePosition];
            var vol = (((rawVol + 128) & 0xff) - 128) * channel.volume; /* range (-128*64)..(127*64) */
            if (chan & 3 == 0 || chan & 3 == 3) { /* hard panning(?): left, right, right, left */
              leftOutputLevel += (vol + channel.pan) * 3;
              rightOutputLevel += (vol + 0xFF - channel.pan);
            } else {
              leftOutputLevel += (vol + 0xFF - channel.pan)
              rightOutputLevel += (vol + channel.pan) * 3;
            }
            /* range of outputlevels is 128*64*2*channelCount */
            /* (well, it could be more for odd channel counts) */
          }
        }
      }
      
      L[i] = leftOutputLevel / (128 * 128 * mod.channelCount);
      R[i] = rightOutputLevel / (128 * 128 * mod.channelCount);
    }
  };
}

});

require.register("monstercat-jade-runtime/index.js", function(exports, require, module){
var exports = module.exports
/*!
 * Jade - runtime
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Lame Array.isArray() polyfill for now.
 */

if (!Array.isArray) {
  Array.isArray = function(arr){
    return '[object Array]' == Object.prototype.toString.call(arr);
  };
}

/**
 * Lame Object.keys() polyfill for now.
 */

if (!Object.keys) {
  Object.keys = function(obj){
    var arr = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        arr.push(key);
      }
    }
    return arr;
  }
}

/**
 * Merge two attribute objects giving precedence
 * to values in object `b`. Classes are special-cased
 * allowing for arrays and merging/joining appropriately
 * resulting in a string.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 * @api private
 */

exports.merge = function merge(a, b) {
  var ac = a['class'];
  var bc = b['class'];

  if (ac || bc) {
    ac = ac || [];
    bc = bc || [];
    if (!Array.isArray(ac)) ac = [ac];
    if (!Array.isArray(bc)) bc = [bc];
    ac = ac.filter(nulls);
    bc = bc.filter(nulls);
    a['class'] = ac.concat(bc).join(' ');
  }

  for (var key in b) {
    if (key != 'class') {
      a[key] = b[key];
    }
  }

  return a;
};

/**
 * Filter null `val`s.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function nulls(val) {
  return val != null;
}

/**
 * Render the given attributes object.
 *
 * @param {Object} obj
 * @param {Object} escaped
 * @return {String}
 * @api private
 */

exports.attrs = function attrs(obj, escaped){
  var buf = []
    , terse = obj.terse;

  delete obj.terse;
  var keys = Object.keys(obj)
    , len = keys.length;

  if (len) {
    buf.push('');
    for (var i = 0; i < len; ++i) {
      var key = keys[i]
        , val = obj[key];

      if ('boolean' == typeof val || null == val) {
        if (val) {
          terse
            ? buf.push(key)
            : buf.push(key + '="' + key + '"');
        }
      } else if (0 == key.indexOf('data') && 'string' != typeof val) {
        buf.push(key + "='" + JSON.stringify(val) + "'");
      } else if ('class' == key && Array.isArray(val)) {
        buf.push(key + '="' + exports.escape(val.join(' ')) + '"');
      } else if (escaped && escaped[key]) {
        buf.push(key + '="' + exports.escape(val) + '"');
      } else {
        buf.push(key + '="' + val + '"');
      }
    }
  }

  return buf.join(' ');
};

/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api private
 */

exports.escape = function escape(html){
  return String(html)
    .replace(/&(?!(\w+|\#\d+);)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

/**
 * Re-throw the given `err` in context to the
 * the jade in `filename` at the given `lineno`.
 *
 * @param {Error} err
 * @param {String} filename
 * @param {String} lineno
 * @api private
 */

exports.rethrow = function rethrow(err, filename, lineno){
  if (!filename) throw err;

  var context = 3
    , str = require('fs').readFileSync(filename, 'utf8')
    , lines = str.split('\n')
    , start = Math.max(lineno - context, 0)
    , end = Math.min(lines.length, lineno + context);

  // Error context
  var context = lines.slice(start, end).map(function(line, i){
    var curr = i + start + 1;
    return (curr == lineno ? '  > ' : '    ')
      + curr
      + '| '
      + line;
  }).join('\n');

  // Alter exception message
  err.path = filename;
  err.message = (filename || 'Jade') + ':' + lineno
    + '\n' + context + '\n\n' + err.message;
  throw err;
};

});
require.register("stagas-within/index.js", function(exports, require, module){

/**
 * within
 */

module.exports = within

/**
 * Check if an event came from inside of a given element
 *
 * @param object the event object
 * @param Element the element in question
 * @param string the fallback property if relatedTarget is not defined
 * @return boolean
 */

function within (evt, elem, fallback) {
  var targ = evt.relatedTarget, ret;
  if (targ == null) {
    targ = evt[fallback] || null;
  }
  try {
    while (targ && targ !== elem) {
      targ = targ.parentNode;
    }
    ret = (targ === elem);
  } catch(e) {
    ret = false;
  }
  return ret;
}

});
require.register("stagas-mouseenter/index.js", function(exports, require, module){

/**
 * mouseenter
 */

var within = require('within')
var events = require('event')

module.exports = mouseenter

var listeners = []
var fns = []

function mouseenter (el, fn) {
  function listener (ev) {
    var inside = within(ev, ev.target, 'fromElement')
    if (inside) return
    if (fn) fn.call(this, ev)
  }
  listeners.push(listener)
  fns.push(fn)
  events.bind(el, 'mouseover', listener)
}

mouseenter.bind = mouseenter

mouseenter.unbind = function (el, fn) {
  var idx = fns.indexOf(fn)
  if (!~idx) return
  fns.splice(idx, 1)
  events.unbind(el, 'mouseover', listeners.splice(idx, 1)[0])
}

});
require.register("stagas-mouseleave/index.js", function(exports, require, module){

/**
 * mouseleave
 */

var within = require('within')
var events = require('event')

module.exports = mouseleave

var listeners = []
var fns = []

function mouseleave (el, fn) {
  function listener (ev) {
    var inside = within(ev, ev.target, 'toElement')
    if (inside) return
    if (fn) fn.call(this, ev)
  }
  listeners.push(listener)
  fns.push(fn)
  events.bind(el, 'mouseout', listener)
}

mouseleave.bind = mouseleave

mouseleave.unbind = function (el, fn) {
  var idx = fns.indexOf(fn)
  if (!~idx) return
  fns.splice(idx, 1)
  events.unbind(el, 'mouseout', listeners.splice(idx, 1)[0])
}

});
require.register("stagas-hover/index.js", function(exports, require, module){

/**
 * 
 * hover
 * 
 */

/**
 * Module dependencies.
 */

var mouseenter = require('mouseenter')
var mouseleave = require('mouseleave')

/**
 * Export hover.
 */

module.exports = hover

/**
 * Binds `mouseenter` and `mouseleave` events
 * on an `el`.
 *
 * @param {element} el
 * @param {fn} onmouseenter
 * @param {fn} onmouseleave
 * @param {number} leavedelay
 *
 * @return {element} el
 */

function hover (el, onmouseenter, onmouseleave, leavedelay) {
  if (leavedelay) {
    var t
    mouseenter(el, function (ev) {
      clearTimeout(t)
      onmouseenter(ev)
    })
    mouseleave(el, function (ev) {
      clearTimeout(t)
      t = setTimeout(onmouseleave, leavedelay, ev)
    })
  }
  else {
    mouseenter(el, onmouseenter)
    mouseleave(el, onmouseleave)
  }
  return el
}

/**
 * Hovers only once.
 *
 * @param {element} el 
 * @param {fn} onmouseenter 
 * @param {fn} onmouseleave 
 *
 * @return {element} el
 */

hover.once = function (el, onmouseenter, onmouseleave) {
  mouseenter(el, onmouseenter)
  mouseleave(el, function wrapper (ev) {
    mouseenter.unbind(el, onmouseenter)
    mouseleave.unbind(el, wrapper)

    onmouseleave.apply(this, arguments)
  })
}

});
require.register("component-range/index.js", function(exports, require, module){

module.exports = function(from, to, inclusive){
  var ret = [];
  if (inclusive) to++;

  for (var n = from; n < to; ++n) {
    ret.push(n);
  }

  return ret;
}
});
require.register("component-to-function/index.js", function(exports, require, module){

/**
 * Expose `toFunction()`.
 */

module.exports = toFunction;

/**
 * Convert `obj` to a `Function`.
 *
 * @param {Mixed} obj
 * @return {Function}
 * @api private
 */

function toFunction(obj) {
  switch ({}.toString.call(obj)) {
    case '[object Object]':
      return objectToFunction(obj);
    case '[object Function]':
      return obj;
    case '[object String]':
      return stringToFunction(obj);
    case '[object RegExp]':
      return regexpToFunction(obj);
    default:
      return defaultToFunction(obj);
  }
}

/**
 * Default to strict equality.
 *
 * @param {Mixed} val
 * @return {Function}
 * @api private
 */

function defaultToFunction(val) {
  return function(obj){
    return val === obj;
  }
}

/**
 * Convert `re` to a function.
 *
 * @param {RegExp} re
 * @return {Function}
 * @api private
 */

function regexpToFunction(re) {
  return function(obj){
    return re.test(obj);
  }
}

/**
 * Convert property `str` to a function.
 *
 * @param {String} str
 * @return {Function}
 * @api private
 */

function stringToFunction(str) {
  // immediate such as "> 20"
  if (/^ *\W+/.test(str)) return new Function('_', 'return _ ' + str);

  // properties such as "name.first" or "age > 18"
  return new Function('_', 'return _.' + str);
}

/**
 * Convert `object` to a function.
 *
 * @param {Object} object
 * @return {Function}
 * @api private
 */

function objectToFunction(obj) {
  var match = {}
  for (var key in obj) {
    match[key] = typeof obj[key] === 'string'
      ? defaultToFunction(obj[key])
      : toFunction(obj[key])
  }
  return function(val){
    if (typeof val !== 'object') return false;
    for (var key in match) {
      if (!(key in val)) return false;
      if (!match[key](val[key])) return false;
    }
    return true;
  }
}

});
require.register("component-each/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var toFunction = require('to-function');
var type;

try {
  type = require('type-component');
} catch (e) {
  type = require('type');
}

/**
 * HOP reference.
 */

var has = Object.prototype.hasOwnProperty;

/**
 * Iterate the given `obj` and invoke `fn(val, i)`.
 *
 * @param {String|Array|Object} obj
 * @param {Function} fn
 * @api public
 */

module.exports = function(obj, fn){
  fn = toFunction(fn);
  switch (type(obj)) {
    case 'array':
      return array(obj, fn);
    case 'object':
      if ('number' == typeof obj.length) return array(obj, fn);
      return object(obj, fn);
    case 'string':
      return string(obj, fn);
  }
};

/**
 * Iterate string chars.
 *
 * @param {String} obj
 * @param {Function} fn
 * @api private
 */

function string(obj, fn) {
  for (var i = 0; i < obj.length; ++i) {
    fn(obj.charAt(i), i);
  }
}

/**
 * Iterate object keys.
 *
 * @param {Object} obj
 * @param {Function} fn
 * @api private
 */

function object(obj, fn) {
  for (var key in obj) {
    if (has.call(obj, key)) {
      fn(key, obj[key]);
    }
  }
}

/**
 * Iterate array-ish.
 *
 * @param {Array|Object} obj
 * @param {Function} fn
 * @api private
 */

function array(obj, fn) {
  for (var i = 0; i < obj.length; ++i) {
    fn(obj[i], i);
  }
}

});
require.register("monstercat-rating/index.js", function(exports, require, module){

var domify = require('domify');
var hover = require('hover');
var each = require('each');
var events = require('event');
var bind = require('bind');
var Emitter = require('emitter');
var classes = require('classes');
var exclrange = require('range');
var range = function(a, b){ return exclrange(a, b, true); };

module.exports = Rating;

function Rating(opts) {
  if (!(this instanceof Rating)) return new Rating(opts);
  Emitter.call(this);
  var self = this;
  opts = opts || {};

  var data = {};
  data.stars = opts.stars != null? opts.stars : 5;
  var el = this.el = domify(require('./template')(data));

  this.stars = data.stars;
  this.els = [].slice.call(el.children);
  this.delay = opts.delay != null? opts.delay : 100;
  this.current = [];
  this.disabled = false;

  var timeout = null;
  var reset = true;

  var over = function(star, i){
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }

    if (reset) {
      reset = false;
      self.emit('mouseenter', star, i);
    }

    if (!this.disabled) {
      this.highlight(range(1, i), true);
      this.highlight(range(i+1, this.stars), false);
    }
  };

  var out = function(star, i) {
    timeout = setTimeout(function(){
      reset = true;
      self.emit('mouseleave', star, i);
      if (!this.disabled) {
        self.highlight(range(1, self.stars), false);
        self.highlight(self.current, true);
      }
    }, this.delay);
  };

  var click = function(star, i) {
    this.emit("click", star, i, self.disabled);
    if (!self.disabled)
      self.rate(i);
    classes(star).toggle('clicked');
  }

  each(el.children, function(star, i){
    var bnd = function(fn) { return bind(self, fn, star, i+1); };
    hover(star, bnd(over), bnd(out));
    events.bind(star, 'click', bnd(click));
  });
}

Emitter(Rating.prototype);

Rating.prototype.rate = function Rating_rate(rating) {
  this.rating = rating;
  this.current = range(1, rating);
  this.set(this.current);
  this.emit('rating', rating)
};

Rating.prototype.set = function Rating_set(setting) {
  this.current = setting;
  this.highlight(range(1, this.stars), false);
  this.highlight(this.current, true);
}

Rating.prototype.highlight = function Rating_highlight(ns, highlight) {
  highlight = highlight == null? true : highlight;

  var self = this;
  each(ns, function(n){
    var el = self.els[n-1];
    var c = classes(el);
    if (highlight)
      c.add('highlight');
    else
      c.remove('highlight');
  });
};

Rating.prototype.attach = function Rating_attach(el) {
  el.appendChild(this.el);
};

Rating.prototype.enable = function Rating_enable() {
  this.disabled = false;
  classes(this.el).remove('disabled');
};

Rating.prototype.disable = function Rating_disable() {
  this.disabled = true;
  classes(this.el).add('disabled');
};

});
require.register("monstercat-rating/template.js", function(exports, require, module){
var jade = require('jade-runtime');
module.exports = 
function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div class="stars">');
 for (var i = 0; i < stars; ++i)
{
buf.push('<div class="star"></div>');
}
buf.push('</div>');
}
return buf.join("");
};

});






























require.register("segmentio-overlay/lib/index.html", function(exports, require, module){
module.exports = '<div class="overlay hidden"></div>';
});



require.register("segmentio-modal/lib/index.html", function(exports, require, module){
module.exports = '<div class="modal-wrapper hidden">\n  <div class="modal hidden">\n    <a class="modal-close-button"></a>\n  </div>\n</div>';
});







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