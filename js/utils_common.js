//////////////////////// Utility functions ///////////////////////////

// Get the value of a parameter in the query string
function getParameter(paramName) {
    var searchString = window.location.search.substring(1);
    var params = searchString.split("&");

    for (var i = 0; i < params.length; i++) {
        var val = params[i].split("=");
        if (val[0] === paramName) {
            return decodeURI(val[1]);
        }
    }
    return null;
}


//////////// Timestamps

function displayStringForTimestamp(timestamp) {
	return timestamp.replace("T", " ").replace("Z", " UTC");
}

function displayStringForTimestampToSeconds(timestamp) {
	return timestamp.replace("T", " ").replace("Z", " UTC").substring(0,19);
}

//from http://thecodedecanter.wordpress.com/2010/04/02/generating-iso-compliant-timestamp-strings-in-javascript/

// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Date#Example.3a_ISO_8601_formatted_dates
// modified for milliseconds
function ISODateString(d) {
    function pad(n){
        return n < 10 ? '0' + n : n;
    }
    function pad2(n){
        n = pad(n);
        return n < 100 ? '0' + n : n;
    }
    return d.getUTCFullYear() + '-' +
        pad(d.getUTCMonth() + 1) + '-' +
        pad(d.getUTCDate()) + 'T' +
        pad(d.getUTCHours()) + ':' +
        pad(d.getUTCMinutes()) + ':' +
        pad(d.getUTCSeconds()) + '.' +
        pad2(d.getUTCMilliseconds()) + 'Z';
}

function currentTimestamp() {
	return ISODateString(new Date());
}

function newVersionUUID(type) {
	return "pce:" + type + ":uuid:" + jQuery.couch.newUUID(); // Math.uuidFast();
}

//from http://www.broofa.com/2008/09/javascript-uuid-function/
//Copyright (c) 2010 Robert Kieffer
//Dual licensed under the MIT and GPL licenses.
//A more performant, but slightly bulkier, RFC4122v4 solution.  We boost performance
//by minimizing calls to random()
var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split(''); 

Math.uuidFastStandard = function() {
	var chars = CHARS, uuid = new Array(36), rnd=0, r;
	for (var i = 0; i < 36; i++) {
	  if (i=== 8 || i === 13 ||  i === 18 || i === 23) {
	    uuid[i] = '-';
	  } else if (i === 14) {
	    uuid[i] = '4';
	  } else {
	    if (rnd <= 0x02) { rnd = 0x2000000 + (Math.random() * 0x1000000) | 0; }
	    r = rnd & 0xf;
	    rnd = rnd >> 4;
	    uuid[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r];
	  }
	}
	return uuid.join('');
};

var CHARS2 = '0123456789abcdefghijklmnopqrstuvwxyz'.split(''); 

Math.uuidFast = function() {
	var chars = CHARS2, uuid = new Array(32), rnd=0, r;
	for (var i = 0; i < 32; i++) {
	  if (i === 14) {
	    uuid[i] = '4';
	  } else {
	    if (rnd <= 0x02) {rnd = 0x2000000 + (Math.random() * 0x1000000) | 0; }
	    r = rnd & 0xf;
	    rnd = rnd >> 4;
	    uuid[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r];
	  }
	}
	return uuid.join('');
};

///

function newStandardDocument(type, context, user, title, contentsType, contentsValue, parents, signature) {
	return { 
		"_id": newVersionUUID(type),
		"timestamp": currentTimestamp(),
		"type": type,
		"context": context,
		"user": user,
		"title": title,
		"contentsType": contentsType,
		"contentsValue": contentsValue,
		"parents": parents,
		"signature": signature
		};
}

/// encoding and decoding

function encodeAsUTF8(text) {
    return unescape(encodeURIComponent(text));
}

function decodeFromUTF8(text) {
    return decodeURIComponent(escape(text));
}

// From: http://phpjs.org/functions/base64_encode/
function base64_encode(data) {
    // http://kevin.vanzonneveld.net
    // +   original by: Tyler Akins (http://rumkin.com)
    // +   improved by: Bayron Guevara
    // +   improved by: Thunder.m
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   bugfixed by: Pellentesque Malesuada
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   improved by: Rafał Kukawski (http://kukawski.pl)
    // *     example 1: base64_encode('Kevin van Zonneveld');
    // *     returns 1: 'S2V2aW4gdmFuIFpvbm5ldmVsZA=='
    // mozilla has this native
    // - but breaks in 2.0.0.12!
    //if (typeof this.window['btoa'] == 'function') {
    //    return btoa(data);
    //}
    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    //noinspection JSUnusedAssignment
    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
        ac = 0,
        enc = "",
        tmp_arr = [];

    if (!data) {
        return data;
    }

    do { // pack three octets into four hexets
        o1 = data.charCodeAt(i++);
        o2 = data.charCodeAt(i++);
        o3 = data.charCodeAt(i++);

        bits = o1 << 16 | o2 << 8 | o3;

        h1 = bits >> 18 & 0x3f;
        h2 = bits >> 12 & 0x3f;
        h3 = bits >> 6 & 0x3f;
        h4 = bits & 0x3f;

        // use hexets to index into b64, and append result to encoded string
        tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
    } while (i < data.length);

    enc = tmp_arr.join('');

    var r = data.length % 3;

    return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);
}

// From: http://phpjs.org/functions/base64_decode/
function base64_decode(data) {
  // discuss at: http://phpjs.org/functions/base64_decode/
  // original by: Tyler Akins (http://rumkin.com)
  // improved by: Thunder.m
  // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  //   input by: Aman Gupta
  //   input by: Brett Zamir (http://brett-zamir.me)
  // bugfixed by: Onno Marsman
  // bugfixed by: Pellentesque Malesuada
  // bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  //   example 1: base64_decode('S2V2aW4gdmFuIFpvbm5ldmVsZA==');
  //   returns 1: 'Kevin van Zonneveld'

	var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
	var o1, o2, o3, h1, h2, h3, h4, bits, i = 0, ac = 0, dec = '', tmp_arr = [];

	if (!data) {
		return data;
	}

	data += '';

	do { // unpack four hexets into three octets using index points in b64
		h1 = b64.indexOf(data.charAt(i++));
		h2 = b64.indexOf(data.charAt(i++));
		h3 = b64.indexOf(data.charAt(i++));
		h4 = b64.indexOf(data.charAt(i++));

		bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;

		o1 = bits >> 16 & 0xff;
		o2 = bits >> 8 & 0xff;
		o3 = bits & 0xff;

		if (h3 === 64) {
			tmp_arr[ac++] = String.fromCharCode(o1);
		} else if (h4 === 64) {
			tmp_arr[ac++] = String.fromCharCode(o1, o2);
		} else {
			tmp_arr[ac++] = String.fromCharCode(o1, o2, o3);
		}
	} while (i < data.length);

	dec = tmp_arr.join('');

	return dec;
}

function validateBinaryData(dataString) {
    // slow for now...
    for (var i = 0; i < dataString.length; i++) {
        var c = dataString.charAt(i);
        // console.log("char", i, c.charCodeAt(0), c);
        var charCode = c & 0xff;
        if (charCode < 0 || charCode > 255) {
            alert("string had data outside the range of 0-255 at position: " + i);
            return false;
        }
    }
    return true;
}


function startsWith(data, start) {
    return data.substring(0, start.length) === start;
}