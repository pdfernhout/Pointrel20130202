// Need to load jstorage, pointrel_authentication, and utils_common. first
// TODO: Might need to think about decoding URLs passed back to user and encoding them for variables
"use strict";
	
/* global exports, define */
// Using module definition pattern from Mustache that can support CommonJS, AMD, or direct loading as a script
(function (global, factory) {
	if (typeof exports === "object" && exports) {
		console.log("Pointrel20130202 CommonJS init");
		factory(exports); // CommonJS
	} else if (typeof define === "function" && define.amd) {
		console.log("Pointrel20130202 AMD init");
		define("Pointrel20130202", ['exports'], factory); // AMD
	} else {
		console.log("Pointrel20130202 script init", global, factory);
		global.Pointrel20130202 = {};
		factory(global.Pointrel20130202); // <script>
	}
}(this, function (pointrel) {
	
    // support functions
	function validateBinaryData(dataString) {
	    // slow for now...
	    for (var i = 0; i < dataString.length; i++) {
	        var c = dataString.charAt(i);
	        // console.log("char", i, c.charCodeAt(0), c);
	        // var charCode = c & 0xff;
	        var charCode = c;
	        if (charCode < 0 || charCode > 255) {
	            alert("string had data outside the range of 0-255 at position: " + i);
	            return false;
	        }
	    }
	    return true;
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
	
	// end support functions
	
    // Currying two variables
    function success(callback, postProcessing, request) {
    	var response = request.response;
		// console.log("sendRequest result:", request, response);
		if (request.responseType === "text" || request.statusText === "OK") {
			if (typeof (callback) === "function") {
				if (typeof (postProcessing) === "function") {
					response = postProcessing(response);
				}
				callback(null, response);
			}
		} else {
			if (typeof (callback) === "function") {
				callback("FAILED", request);
			}
		}
    }
    
    function createOnReadyStateChangeCallback(remoteScript, callback, postProcessing, request) {
    	return function() {
			if (request.readyState != 4)  return;
			// 200 == success, 304 = not modified
			if  (request.status === 200 || request.status === 304) {
				success(callback, postProcessing, request);
			} else {
				// Otherwise an error
				console.log("sendRequest error", request, request.status, request.statusText);
				if (typeof (callback) === "function") {
					callback("ERROR", request);
				} else {
					alert("Failed POST to " + remoteScript + "\nstatus: " + request.status + " statusText: " + request.statusText);
				}
			}
		};
    }
    
    /* global XMLHttpRequest,  ActiveXObject */
    // Factories and creation method from: http://stackoverflow.com/questions/2557247/easiest-way-to-retrieve-cross-browser-xmlhttprequest
    var XMLHttpFactories = [
        function () {return new XMLHttpRequest();},
        function () {return new ActiveXObject("Msxml3.XMLHTTP");},
        function () {return new ActiveXObject("Msxml2.XMLHTTP");},
        function () {return new ActiveXObject("Msxml2.XMLHTTP.6.0");},
        function () {return new ActiveXObject("Msxml2.XMLHTTP.3.0");},
        function () {return new ActiveXObject("Microsoft.XMLHTTP");}
    ];

    function createXMLHTTPObject() {
        var xmlhttp = false;
        for (var i = 0; i < XMLHttpFactories.length; i++) {
            try {
                xmlhttp = XMLHttpFactories[i]();
            } catch (e) {
                continue;
            }
            break;
        }
        return xmlhttp;
    }
    
    // http://stackoverflow.com/questions/22582795/jquery-param-alternative-for-javascript
    function queryParams(data) {
        var array = [];
        
	    for(var key in data) {
	        array.push(encodeURIComponent(key) + "=" + encodeURIComponent(data[key]));
	    }
	    
	   return array.join("&");
	}

	function sendRequest(serverURL, remoteScript, credentials, data, callback, postProcessing) {
		data.userID = pointrel_authentication.userIDFromCredentials(credentials);
		
		var requestType = "POST";
		var dataType = "json";
		
		// Everything else uses POST and returns JSON, except this one which returns immutable resources that could be cached
		if (remoteScript === "resource-get.php") {
			requestType = "GET";
			dataType = "text";
		}
		
		// console.log("sendRequest", remoteScript, requestType, dataType, data);
		
		var url = serverURL + remoteScript;
		if (requestType === "GET") {
			var urlParamsToAdd = queryParams(data);
			if (urlParamsToAdd) url += "?" + urlParamsToAdd;
		}
		
		var request = createXMLHTTPObject(); // new XMLHttpRequest();
		
        var async = true;
		request.open(requestType, url, async);
 
        request.responseType = dataType;
        
        // TODO: Are these needed?
        // request.setRequestHeader('User-Agent','XMLHTTP/1.0');
        if (requestType === "POST") request.setRequestHeader('Content-type','application/x-www-form-urlencoded');   
        
		// TODO: Are these headers really needed? They are not used in the other requests, although this one has encoded data
        // headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
		// cache: false,
        
	    request.onreadystatechange = createOnReadyStateChangeCallback(remoteScript, callback, postProcessing, request);
		
		if (requestType === "GET") {
			request.send();
		} else {
			// Need to pass original data string as it will be utf-8 encoded by jQuery
			var dataToSend = "";
			if (data) dataToSend = queryParams(data);
			request.send(dataToSend);
		}
	}

    //////// RESOURCES
	
    // TODO: Might need to think about decoding URLs passed back to user and encoding them for variables

    // Data passed to this needs to be only characters in the range 0-255 (byte)
    // That means you should encode and decode arbitrary JavaScript string text using the UTF8 functions if needed
	function pointrel_resource_add(serverURL, credentials, originalDataString, extension, callback) {
        console.log("pointrel_resource_add extension: ", extension);
        // special validation for now
        if (!validateBinaryData(originalDataString)) { callback("FAILED Not Binary Data", null); return ""; }

        var stringInCryptoJSWords = CryptoJS.enc.Latin1.parse(originalDataString);
        var hash = CryptoJS.SHA256(stringInCryptoJSWords);

        var extensionSeperator = ".";
        if (extension === "") extensionSeperator = "";
        var uri = "pointrel://sha256_" + hash + "_" + originalDataString.length + extensionSeperator + extension;

        var data = {"resourceURI": uri, "resourceContent": base64_encode(originalDataString)};
        sendRequest(serverURL, "resource-add.php", credentials, data, callback);

        console.log("pointrel_resource_add returning: ", uri);
        return uri;
    }

    function pointrel_resource_get(serverURL, credentials, uri, callback) {
        console.log("pointrel_resource_get: ", uri);
        var data = {"resourceURI": uri};
        sendRequest(serverURL, "resource-get.php", credentials, data, callback);
    }

    function pointrel_resource_publish(serverURL, credentials, resourceURI, destinationURL, callback) {
        console.log("pointrel_resource_publish: ", resourceURI, " to: ", destinationURL);
        
        var data = {"resourceURI": resourceURI, "destinationURL": destinationURL};
        sendRequest(serverURL, "resource-publish.php", credentials, data, callback);
    }

    //////// VARIABLES

    function pointrel_variable_new(serverURL, credentials, variableName, newValue, callback) {
        console.log("pointrel_variable_new: ", variableName);
        // var encodedVariableName = EncodeAsUTF8(variableName);
        var data = {"variableName": variableName, "operation": "new", "newValue": newValue};
        sendRequest(serverURL, "variable-query.php", credentials, data, callback);
    }

    function pointrel_variable_get(serverURL, credentials, variableName, callback) {
        console.log("pointrel_variable_get: ", variableName);
        // var encodedVariableName = EncodeAsUTF8(variableName);
        var data = {"variableName": variableName, "operation": "get"};
        sendRequest(serverURL, "variable-query.php", credentials, data, callback);
    }

    function pointrel_variable_set(serverURL, credentials, variableName, oldVersionURI, newVersionURI, callback) {
        console.log("pointrel_resource_set: ", variableName, " old: ", oldVersionURI, " new: ", newVersionURI);
        // var encodedVariableName = EncodeAsUTF8(variableName);
        var data = {"variableName": variableName, "operation": "set", "currentValue": oldVersionURI, "newValue": newVersionURI};
        sendRequest(serverURL, "variable-query.php", credentials, data, callback);
    }

    function pointrel_variable_delete(serverURL, credentials, variableName, currentValue, callback) {
        console.log("pointrel_variable_delete: ", variableName);
        // var encodedVariableName = EncodeAsUTF8(variableName);
        var data = {"variableName": variableName, "operation": "delete", currentValue: currentValue};
        sendRequest(serverURL, "variable-query.php", credentials, data, callback);
    }

    ///// JOURNALS
    
    function decodeResponseFromServer(responseFromServer) {
		responseFromServer.result = base64_decode(responseFromServer.result);
		return responseFromServer;
	}
    
    function pointrel_journal_ajax(operation, serverURL, credentials, journalName, journalType, callback, extra) {
        console.log("pointrel_journal_ajax", operation, journalName, journalType);
        // var encodedJournalName = encodeAsUTF8(journalName);
        
        // Build merged content with extra fields if needed
        var data = {"journalName": journalName, "journalType": journalType, "operation": operation};
        for (var attributeName in extra) {
            if (extra.hasOwnProperty(attributeName)) { data[attributeName] = extra[attributeName]; }
        }
        
        console.log("data: ", data);
        
        var postProcessing = null;
        if (operation === "get") postProcessing = decodeResponseFromServer; 
        
        sendRequest(serverURL, "journal-store.php", credentials, data, callback, postProcessing);
    }
    
    function pointrel_journal_exists(serverURL, credentials, journalName, journalType, callback) {
        pointrel_journal_ajax("exists", serverURL, credentials, journalName, journalType, callback, {});
    }
    
    function pointrel_journal_create(serverURL, credentials, journalName, journalType, journalFormat, callback) {
        pointrel_journal_ajax("create", serverURL, credentials, journalName, journalType, callback, {"journalFormat": journalFormat});
    }
    
    function pointrel_journal_delete(serverURL, credentials, journalName, journalType, header, size, callback) {
        pointrel_journal_ajax("delete", serverURL, credentials, journalName, journalType, callback, {"userSuppliedHeader": header, "userSuppliedSize": size});
    }
    
    function pointrel_journal_info(serverURL, credentials, journalName, journalType, callback) {
        pointrel_journal_ajax("info", serverURL, credentials, journalName, journalType, callback, {});
    }
    
    function pointrel_journal_get(serverURL, credentials, journalName, journalType, start, length, callback) {
        pointrel_journal_ajax("get", serverURL, credentials, journalName, journalType, callback, {"start": start, "length": length});
    }
    
    function pointrel_journal_put(serverURL, credentials, journalName, journalType, contentStringToAppend, callback) {
        var encodedContent = base64_encode(contentStringToAppend);
        // Maybe needed: headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
        pointrel_journal_ajax("put", serverURL, credentials, journalName, journalType, callback, {"encodedContent": encodedContent});
    }
    
    // Class that wraps the base functions and stores a base server URL and credentials
    function PointrelArchiver(serverURL, credentials) {
        this.serverURL = serverURL;
        this.credentials = credentials;

        // Resources
        
        this.resource_add = function (originalDataString, extension, callback) {
            return pointrel_resource_add(this.serverURL, this.credentials, originalDataString, extension, callback);

        };

        this.resource_get = function (uri, callback) {
            return pointrel_resource_get(this.serverURL, this.credentials, uri, callback);

        };

        this.resource_publish = function (resourceURI, destinationURL, callback) {
            return pointrel_resource_publish(this.serverURL, this.credentials, resourceURI, destinationURL, callback);
        };
        
        // Variables

        this.variable_new = function (variableName, newVersionURI, callback) {
            return pointrel_variable_new(this.serverURL, this.credentials, variableName, newVersionURI, callback);

        };

        this.variable_get = function (variableName, callback) {
            return pointrel_variable_get(this.serverURL, this.credentials, variableName, callback);

        };

        this.variable_set = function (variableName, oldVersionURI, newVersionURI, callback) {
            return pointrel_variable_set(this.serverURL, this.credentials, variableName, oldVersionURI, newVersionURI, callback);

        };

        this.variable_delete = function (variableName, oldVersionURI, callback) {
            return pointrel_variable_delete(this.serverURL, this.credentials, variableName, oldVersionURI, callback);
        };
        
        // Journals
        
        this.journal_exists = function (journalName, callback) {
            return pointrel_journal_exists(this.serverURL, this.credentials, journalName, "journal", callback);
        };
        
        this.journal_create = function (journalName, journalFormat, callback) {
            return pointrel_journal_create(this.serverURL, this.credentials, journalName, "journal", journalFormat, callback);
        };
        
        this.journal_delete = function (journalName, header, size, callback) {
            return pointrel_journal_delete(this.serverURL, this.credentials, journalName, "journal", header, size, callback);
        };
        
        this.journal_info = function (journalName, callback) {
            return pointrel_journal_info(this.serverURL, this.credentials, journalName, "journal", callback);
        };
        
        this.journal_get = function (journalName, start, length, callback) {
            return pointrel_journal_get(this.serverURL, this.credentials, journalName, "journal", start, length, callback);
        };
        
        this.journal_put = function (journalName, contentStringToAppend, callback) {
            return pointrel_journal_put(this.serverURL, this.credentials, journalName, "journal", contentStringToAppend, callback);
        };
        
        // Indexes -- type can be either journal, index, or all
        
        this.index_exists = function (indexName, indexType, callback) {
            return pointrel_journal_exists(this.serverURL, this.credentials, indexName, indexType, callback);
        };
        
        this.index_info = function (indexName, indexType, callback) {
            return pointrel_journal_info(this.serverURL, this.credentials, indexName, indexType, callback);
        };
        
        this.index_get = function (indexName, indexType, start, length, callback) {
            return pointrel_journal_get(this.serverURL, this.credentials, indexName, indexType, start, length, callback);
        };
    }
    
    // Useful utility functions when working with Pointrel data
    
    var Utility = {};
    
    /* global escape, unescape, window */
    
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
	
	function displayStringForTimestamp(timestamp) {
	    return timestamp.replace("T", " ").replace("Z", " UTC");
	}
	
	function startsWith(data, start) {
		if (!data) return false;
	    return data.substring(0, start.length) === start;
	}
	
	/// encoding and decoding so can send binary data via pointrel and process it when it comes back
	
	function encodeAsUTF8(text) {
	    return unescape(encodeURIComponent(text));
	}
	
	function decodeFromUTF8(text) {
	    return decodeURIComponent(escape(text));
	}
	
	Utility.getParameter = getParameter;
	Utility.displayStringForTimestamp = displayStringForTimestamp;
	Utility.startsWith = startsWith;
	Utility.encodeAsUTF8 = encodeAsUTF8;
	Utility.decodeFromUTF8 = decodeFromUTF8;
        
    /// EXPORT

    // pointrel.resource_add = pointrel_resource_add;
    // pointrel.resource_get = pointrel_resource_get;
    // pointrel.resource_publish = pointrel_resource_publish;
    
    // pointrel.variable_new = pointrel_variable_new;
    // pointrel.variable_get = pointrel_variable_get;
    // pointrel.variable_set = pointrel_variable_set;
    // pointrel.variable_delete = pointrel_variable_delete;
    
    // pointrel.journal_exists = pointrel_journal_exists;
    // pointrel.journal_create = pointrel_journal_create;
    // pointrel.journal_delete = pointrel_journal_delete;
    // pointrel.journal_info = pointrel_journal_info;
    // pointrel.journal_get = pointrel_journal_get;
    // pointrel.journal_put = pointrel_journal_put;
    
    pointrel.PointrelArchiver = PointrelArchiver;
    pointrel.Utility = Utility;
    
    return pointrel;
}));
