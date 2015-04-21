/*!
 *  LoopedTube - jquery.utility.js
 *  https://github.com/SamuelWang/LoopedTube
 *  
 *  Copyright 2015 Samuel W.
 *  https://plus.google.com/u/0/101455311553487495221/about
 * 
 *  Date: 2015-03-31 22:20 GMT+0800
 */

(function ($) {
    "use strict";

    //integer format
    var formatDecimal = function (value, pattern) {
        value = parseInt(value, 10);
        
        var matchs = /[D]{1}(\d+)/gi.exec(pattern),
            isNegative = (value < 0) ? true : false,
            operand = String((isNegative) ? -value : value),
            result = value,
            digital;

        if (matchs[1] && matchs[1] !== '0') {
            digital = parseInt(matchs[1], 10);

            if (digital > operand.length) {
                result = (new Array(digital - operand.length + 1).join('0')) + operand;
            } else if (digital < operand.length) {
                result = operand.substr(0, digital);
            } else {
                result = operand;
            }

            if (isNegative) {
                result = '-' + result;
            }
        }

        return result;
    };

    $.format = function (format/*, arg1, arg2,...*/) {
        var args = Array.prototype.slice.call(arguments, 1),
            result = format;

        if ($.isString(format) && args.length > 0) {
            result = format.replace(/\{(\d+)\:?([D]?\d*)\}/gim, function (match, p1, p2) {
                var index = parseInt(p1, 10),
                    result = match;
                
                if (args.hasOwnProperty(index)) {
                    if ($.isInteger(args[index]) && /[D]{1}\d+/gi.test(p2)) {
                        result = formatDecimal(args[index], p2);
                    } else {
                        result = args[index];
                    }
                }

                return result;
            });
        }

        return result;
    };
}(jQuery));

(function ($) {
    "use strict";

    $.isString = function (value) {
        return typeof value === 'string';
    };

    $.isInteger = function (value) {
        return isFinite(value) &&
               Math.floor(value) === value;
    };

    //convert time format string to seconds
    $.timeToSecond = function (time) {
        var match = /(\d{1,2}):?(\d{1,2}):?(\d{1,2})/.exec(time),
            seconds = null;

        if (match && match.length === 4) {
            seconds = 0;

            //calculate hour
            if (match[1]) {
                seconds += parseInt(match[1], 10) * 60 * 60;
            }

            //calculate minute
            if (match[2]) {
                seconds += parseInt(match[2], 10) * 60;
            }

            //calculate second
            if (match[3]) {
                seconds += parseInt(match[3], 10);
            }
        }

        return seconds;
    };

    //convert seconds to time format string
    $.secondToTime = function (value) {
        var result = null,
            hour = 0,
            minute = 0,
            second = 0;

        if (value) {
            hour = Math.floor(value / 3600);
            minute = Math.floor((value - (hour * 3600)) / 60);
            second = value - (hour * 3600) - (minute * 60);

            result = $.format('{0:D2}:{1:D2}:{2:D2}', hour, minute, second);
        } else {
            result = $.format('{0:D2}:{1:D2}:{2:D2}', hour, minute, second);
        }

        return result;
    };
}(jQuery));
