// Test at: http://localhost:8080/pointrel/pointrel-app/
/*jslint node: true */
"use strict";

// TODO: Review error handling

// TODO: Mostly left in place the synchronized approach to file handling from PHP; need to revisit for nodejs performance

// Standard nodejs modules
var fs = require('fs');
var url = require('url');
var path = require("path");
var crypto = require('crypto');
var path = require('path');

// These modules require npm installation
var express = require('express');
var bodyParser = require('body-parser');
var md5 = require('MD5');
var mime = require("mime");
var uuid = require('node-uuid');
var fsExtra = require("fs-extra");

// CONFIG
//Change these options as appropriate for your system
//Note the need for a trailing slash for these directory names

var pointrelRepositoryIsReadOnly = false;

var baseDirectory = __dirname + "/" + "..";
var baseDirectoryNormalized = path.normalize(baseDirectory + "/");
console.log("baseDirectoryNormalized", baseDirectoryNormalized);

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

function exitIfCGIRequestMethodIsNotPost(request, response) {
    if (request.method !== 'POST') {
        exitWithJSONStatusMessage(response, "Request to change data must be a POST", SEND_FAILURE_HEADER, 400);
        return true;
    }
    return false;
}

function validateFileExistsOrExit(response, fullFileName) {
    if (!fs.existsSync(fullFileName)) {
        // TODO: Can't replace with exitWithJSONStatusMessage because has extra value
        // header("HTTP/1.1 400 File does not exist: " + fullFileName);
        response.send('{"status": "FAIL", "message": "File does not exist: ' + fullFileName + '", "currentValue": null}');
        return false;
    }
    return true;
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

    if (lengthString.length === 0) {
        return exitWithJSONStatusMessage(response, "URI does have a length field", sendHeader, 406);
    }

    var length = parseInt(lengthString, 10);

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
        "length": length
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
    // console.log("getCGIField", request.method, fieldName, result);
    return result;
}

function getIPAddress(request) { 
    // http://stackoverflow.com/questions/8107856/how-can-i-get-the-users-ip-address-using-node-js
    var ip = request.headers['x-forwarded-for'] || 
        request.connection.remoteAddress || 
        request.socket.remoteAddress ||
        request.connection.socket.remoteAddress;
    return ip;
}

// Other support

//Returns the path where this file would go
function calculateStoragePath(baseDirectory, hexDigits, levelCount, segmentLength, createSubdirectories) {
    // console.log("calculateStoragePath", baseDirectory, hexDigits, levelCount, segmentLength, createSubdirectories);
  var fullPath = baseDirectory;
  for (var level = 0; level < levelCount; level++) {
      var startOfSegment = level * segmentLength;
      var segment = hexDigits.substring(startOfSegment, startOfSegment + segmentLength);
      fullPath = fullPath + segment + "/";
      if (createSubdirectories) fsExtra.ensureDirSync(fullPath);
  }

  // console.log("calculated path:", fullPath);
  return fullPath;
}

function currentTimeStamp() {
    return new Date().toISOString();
}

// String functions

function startsWith(haystack, needle) {
    return haystack.lastIndexOf(needle, 0) === 0;
}

function endsWith(haystack, needle) {
    return haystack.indexOf(needle, haystack.length - needle.length) !== -1;
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

// From: http://stackoverflow.com/questions/2668854/sanitizing-strings-to-make-them-url-and-filename-safe
// but changed to change dots to underscores
function sanitizeFileName(fileName) {
    return fileName.replace(/\s/g, "_").replace(/\.[\.]+/g, "_").replace(/[^\w_\.\-]/g, "_");
}

function is_string(something) {
    return (typeof something == 'string' || something instanceof String);
}

// File functions

function createFile(response, fullFileName, contents) {
    try {
        fs.writeFileSync(fullFileName, contents);
    } catch(err) {
    	console.log("error creating file", fullFileName, err);
        return exitWithJSONStatusMessage(response, "Could not create or write to file: '" + fullFileName + '"', NO_FAILURE_HEADER, 500);
    }
    return true;
}

function appendDataToFile(response, fullFileName, dataToAppend) {
    try {
        fs.appendFileSync(fullFileName, dataToAppend);
    } catch(err) {
    	console.log("error appending to file", fullFileName, err);
        return exitWithJSONStatusMessage(response, "Could not append to file: '" + fullFileName + '"', NO_FAILURE_HEADER, 500);
    }
    return true;    
}

function error_log(response, message) {
	// console.log("log", message);
    // Calculate today's log file name
    var today = new Date().toISOString().substring(0, 10);
    var fullLogFileName = pointrelLogsDirectory + today + ".log";
    if (!fs.existsSync(fullLogFileName)) {
        return createFile(response, fullLogFileName, message);
    } else {
        return appendDataToFile(response, fullLogFileName, message);
    }
}

function getFileExtension(fileName) {
    return path.extname(fileName);
}

////// Indexing support

// There could be concurrency issues in between the time a check for existency is done for a file and when it is modified?
// Index entries have a newline at the start as well as at the end to make it easier to recover from partial writes of an index entry
// If there is only one newline, then most likely the previous line is incomplete
// TODO: Instead of userID, should have an array of receiving steps like in email headers, to track how data gets pushed into system across distributed network

// "All" indexes are for all resources, all indexes, all journals, and all variables
// TODO: Add support for recording when a journal or variable is deleted

function makeTrace(timestamp, userID) {
    return '[{"timestamp":"' + timestamp + '","userID":' + JSON.stringify(userID) + '}]';
}

function addIndexEntryToAllIndexesIndex(response, allIndexShortFileName, indexName, randomUUID) {
    var fullAllIndexFileName = pointrelIndexesDirectory + allIndexShortFileName;

    createIndexFileIfMissing(fullAllIndexFileName, allIndexShortFileName, false);
    
    // Create special index entry for the allIndexes index
    var jsonForIndex = "\n" + '{"operation":"add","name":' + JSON.strinify(indexName) + ',"versionUUID":"' + randomUUID + '"}' + "\n";
    appendDataToFile(response, fullAllIndexFileName, jsonForIndex);
}

function createIndexFileIfMissing(response, fullIndexFileName, indexName, addToAllIndexesIndex) {
    if (!fs.existsSync(fullIndexFileName)) {
        var randomUUID = 'pointrelIndex:' + uuid.v4();
        var jsonForIndex = '{"indexFormat":"index","indexName":' + JSON.stringify(indexName) + ',"versionUUID":"' + randomUUID + '"}';
        var firstLineHeader = jsonForIndex + "\n";
        if (addToAllIndexesIndex) addIndexEntryToAllIndexesIndex(response, POINTREL_ALL_INDEXES_INDEX_FILE_NAME, indexName, randomUUID);
        createFile(response, fullIndexFileName, firstLineHeader);
    }    
}

function addResourceIndexEntryToIndex(response, fullIndexFileName, resourceURI, trace, encodedContent) {
    var resourceContentIfEmbedding;
    if (is_string(encodedContent) && encodedContent.length < pointrelIndexesEmbedContentSizeLimitInBytes) {
        resourceContentIfEmbedding = ',"xContent":"' + encodedContent + '"';
    } else {
        resourceContentIfEmbedding = "";
    }
    var jsonForIndex = "\n" + '{"operation":"add","name":"' + resourceURI + '","trace":' + trace + resourceContentIfEmbedding + '}' + "\n";
    appendDataToFile(response, fullIndexFileName, jsonForIndex);    
}

function createResourceIndexEntry(response, indexName, resourceURI, trace, encodedContent) {
    var shortFileNameForIndexName = sanitizeFileName(indexName);
    
    var hexDigits = md5(shortFileNameForIndexName);
    var createSubdirectories = true;
    var storagePath = calculateStoragePath(pointrelIndexesDirectory, hexDigits, VARIABLE_STORAGE_LEVEL_COUNT, VARIABLE_STORAGE_SEGMENT_LENGTH, createSubdirectories);
    var fullIndexFileName = storagePath + "index_" + hexDigits + "_" + shortFileNameForIndexName + '.pointrelIndex';
    
    createIndexFileIfMissing(fullIndexFileName, indexName, true);
    addResourceIndexEntryToIndex(response, fullIndexFileName, resourceURI, trace, encodedContent);
}

function addNewJournalToIndexes(response, journalName, header, timestamp, userID) {
    if (pointrelIndexesMaintain !== true) {
        return;
    }
    
    var shortFileNameForAllIndex = POINTREL_ALL_JOURNALS_INDEX_FILE_NAME;
    var fullAllIndexFileName = pointrelIndexesDirectory + shortFileNameForAllIndex;
    
    // This trace would get more complex for items received from other servers (similar to email received: headers)
    var trace = makeTrace(timestamp, userID);
    
    // TODO: Ideally should just do this once when install, not every time we add a journal
    createIndexFileIfMissing(response, fullAllIndexFileName, shortFileNameForAllIndex, false);
    
    var jsonForIndex = "\n" + '{"operation":"add","name":' + JSON.stringify(journalName) + ',"header":' + JSON.stringify(header) + ',"trace":' + trace + '}' + "\n";
    appendDataToFile(response, fullAllIndexFileName, jsonForIndex);
}

function removeJournalFromIndexes(response, journalName, header, timestamp, userID) {
    if (pointrelIndexesMaintain !== true) {
        return;
    }
    
    var shortFileNameForAllIndex = POINTREL_ALL_JOURNALS_INDEX_FILE_NAME;
    var fullAllIndexFileName = pointrelIndexesDirectory + shortFileNameForAllIndex;
    
    // This trace would get more complex for items received from other servers (similar to email received: headers)
    var trace = makeTrace(timestamp, userID);
    
    // TODO: Ideally should just do this once when install, not every time we add a journal
    createIndexFileIfMissing(response, fullAllIndexFileName, shortFileNameForAllIndex, false);
    
    var jsonForIndex = "\n" + '{"operation":"remove","name":' + JSON.stringify(journalName) + ',"header":' + JSON.stringify(header) + ',"trace":' + trace + '}' + "\n";
    appendDataToFile(response, fullAllIndexFileName, jsonForIndex);
}

function addNewVariableToIndexes(response, variableName, timestamp, userID) {
    if (pointrelIndexesMaintain !== true) {
        return;
    }
    
    var shortFileNameForAllIndex = POINTREL_ALL_VARIABLES_INDEX_FILE_NAME;
    var fullAllIndexFileName = pointrelIndexesDirectory + shortFileNameForAllIndex;
    
    // This trace would get more complex for items received from other servers (similar to email received: headers)
    var trace = makeTrace(timestamp, userID);
    
    // TODO: Ideally should just do this once when install, not every time we add a variable
    createIndexFileIfMissing(response, fullAllIndexFileName, shortFileNameForAllIndex, false);
    
    var jsonForIndex = "\n" + '{"operation":"add","name":' + JSON.stringify(variableName) + ',"trace":' + trace + '}' + "\n";
    appendDataToFile(response, fullAllIndexFileName, jsonForIndex);
}
    
function removeVariableFromIndexes(response, variableName, timestamp, userID) {
    if (pointrelIndexesMaintain !== true) {
        return;
    }
    
    var shortFileNameForAllIndex = POINTREL_ALL_VARIABLES_INDEX_FILE_NAME;
    var fullAllIndexFileName = pointrelIndexesDirectory + shortFileNameForAllIndex;
    
    // This trace would get more complex for items received from other servers (similar to email received: headers)
    var trace = makeTrace(timestamp, userID);
    
    // TODO: Ideally should just do this once when install, not every time we add a variable
    createIndexFileIfMissing(response, fullAllIndexFileName, shortFileNameForAllIndex, false);
    
    var jsonForIndex = "\n" + '{"operation":"remove","name":' + JSON.stringify(variableName) + ',"trace":' + trace + '}' + "\n";
    appendDataToFile(response, fullAllIndexFileName, jsonForIndex);
}

function addResourceToIndexes(response, resourceURI, timestamp, userID, content, encodedContent) {
    if (pointrelIndexesMaintain !== true) {
        return;
    }
    
    var shortFileNameForAllIndex = POINTREL_ALL_RESOURCES_INDEX_FILE_NAME;
    var fullAllIndexFileName = pointrelIndexesDirectory + shortFileNameForAllIndex;
    
    // This trace would get more complex for items received from other servers (similar to email received: headers)
    var trace = makeTrace(timestamp, userID);
    
    // TODO: Ideally should just do this once when install, not every time we add a resource
    createIndexFileIfMissing(response, fullAllIndexFileName, shortFileNameForAllIndex, false);
    
    // TODO: Implement recovery plan if fails while writing, like keeping resource in temp directory until finished indexing
    addResourceIndexEntryToIndex(response, fullAllIndexFileName, resourceURI, trace, encodedContent);
    
    // TODO: What kind of files to index? All JSON? Seem wasteful of CPU time and will strain memory.
    // So, only doing ones with ".pce.json", which are in effect "pieces" of a larger hyperdocument.
    // PCE could also be seen to stand for "Pointrel Content Engine".
    if (endsWith(resourceURI, ".pce.json")) {
        // echo "indexable; trying to decode json\n";
        // Do indexing
        var json = JSON.parse(content);
        // Error if array: echo "decoded into: 'json'\n";
        // echo "content: 'content'\n";
        if (json) {
            if (typeof json === "object") {
                // echo "trying to index\n";
                var indexing = json._pointrelIndexing;
                // echo "the array is: indexing";
                if (indexing && indexing instanceof Array) {
                    for (var i = 0; i < indexing.length; i++) {
                        var indexString = indexing[i];
                        // echo "Index on: indexString/n";
                        // Create index entry for item
                        createResourceIndexEntry(response, indexString, resourceURI, trace, encodedContent);
                    }
                } else {
                    // echo "No indexes\n";
                }
            } else {
                // json_printable = print_r(json, true);
                // echo "not array 'json_printable'\n";
            }
        }
    }
    // echo "Done indexing";

    if (pointrelIndexesCustomFunction !== null) {
        pointrelIndexesCustomFunction(resourceURI, timestamp, userID, content);
    }
}

//Handling CGI requests

function journalStore(request, response) {
	
    // if (pointrelRepositoryIsReadOnly) {
    // 	return exitWithJSONStatusMessage(response, "Writing is not currently allowed", NO_FAILURE_HEADER, 400);
    //}
    
    response.send('{"response": "journalStore Unfinished!!!!"}');
}

function resourceAdd(request, response) {
    var resourceURI = getCGIField(request, 'resourceURI');
    var encodedContent = getCGIField(request, 'resourceContent');
    var userID = getCGIField(request, 'userID');

    // For later use
    var session = getCGIField(request, 'session');
    // var authentication = getCGIField(request, 'authentication');

    var remoteAddress = getIPAddress(request);
    var timestamp = currentTimeStamp();
    var couldWriteLog = error_log(response, '{"timeStamp": "' + timestamp + '", "remoteAddress": "' + remoteAddress + '", "request": "resource-add", "resourceURI": "' + resourceURI + '", "userID": "' + userID + '", "session": "' + session + '"}' + "\n");
    if (!couldWriteLog) return false;

    if (exitIfCGIRequestMethodIsNotPost(request, response)) return false;

    if (!resourceURI) {
      return exitWithJSONStatusMessage(response, "No resourceURI was specified", SEND_FAILURE_HEADER, 400);
    }

    if (encodedContent === null) {
      return exitWithJSONStatusMessage(response, "No resourceContent was specified", SEND_FAILURE_HEADER, 400);
    }

    if (!userID) {
      return exitWithJSONStatusMessage(response, "No userID was specified", SEND_FAILURE_HEADER, 400);
    }
    
    if (pointrelRepositoryIsReadOnly) {
    	return exitWithJSONStatusMessage(response, "Writing is not currently allowed", NO_FAILURE_HEADER, 400);
    }

    var urlInfo = validateURIOrExit(response, resourceURI, NO_FAILURE_HEADER);
    var shortName = urlInfo.shortName;
    var hexDigits = urlInfo.hexDigits;
    var uriSpecifiedLength = urlInfo.length;

    // TODO -- confirm the content is converted correctly and then hashed correctly
    var content = new Buffer(encodedContent, "base64");
    var contentLength = content.length;
    var contentSHA256Actual = crypto.createHash("sha256").update(content).digest("hex");

    if (uriSpecifiedLength !== contentLength) {
        // for debugging -- send back content
        // return exitWithJSONStatusMessage(response, "Lengths do not agree from URI: uriSpecifiedLength and from content: contentLength with content: 'content''", NO_FAILURE_HEADER, 0);
        return exitWithJSONStatusMessage(response, "Lengths do not agree from URI: uriSpecifiedLength and from content: contentLength", NO_FAILURE_HEADER, 0);
    }

    if (hexDigits !== contentSHA256Actual) {
        return exitWithJSONStatusMessage(response, "SHA256 values do not agree from URI: hexDigits and computed from content: contentSHA256Actual", NO_FAILURE_HEADER, 0);
    }

    // TODO: Validate shortName is OK for files

    var createSubdirectories = true;
    var storagePath = calculateStoragePath(pointrelResourcesDirectory, hexDigits, RESOURCE_STORAGE_LEVEL_COUNT, RESOURCE_STORAGE_SEGMENT_LENGTH, createSubdirectories);
    var fullName = storagePath + shortName;

    if (fs.existsSync(fullName)) {
      return exitWithJSONStatusMessage(response, 'File already exists: "' + fullName + '"', NO_FAILURE_HEADER, 0);
    }

    // TODO; Is it good enough to create indexes before writing file, with the implication it is OK if an index entry can't be found or is corrupt?
    addResourceToIndexes(response, "pointrel://" + shortName, timestamp, userID, content, encodedContent);

    if (!createFile(response, fullName, content)) return false;

    // ??? header("Content-type: text/json; charset=UTF-8");
    response.send('{"status": "OK", "message": "Wrote ' + fullName + '"}');
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
    // var authentication = getCGIField(request, 'authentication');

    var remoteAddress = getIPAddress(request);

    var couldWriteLog = error_log(response, '{"timeStamp": "' + currentTimeStamp() + '", "remoteAddress": "' + remoteAddress + '", "request": "resource-get", "resourceURI": "' + resourceURI + '", "userID": "' + userID + '", "session": "' + session + '"}' + "\n");
    if (!couldWriteLog) return false;
    
    if (!resourceURI) {
        return exitWithJSONStatusMessage(response, "No resourceURI was specified", SEND_FAILURE_HEADER, 400);
    }

    if (!userID) {
        return exitWithJSONStatusMessage(response, "No userID was specified", SEND_FAILURE_HEADER, 400);
    }

    var urlInfo = validateURIOrExit(response, resourceURI, SEND_FAILURE_HEADER);
    if (urlInfo === false) return false;
    
    var shortName = urlInfo.shortName;
    var hexDigits = urlInfo.hexDigits;

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
    // console.log("about to sendFile", fullName);
    response.sendFile(fullName);
    return true;
}

function resourcePublish(request, response) {
    // Publish a resource to the static part of the website

    var resourceURI = getCGIField(request, 'resourceURI');
    var destinationURL = getCGIField(request, 'destinationURL');
    var userID = getCGIField(request, 'userID');

    // For later use
    var session = getCGIField(request, 'session');
    // var authentication = getCGIField(request, 'authentication');

    var remoteAddress = getIPAddress(request);

    var couldWriteLog = error_log(response, '{"timeStamp": "' + currentTimeStamp() + '", "remoteAddress": "' + remoteAddress + '", "request": "resource-publish", "resourceURI": "' + resourceURI + '", "destinationURL": "' + destinationURL + '", "userID": "' + userID + '", "session": "' + session + '"}' + "\n");
    if (!couldWriteLog) return false;
    
    if (exitIfCGIRequestMethodIsNotPost(request, response)) return false;

    if (pointrelPublishingAllow !== true) {
        return exitWithJSONStatusMessage(response, "Publishing not allowed", SEND_FAILURE_HEADER, 400);
    }

    if (!resourceURI) {
        return exitWithJSONStatusMessage(response, "No resourceURI was specified", SEND_FAILURE_HEADER, 400);
    }

    if (!destinationURL) {
        return exitWithJSONStatusMessage(response, "No destinationURL was specified", SEND_FAILURE_HEADER, 400);
    }

    if (destinationURL.indexOf("../") !== -1) {
        return exitWithJSONStatusMessage(response, "Destination URL may not have ../ in it", SEND_FAILURE_HEADER, 400);
    }

    if (!userID) {
        return exitWithJSONStatusMessage(response, "No userID was specified", SEND_FAILURE_HEADER, 400);
    }
    
    if (pointrelRepositoryIsReadOnly) {
    	return exitWithJSONStatusMessage(response, "Writing is not currently allowed", NO_FAILURE_HEADER, 400);
    }

    var urlInfo = validateURIOrExit(response, resourceURI, SEND_FAILURE_HEADER);
    var shortName = urlInfo.shortName;
    var hexDigits = urlInfo.hexDigits;

    var createSubdirectories = false;
    var storagePath = calculateStoragePath(pointrelResourcesDirectory, hexDigits, RESOURCE_STORAGE_LEVEL_COUNT, RESOURCE_STORAGE_SEGMENT_LENGTH, createSubdirectories);
    var fullName = storagePath + shortName;

    if (!fs.existsSync(fullName)) {
        return exitWithJSONStatusMessage(response, 'File does not exist: "' + fullName + '"', SEND_FAILURE_HEADER, 404);
    }

    var extension = getFileExtension(shortName);

    var destinationFileName = pointrelPublishingDirectory + destinationURL;

    if (!endsWith(destinationFileName, extension)) {
        return exitWithJSONStatusMessage(response, 'File "' + destinationFileName + '" does not end with the same extension "' + extension + '" as the resource: "' + shortName + '"', NO_FAILURE_HEADER, 404);
    }

    // Inspired by: http://stackoverflow.com/questions/1911382/sanitize-file-path-in-php
    // using call to expandPath to deal with relative paths
    var baseDir = path.resolve(pointrelPublishingDirectory);
    var desiredPath = path.resolve(destinationFileName);

    if (desiredPath.indexOf(baseDir) !== 0) {
        return exitWithJSONStatusMessage(response, 'File has an invalid path: "' + desiredPath + '"', NO_FAILURE_HEADER, 404);
    }

    // Overwritting .htaccess and .htpasswd should not be possible if these files are owned by root or a another webserver owner, but adding this as extra check

    // Disable overwriting the .htaccess file
    if (endsWith(desiredPath, ".htaccess")) {
        return exitWithJSONStatusMessage(response, 'File has an invalid path (2): "' + desiredPath + '"', NO_FAILURE_HEADER, 404);
    }

    // Disable overwriting the .htpasswd file
    if (endsWith(desiredPath, ".htpasswd")) {
        return exitWithJSONStatusMessage(response, 'File has an invalid path (3): "' + desiredPath + '"', NO_FAILURE_HEADER, 404);
    }

    if (!desiredPath) {
        return exitWithJSONStatusMessage(response, "The desiredPath 'desiredPath' is empty for destinationFileName 'destinationFileName' with baseDir 'baseDir'", NO_FAILURE_HEADER, 400);
    }

    var targetDirectory = path.dirname(desiredPath);

    // ensure intermediate directories exist
    try {
        fsExtra.ensureDirSync(targetDirectory, "0777");
    } catch (err) {
        response.send('{"status": "FAILED", "message": "Could not create directories needed for "' + desiredPath + '"}');
    }

    try {
        fsExtra.copySync(fullName, desiredPath);
    } catch (err) {
        response.send('{"status": "FAILED", "message": "Could not copy ' + fullName + ' to: ' + desiredPath + '"}');
    }

    // ??? header("Content-type: text/json; charset=UTF-8");
    response.send('{"status": "OK", "message": "Copied ' + fullName + ' to: ' + desiredPath + '"}');
}

function successfulVariableOperation(response, operation, variableName, variableValueAfterOperation) {
    // ??? header("Content-type: text/json; charset=UTF-8");
    response.send('{"status": "OK", "message": "Successful operation: ' + operation + '", "variable": "' + variableName + '", "currentValue": "' + variableValueAfterOperation + '"}');
    return true;
}

function writeVariableToNewFile(response, fullVariableFileName, newValue) {
    try {
        fs.writeFileSync(fullVariableFileName, newValue, "utf8");
    } catch(err) {
        return exitWithJSONStatusMessage(response, "Could not create variable file: '" + fullVariableFileName + '"', NO_FAILURE_HEADER, 500);
    }
    return true;
}

function variableQuery(request, response) {
    // console.log("variableQuery", request.url, request.body);
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
    // var authentication = getCGIField(request, 'authentication');

    // Default createIfMissing to true unless explicitly set to false
    if (createIfMissing === "f" || createIfMissing === "false" || createIfMissing === "F" || createIfMissing === "FALSE") {
        createIfMissing = false;
    } else {
        createIfMissing = true;
    }
    
    var remoteAddress = getIPAddress(request);
    var logTimeStamp = currentTimeStamp();
    var couldWriteLog = error_log(response, '{"timeStamp": "' + logTimeStamp + '", "remoteAddress": "' + remoteAddress + '", "request": "variable-change", "variableName": "' + variableName + '", "operation": "' + operation + '", "newValue": "' + newValue + '", "currentValue": "' + currentValue + '", "userID": "' + userID + '", "session": "' + session + '"}' + "\n");
    if (!couldWriteLog) return false;
    
    if (pointrelVariablesAllow !== true) {
        return exitWithJSONStatusMessage(response, "Variables not allowed", SEND_FAILURE_HEADER, 400);
    }

    if (operation === null) {
        return exitWithJSONStatusMessage(response, "No operation was specified", NO_FAILURE_HEADER, 400);
    }

    var operations = {"exists": 1, "new": 2, "delete": 2, "get": 1, "set": 2, "query": 1};
    if (!(operation in operations)) {
        return exitWithJSONStatusMessage(response, "Unsupported operation: '" + operation + "'", NO_FAILURE_HEADER, 400);
    }
    
    if (pointrelRepositoryIsReadOnly && operations[operation] === 2) {
    	return exitWithJSONStatusMessage(response, "Writing is not currently allowed", NO_FAILURE_HEADER, 400);
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
    
    var shortFileNameForVariableName = sanitizeFileName(variableName);

    var hexDigits = md5(shortFileNameForVariableName);

    var createSubdirectories = (operation === "new") || (operation === "set" && currentValue === "");
    if (createSubdirectories) {
        if (exitIfCGIRequestMethodIsNotPost(request, response)) return false;
    }

    var storagePath = calculateStoragePath(pointrelVariablesDirectory, hexDigits, VARIABLE_STORAGE_LEVEL_COUNT, VARIABLE_STORAGE_SEGMENT_LENGTH, createSubdirectories);

    var fullVariableFileName = storagePath + "variable_" + hexDigits + "_" + shortFileNameForVariableName + '.txt';
    var variableValueAfterOperation = "ERROR";
    var contents = "";
    
    if (operation === "exists") {
        if (fs.existsSync(fullVariableFileName)) {
            // TODO: Can't replace this one because it has OK
            return response.send('{"status": "OK", "message": "Variable file exists: ' + fullVariableFileName + '"}');
        }
        return exitWithJSONStatusMessage(response, "Variable file does not exist: '" + fullVariableFileName + "'", NO_FAILURE_HEADER, 0);
    } else if (operation === "new") {
        if (exitIfCGIRequestMethodIsNotPost(request, response)) return false;
        
        if (fs.existsSync(fullVariableFileName)) {
            return exitWithJSONStatusMessage(response, "Variable file already exists: '" + fullVariableFileName + "'", NO_FAILURE_HEADER, 400);
        }
        if (!validateURIOrExit(response, newValue, NO_FAILURE_HEADER)) return false;

        addNewVariableToIndexes(response, variableName, logTimeStamp, userID);
        if (!writeVariableToNewFile(response, fullVariableFileName, newValue)) return false;
        variableValueAfterOperation = newValue;
        return successfulVariableOperation(response, operation, variableName, variableValueAfterOperation);
    } else if (operation === "delete") {
        // Code here is more reliable than PHP since we know the entire server is running in a single thread here and so can't be interrupted...
        // So do not need to write "DELETE" to file before removing
          if (exitIfCGIRequestMethodIsNotPost(request, response)) return false;
        
        if (pointrelVariablesDeleteAllow !== true) {
            return exitWithJSONStatusMessage(response, "Variables delete not allowed", SEND_FAILURE_HEADER, 400);
        }
        
        if (!validateFileExistsOrExit(response, fullVariableFileName)) return false;
        if (!validateURIOrExit(response, currentValue, NO_FAILURE_HEADER)) return false;
        
        try {
            contents = fs.readFileSync(fullVariableFileName, "utf8");
        } catch (err) {
            console.log("file read error", err);
            return exitWithJSONStatusMessage(response, "Variables file could not be opened to confirm value", SEND_FAILURE_HEADER, 400);
        }

        if (contents !== currentValue) {
            return exitWithJSONStatusMessage(response, "Variable value was changed by another user to (1): " + contents, NO_FAILURE_HEADER, 409);
        }
        try {
            fs.unlinkSync(fullVariableFileName);
        } catch (err) {
            console.log("file unlink error", err);
            return exitWithJSONStatusMessage(response, "Variables file could not be removed for some reason", SEND_FAILURE_HEADER, 400);
        }            
        // TODO: Perhaps should return JSON null, not a string?
        variableValueAfterOperation = "DELETED";
        removeVariableFromIndexes(response, variableName, logTimeStamp, userID);
        return successfulVariableOperation(response, operation, variableName, variableValueAfterOperation);
    } else if (operation === "set") {
        if (exitIfCGIRequestMethodIsNotPost(request, response)) return false;
        
        if (currentValue !== "" && !validateURIOrExit(response, currentValue, NO_FAILURE_HEADER)) return false;
        if (newValue !== "" && !validateURIOrExit(response, newValue, NO_FAILURE_HEADER)) return false;
        if (!fs.existsSync(fullVariableFileName)) {
            // Maybe create the file if it does not exists
            if (createIfMissing === false) {
                // TODO: Can't replace this as it has extra fields beyond message
                return response.send('{"status": "FAIL", "message": "Variable file does not exist and createIfMissing is false: ' + fullVariableFileName + '", "createIfMissing": "' + createIfMissing + '", "currentValue": "' + currentValue + '"}');
            } else if (currentValue !== "") {
                // TODO: Can't replace this as it has extra fields beyond message
                return response.send('{"status": "FAIL", "message": "Variable file does not exist and currentValue is not empty: ' + fullVariableFileName + '", "createIfMissing": "' + createIfMissing + '", "currentValue": "' + currentValue + '"}');
            } else {
                // TODO: Window of vulnerability where another user could create the file???
                // Not vulnerable under NodeJS if just one process -- but what if more processes?
                addNewVariableToIndexes(response, variableName, logTimeStamp, userID);
                if (!writeVariableToNewFile(response, fullVariableFileName, newValue)) return false;
                variableValueAfterOperation = newValue;
            }
        } else {
            try {
                contents = fs.readFileSync(fullVariableFileName, "utf8");
            } catch (err) {
                console.log("file read error", err);
                return response.send('{"status": "FAIL", "message": "Could not open file for updating: ' + fullVariableFileName + '"}');
            }
            if (contents !== currentValue) {
                // header("HTTP/1.1 409 Variable value was changed by another user to: " + contents);
                return response.send('{"status": "FAIL", "message": "Variable value was changed by another user to (2): ' + contents + '", "currentValue": "' + contents + '"}');
            }
            if (!writeVariableToNewFile(response, fullVariableFileName, newValue)) return false;
            variableValueAfterOperation = newValue;
        }
        return successfulVariableOperation(response, operation, variableName, variableValueAfterOperation);
    } else if (operation === "get") {
        if (!validateFileExistsOrExit(response, fullVariableFileName)) {
            return false;
        }
        fs.readFile(fullVariableFileName, "utf8", function (err, data) {
            if (err) {
                return exitWithJSONStatusMessage(response, "Could not read variable file: " + fullVariableFileName, SEND_FAILURE_HEADER, 500);
            }
            variableValueAfterOperation = data;
            // console.log("variableValueAfterOperation", variableValueAfterOperation);
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
    return false;
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
    response.sendFile(baseDirectoryNormalized + "index.html");
});

app.get("/index.html", function (request, response) {
    response.sendFile(baseDirectoryNormalized + "index.html");
});

app.get("/pointrel/pointrel-app/server/journal-store.php", function (request, response) {
    journalStore(request, response);
});

app.post("/pointrel/pointrel-app/server/journal-store.php", function (request, response) {
    journalStore(request, response);
});

app.get("/pointrel/pointrel-app/server/resource-add.php", function (request, response) {
    resourceAdd(request, response);
});

app.post("/pointrel/pointrel-app/server/resource-add.php", function (request, response) {
    resourceAdd(request, response);
});

app.get("/pointrel/pointrel-app/server/resource-get.php", function (request, response) {
    resourceGet(request, response);
});

app.post("/pointrel/pointrel-app/server/resource-get.php", function (request, response) {
    resourceGet(request, response);
});

app.get("/pointrel/pointrel-app/server/resource-publish.php", function (request, response) {
    resourcePublish(request, response);
});

app.post("/pointrel/pointrel-app/server/resource-publish.php", function (request, response) {
    resourcePublish(request, response);
});

app.get("/pointrel/pointrel-app/server/variable-query.php", function (request, response) {
    variableQuery(request, response);
});

app.post("/pointrel/pointrel-app/server/variable-query.php", function (request, response) {
    variableQuery(request, response);
});

app.use("/pointrel", express.static(__dirname + "/../pointrel"));

var server = app.listen(8080, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log("Pointrel20130202 app listening at http://%s:%s", host, port);
});