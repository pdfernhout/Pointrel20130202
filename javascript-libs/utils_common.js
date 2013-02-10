//////////////////////// Utility functions ///////////////////////////

// Can't decide between jQuery and dojo 

//////////////////

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

function newVersionUUID(type) {
	return "pce:" + type + ":uuid:" + jQuery.couch.newUUID(); // Math.uuidFast();
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

//from http://www.broofa.com/2008/09/javascript-uuid-function/
//Copyright (c) 2010 Robert Kieffer
//Dual licensed under the MIT and GPL licenses.
//A more performant, but slightly bulkier, RFC4122v4 solution.  We boost performance
//by minimizing calls to random()
var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split(''); 

Math.uuidFastStandard = function() {
	var chars = CHARS, uuid = new Array(36), rnd=0, r;
	for (var i = 0; i < 36; i++) {
	  if (i==8 || i==13 ||  i==18 || i==23) {
	    uuid[i] = '-';
	  } else if (i==14) {
	    uuid[i] = '4';
	  } else {
	    if (rnd <= 0x02) rnd = 0x2000000 + (Math.random()*0x1000000)|0;
	    r = rnd & 0xf;
	    rnd = rnd >> 4;
	    uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
	  }
	}
	return uuid.join('');
};

var CHARS2 = '0123456789abcdefghijklmnopqrstuvwxyz'.split(''); 

Math.uuidFast = function() {
	var chars = CHARS2, uuid = new Array(32), rnd=0, r;
	for (var i = 0; i < 32; i++) {
	  if (i==14) {
	    uuid[i] = '4';
	  } else {
	    if (rnd <= 0x02) rnd = 0x2000000 + (Math.random()*0x1000000)|0;
	    r = rnd & 0xf;
	    rnd = rnd >> 4;
	    uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
	  }
	}
	return uuid.join('');
};