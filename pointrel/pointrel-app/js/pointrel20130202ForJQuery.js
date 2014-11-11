// Need to load jstorage, pointrel_authentication, and utils_common. first
// TODO: Might need to think about decoding URLs passed back to user and encoding them for variables

var Pointrel = (function () {
	"use strict";
	
    var pointrel = {};
    
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
    
    function createOnReadyStateChangeCallback(callback, postProcessing, request) {
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
        
	    request.onreadystatechange = createOnReadyStateChangeCallback(callback, postProcessing, request);
		
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
    
    /// EXPORT

    pointrel.resource_add = pointrel_resource_add;
    pointrel.resource_get = pointrel_resource_get;
    pointrel.resource_publish = pointrel_resource_publish;
    
    pointrel.variable_new = pointrel_variable_new;
    pointrel.variable_get = pointrel_variable_get;
    pointrel.variable_set = pointrel_variable_set;
    pointrel.variable_delete = pointrel_variable_delete;
    
    pointrel.journal_exists = pointrel_journal_exists;
    pointrel.journal_create = pointrel_journal_create;
    pointrel.journal_delete = pointrel_journal_delete;
    pointrel.journal_info = pointrel_journal_info;
    pointrel.journal_get = pointrel_journal_get;
    pointrel.journal_put = pointrel_journal_put;
    
    return pointrel;
}());
