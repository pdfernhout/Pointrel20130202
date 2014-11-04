// Test at: http://localhost:8080/pointrel/pointrel-app/
"use strict";

// Standard nodejs modules
var fs = require('fs');
var url = require('url');
var path = require("path");

// These modules require npm installation
var express = require('express');
var bodyParser = require('body-parser');
var md5 = require('MD5');
var mime = require("mime");

// CONFIG
//Change these options as appropriate for your system
//Note the need for a trailing slash for these directory names

var baseDirectory = __dirname + "/" + "..";

var pointrelResourcesDirectory = path.normalize(baseDirectory + "/pointrel/pointrel-data/resources/");

var pointrelJournalsDirectory = path.normalize(baseDirectory + "/pointrel/pointrel-data/journals/");
var pointrelJournalsAllow = true;
var pointrelJournalsDeleteAllow = true;

var pointrelVariablesDirectory = path.normalize(baseDirectory + "/pointrel/pointrel-data/variables/");
var pointrelVariablesAllow = true;
var pointrelVariablesDeleteAllow = true;

var pointrelLogsDirectory = path.normalize(baseDirectory + "/pointrel/pointrel-data/logs/");

var pointrelPublishingDirectory = path.normalize(baseDirectory + "/pointrel/pointrel-www/");
var pointrelPublishingAllow = true;

var pointrelIndexesDirectory = path.normalize(baseDirectory + "/pointrel/pointrel-data/indexes/");
var pointrelIndexesMaintain = true;
//Set to 0 to turn off, 2048 for probably a reasonable size (the content is base 64 encoded so takes somewhat more space)
var pointrelIndexesEmbedContentSizeLimitInBytes = 2048;
var pointrelIndexesCustomFunction = null;

// Constants

var MaximumVariableVersionBufferSize = 8192;
var NO_FAILURE_HEADER = false;
var SEND_FAILURE_HEADER = true;

//These four constants used to figure out where to put resources and variables
//The defaults here should support about a trillion resources and a billion variables
//If you change these after you have started using the system, previously stored resources and variables
//won't be found unless you move them into the new expected places somehow --
//unless you make other changes to look first in the old locations
var RESOURCE_STORAGE_LEVEL_COUNT = 4;
var RESOURCE_STORAGE_SEGMENT_LENGTH = 2;
var VARIABLE_STORAGE_LEVEL_COUNT = 3;
var VARIABLE_STORAGE_SEGMENT_LENGTH = 2;

//The short name of the main index of all resources added to the archive
var POINTREL_ALL_RESOURCES_INDEX_FILE_NAME = "__PointrelAllResources.pointrelIndex";
var POINTREL_ALL_INDEXES_INDEX_FILE_NAME = "__PointrelAllIndexes.pointrelIndex";
var POINTREL_ALL_JOURNALS_INDEX_FILE_NAME = "__PointrelAllJournals.pointrelIndex";
var POINTREL_ALL_VARIABLES_INDEX_FILE_NAME = "__PointrelAllVariables.pointrelIndex";


function exitWithJSONStatusMessage(response, message, sendFailureHeader, errorNumberForHeader) {
	if (sendFailureHeader === undefined) sendFailureHeader = NO_FAILURE_HEADER;
	if (errorNumberForHeader === undefined) errorNumberForHeader = 400;
	
    if (sendFailureHeader) response.writeHeader(errorNumberForHeader, message);
    var messageWithQuotesEscaped = message.replace('"', '\\"');
    response.end('{"status": "FAIL", "message": "' + messageWithQuotesEscaped + '"}');
    return false;
}

function validateFileExistsOrExit(response, fullFileName) {
	if (!fs.existsSync(fullFileName)) {
		// TODO: Can't replace with exitWithJSONStatusMessage because has extra value
		// header("HTTP/1.1 400 File does not exist: " . $fullFileName);
		response.send('{"status": "FAIL", "message": "File does not exist: ' + fullFileName + '", "currentValue": null}');
		return false;
	}
	return true;
}

//Returns the path where this file would go
function calculateStoragePath(baseDirectory, hexDigits, levelCount, segmentLength, createSubdirectories) {
	// console.log("calculateStoragePath", baseDirectory, hexDigits, levelCount, segmentLength, createSubdirectories);
    var fullPath = baseDirectory;
    for (var level = 0; level < levelCount; level++) {
        var startOfSegment = level * segmentLength;
        var segment = hexDigits.substring(startOfSegment, startOfSegment + segmentLength);
        fullPath = fullPath + segment + "/";
        if (createSubdirectories) fs.mkdirSync(fullPath);
    }

    // console.log("calculated path:", fullPath);
    return fullPath;
}

function explode(separator, source, limit)
{
    var result = source.split(separator);
    if (limit) {
    	var extra = result.splice(limit - 1);
    	result.push(extra.join(separator));
    }
    return result;
}

//TODO: add option to validate for SHA256 content
//Returns short name (after pointrel://) or quits with an error
function validateURIOrExit(response, pointrelURI, sendHeader) {
	if (sendHeader === undefined) sendHeader = NO_FAILURE_HEADER;
	
	// TODO: Sanitize error messages as they repeat user input
	var pointrelAndRest = explode("//", pointrelURI, 2);
	 
	if (pointrelAndRest[0] !== "pointrel:") {
		return exitWithJSONStatusMessage(response, "URI does not start with pointrel://", sendHeader, 406);
	}
	 
	if (pointrelAndRest.length < 2) {
		return exitWithJSONStatusMessage(response, 'URI is malformed with missing "//"', sendHeader, 406);
	}
	
	if (pointrelAndRest.length > 2) {
		return exitWithJSONStatusMessage(response, 'URI is malformed with extra "//"', sendHeader, 406);
	}
	 
	var shortName = pointrelAndRest[1];
	 
	if (shortName.length === 0) {
		return exitWithJSONStatusMessage(response, 'URI is missing the section after pointrel://', sendHeader, 406);
	}

	// sha256_HEX_SIZE.extension
	var shaAndRest = explode("_", shortName, 3);

	if (shaAndRest[0] !== "sha256") {
		return exitWithJSONStatusMessage(response, "URI does not use sha256", sendHeader, 406);
	}

	var hexDigits = shaAndRest[1];

	if (hexDigits.length !== 64) {
		return exitWithJSONStatusMessage(response, "URI does have 64 sha256 characters", sendHeader, 406);
	}

	// TODO: Make sanitization stricter for extension; size and hexDigits are probably good enough as they are compared with actual values from the content
	if (shortName.indexOf("/") !== -1 || shortName.indexOf("'") !== -1 || shortName.indexOf('"') !== -1 || shortName.indexOf('\\') !== -1 || shortName.indexOf('..') !== -1) {
		return exitWithJSONStatusMessage(response, "Bad characters in URI", sendHeader, 406);
	}

	var lengthAndRest = explode(".", shaAndRest[2]);
	var lengthString = lengthAndRest[0];

	if (lengthString.length == 0) {
		return exitWithJSONStatusMessage(response, "URI does have a length field", sendHeader, 406);
	}

	var length = parseInt(lengthString);

	if (length < 0) {
		return exitWithJSONStatusMessage(response, "URI has negative length field", sendHeader, 406);
	}

	// var dotPosition = shortName.indexOf('.');
	// if (dotPosition === -1) {
	//     extension = "_no_extension_";
	// } else {
	//     // TODO: escape extension
	//     extension = shortName.substring(dotPosition + 1));
	// }

	return {
		"pointrelURI": pointrelURI,
	    "shortName": shortName,
	    "hexDigits": hexDigits,
	    // "extension": extension,
	    "length": length,
	};
}

function getCGIField(request, fieldName) {
	var result = "";
	if (request.method === "POST") {
		result = request.body[fieldName];
	} else {
		// Should be GET
		result = request.query[fieldName];
	}
	console.log("getCGIField", request.method, fieldName, result);
	return result;
}

//Handling CGI requests

function journalStore(request, response) {
	response.send('{"response": "journalStore Unfinished!!!!"}');
}

function resourceAdd(request, response) {
	response.send('{"response": "resourceAdd Unfinished!!!!"}');
}

function resourceGet(request, response) {
	// Example: http://localhost/~pdf/pointrel-app/resource-get.php?userID=anonymous&resourceURI=pointrel://sha256_a2ca24b424919216bdf441301d65fd83215562891a2bd2195984313a26f04029_12466.txt&contentType=text/plain&charset=UTF-8

	var resourceURI = getCGIField(request, 'resourceURI');
	var userID = getCGIField(request, 'userID');
	var contentType = getCGIField(request, 'contentType');
	var charset = getCGIField(request, 'charset');
	var attachmentName = getCGIField(request, 'attachmentName');

	// For later use
	var session = getCGIField(request, 'session');
	var authentication = getCGIField(request, 'authentication');

	// var remoteAddress = $_SERVER['REMOTE_ADDR'];

	// error_log('{"timeStamp": "' . currentTimeStamp() . '", "remoteAddress": "' . $remoteAddress . '", "request": "resource-get", "resourceURI": "' . $resourceURI . '", "userID": "' . $userID . '", "session": "' . $session . '"}' . "\n", 3, $fullLogFileName);

	if (!resourceURI) {
	    return exitWithJSONStatusMessage(response, "No resourceURI was specified", SEND_FAILURE_HEADER, 400);
	}

	if (!userID) {
	    return exitWithJSONStatusMessage(response, "No userID was specified", SEND_FAILURE_HEADER, 400);
	}

	var urlInfo = validateURIOrExit(response, resourceURI, SEND_FAILURE_HEADER);
	if (urlInfo === false) return false;
	
	var shortName = urlInfo["shortName"];
	var hexDigits = urlInfo["hexDigits"];

	var createSubdirectories = false;
	var storagePath = calculateStoragePath(pointrelResourcesDirectory, hexDigits, RESOURCE_STORAGE_LEVEL_COUNT, RESOURCE_STORAGE_SEGMENT_LENGTH, createSubdirectories);
	var fullName = storagePath + shortName;

	if (!fs.existsSync(fullName)) {
	    return exitWithJSONStatusMessage(response, 'File does not exist: "' + fullName + '"', SEND_FAILURE_HEADER, 404);
	}

	// TODO: mime_content_type has been deprecated for later versions of PHP -- check and use replacement?
	if (!contentType) contentType = mime.lookup(fullName);
	if (!contentType) contentType = "text/plain";
	if (!charset) charset = "utf-8";

	response.setHeader("Content-type", contentType + "; charset=" + charset);
	if (attachmentName) response.setHeader("Content-Disposition", 'attachment; filename="' + attachmentName + '"');
	console.log("about to sendFile", fullName);
	response.sendFile(fullName);
	return true;
}

function resourcePublish(request, response) {
	response.send('{"response": "resourcePublish Unfinished!!!!"}');
}

function successfulVariableOperation(response, operation, variableName, variableValueAfterOperation) {
	// ??? header("Content-type: text/json; charset=UTF-8");
	return response.send('{"status": "OK", "message": "Successful operation: ' + operation + '", "variable": "' + variableName + '", "currentValue": "' + variableValueAfterOperation + '"}');
}

function variableQuery(request, response) {
	console.log("variableQuery", request.url, request.body);
	// var url_parts = url.parse(request.url, true);
	//var query = url_parts.query;
	//console.log("variableQuery", query);

	var variableName = getCGIField(request, 'variableName');
	var operation = getCGIField(request, 'operation');
	var createIfMissing = getCGIField(request, 'createIfMissing');
	var newValue = getCGIField(request, 'newValue');
	var currentValue = getCGIField(request, 'currentValue');
	var userID = getCGIField(request, 'userID');

	// For later use
	var session = getCGIField(request, 'session');
	var authentication = getCGIField(request, 'authentication');

	// Default createIfMissing to true unless explicitly set to false
	if (createIfMissing === "f" || createIfMissing === "false" || createIfMissing === "F" || createIfMissing === "FALSE") {
	    createIfMissing = false;
	} else {
	    createIfMissing = true;
	}
	
	// $remoteAddress = $_SERVER['REMOTE_ADDR'];
	// $logTimeStamp = currentTimeStamp();
	// error_log('{"timeStamp": "' + logTimeStamp . '", "remoteAddress": "' + remoteAddress + '", "request": "variable-change", "variableName": "' + variableName + '", "operation": "' + operation + '", "newValue": "' + newValue + '", "currentValue": "' + currentValue + '", "userID": "' + userID + '", "session": "' + session + '"}' + "\n", 3, $fullLogFileName);

	if (pointrelVariablesAllow !== true) {
	    return exitWithJSONStatusMessage(response, "Variables not allowed", SEND_FAILURE_HEADER, 400);
	}

	if (operation === null) {
	    return exitWithJSONStatusMessage(response, "No operation was specified", NO_FAILURE_HEADER, 400);
	}

	var operations =  {"exists": 1, "new": 1, "delete": 1, "get": 1, "set": 1, "query": 1};
	if (!operation in operations) {
	    return exitWithJSONStatusMessage(response, "Unsupported operation: '" + operation + "'", NO_FAILURE_HEADER, 400);
	}

	if (!userID) {
	    return exitWithJSONStatusMessage(response, "No userID was specified", NO_FAILURE_HEADER, 400);
	}

	if (!variableName) {
	    return exitWithJSONStatusMessage(response, "No variableName was specified", NO_FAILURE_HEADER, 400);
	}

	if (variableName.length > 100) {
	    return exitWithJSONStatusMessage(response, "Variable name is too long (maximum 100 characters)", NO_FAILURE_HEADER, 400);
	}
	
	// From: http://stackoverflow.com/questions/2668854/sanitizing-strings-to-make-them-url-and-filename-safe
	// but changed to change dots to underscores
	var shortFileNameForVariableName = variableName.replace(/\s/g, "_").replace(/\.[\.]+/g, "_").replace(/[^\w_\.\-]/g, "_");

	var hexDigits = md5(shortFileNameForVariableName);

	var createSubdirectories = (operation === "new") || (operation === "set" && currentValue === "");
	if (createSubdirectories) {
		// TODO: exitIfCGIRequestMethodIsNotPost();
	}

	var storagePath = calculateStoragePath(pointrelVariablesDirectory, hexDigits, VARIABLE_STORAGE_LEVEL_COUNT, VARIABLE_STORAGE_SEGMENT_LENGTH, createSubdirectories);

	var fullVariableFileName = storagePath + "variable_" + hexDigits + "_" + shortFileNameForVariableName + '.txt';
	var variableValueAfterOperation = "ERROR";
	
	if (operation === "exists") {
	    if (fs.existsSync(fullVariableFileName)) {
	        // TODO: Can't replace this one because it has OK
	        return response.send('{"status": "OK", "message": "Variable file exists: ' + $fullVariableFileName + '"}');
	    }
	    return exitWithJSONStatusMessage(response, "Variable file does not exist: '" + fullVariableFileName + "'", NO_FAILURE_HEADER, 0);
	} else if (operation === "new") {
		// TODO
		return exitWithJSONStatusMessage(response, "unfinished new", SEND_FAILURE_HEADER, 500);
    } else if (operation === "delete") {
		// TODO
    	return exitWithJSONStatusMessage(response, "unfinished delete", SEND_FAILURE_HEADER, 500);
    } else if (operation === "set") {
		// TODO
    	return exitWithJSONStatusMessage(response, "unfinished set", SEND_FAILURE_HEADER, 500);
    } else if (operation === "get") {
		if (!validateFileExistsOrExit(response, fullVariableFileName)) {
			return false;
		}
		fs.readFile(fullVariableFileName, "utf8", function (err, data) {
			if (err) {
				return exitWithJSONStatusMessage(response, "Could not read variable file: " + fullVariableFileName, SEND_FAILURE_HEADER, 500);
			}
			variableValueAfterOperation = data;
			console.log("variableValueAfterOperation", variableValueAfterOperation);
			return successfulVariableOperation(response, operation, variableName, variableValueAfterOperation);
		});
	    // TODO: Add support for queries to reduce back-and-forth traffic, like to follow previousVersion or retrieve contents of value
	    // If a value is a pointrel resource URI ending in ".json", it would be read in if more fields of it are wanted
	    // Example: "value value.contents previousVersion.contents previousVersion.previousVersion previousVersion.previousVersion.contents
	} else if (operation === "query") {
		// TODO
		return exitWithJSONStatusMessage(response, "unfinished query", SEND_FAILURE_HEADER, 500);
	} else {
		return exitWithJSONStatusMessage(response, "Unsupported operation: '" + operation + "'", NO_FAILURE_HEADER, 400);
	}
}

// Main code

console.log("Pointrel20130202 server for nodejs started: " + Date());

console.log("__dirname", __dirname);

var app = express();

//to support JSON-encoded bodies
app.use(bodyParser.json());

//to support URL-encoded bodies
app.use(bodyParser.urlencoded({
  extended: true
})); 

var logger = function(request, response, next) {
    console.log("Requesting:", request.url);
    next();
};

app.use(logger);

app.get("/", function (request, response) {
  response.send('Hello World!');
});

app.get("/pointrel/pointrel-app/server/journal-store.php", function (request, response) {
	journalStore(request, response);
})

app.post("/pointrel/pointrel-app/server/journal-store.php", function (request, response) {
	journalStore(request, response);
})

app.get("/pointrel/pointrel-app/server/resource-add.php", function (request, response) {
	resourceAdd(request, response);
});

app.post("/pointrel/pointrel-app/server/resource-add.php", function (request, response) {
	resourceAdd(request, response);
});

app.get("/pointrel/pointrel-app/server/resource-get.php", function (request, response) {
	resourceGet(request, response);
})

app.post("/pointrel/pointrel-app/server/resource-get.php", function (request, response) {
	resourceGet(request, response);
})

app.get("/pointrel/pointrel-app/server/resource-publish.php", function (request, response) {
	resourcePublish(request, response);
})

app.post("/pointrel/pointrel-app/server/resource-publish.php", function (request, response) {
	resourcePublish(request, response);
})

app.get("/pointrel/pointrel-app/server/variable-query.php", function (request, response) {
	variableQuery(request, response);
})

app.post("/pointrel/pointrel-app/server/variable-query.php", function (request, response) {
	variableQuery(request, response);
})

app.use("/pointrel", express.static(__dirname + "/../pointrel"));

var server = app.listen(8080, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log("Pointrel20130202 app listening at http://%s:%s", host, port);
});