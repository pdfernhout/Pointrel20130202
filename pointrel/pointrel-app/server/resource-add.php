<?php
include "pointrel_utils.php";

$resourceURI = getCGIField('resourceURI');
$encodedContent = getCGIField('resourceContent');
$userID = getCGIField('userID');

// For later use
$session = getCGIField('session');
$authentication = getCGIField('authentication');

$remoteAddress = $_SERVER['REMOTE_ADDR'];

$timestamp = currentTimeStamp();
error_log('{"timeStamp": "' . $timestamp . '", "remoteAddress": "' . $remoteAddress . '", "request": "resource-add", "resourceURI": "' . $resourceURI . '", "userID": "' . $userID . '", "session": "' . $session . '"}' . "\n", 3, $fullLogFileName);

exitIfCGIRequestMethodIsNotPost();

if (empty($resourceURI)) {
  exitWithJSONStatusMessage("No resourceURI was specified", SEND_FAILURE_HEADER, 400);
}

if ($encodedContent === null) {
  exitWithJSONStatusMessage("No resourceContent was specified", SEND_FAILURE_HEADER, 400);
}

if (empty($userID)) {
  exitWithJSONStatusMessage("No userID was specified", SEND_FAILURE_HEADER, 400);
}

$urlInfo = validateURIOrExit($resourceURI, NO_FAILURE_HEADER);
$shortName = $urlInfo["shortName"];
$hexDigits = $urlInfo["hexDigits"];
$uriSpecifiedLength = $urlInfo["length"];

$content = base64_decode($encodedContent);
$contentLength = strlen($content);
$contentSHA256Actual = hash("sha256", $content);

if ($uriSpecifiedLength != $contentLength) {
    // for debugging -- send back content
    // exitWithJSONStatusMessage("Lengths do not agree from URI: $uriSpecifiedLength and from content: $contentLength with content: '$content''", NO_FAILURE_HEADER, 0);
    exitWithJSONStatusMessage("Lengths do not agree from URI: $uriSpecifiedLength and from content: $contentLength", NO_FAILURE_HEADER, 0);
}

if ($hexDigits !== $contentSHA256Actual) {
	exitWithJSONStatusMessage("SHA256 values do not agree from URI: $hexDigits and computed from content: $contentSHA256Actual", NO_FAILURE_HEADER, 0);
}

// TODO: Validate shortName is OK for files

$createSubdirectories = true;
$storagePath = calculateStoragePath($pointrelResourcesDirectory, $hexDigits, RESOURCE_STORAGE_LEVEL_COUNT, RESOURCE_STORAGE_SEGMENT_LENGTH, $createSubdirectories);
$fullName = $storagePath . $shortName;

if (file_exists($fullName)) {
  exitWithJSONStatusMessage('File already exists: "' . $fullName . '"', NO_FAILURE_HEADER, 0);
}

// TODO; Is it good enough to create indexes before writing file, with the implication it is OK if an index entry can't be found or is corrupt?
addResourceToIndexes("pointrel://" . $shortName, $timestamp, $userID, $content, $encodedContent);

$fp = fopen($fullName, 'w');

if (!$fp) {
  exitWithJSONStatusMessage('File could not be opened for writing: "' . $fullName . '"', NO_FAILURE_HEADER, 0);
}

fwrite($fp, $content);
fclose($fp);

// ??? header("Content-type: text/json; charset=UTF-8");
echo '{"status": "OK", "message": "Wrote ' . $fullName . '"}';