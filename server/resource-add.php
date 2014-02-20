<?php
include "pointrel_utils.php";

$resourceURI = getPost('resourceURI');
$encodedContent = getPost('resourceContent');
$userID = getPost('userID');

// For later use
$session = getPost('session');
$authentication = getPost('authentication');

$remoteAddress = $_SERVER['REMOTE_ADDR'];

error_log('{"timeStamp": "' . currentTimeStamp() . '", "remoteAddress": "' . $remoteAddress . '", "request": "resource-add", "resourceURI": "' . $resourceURI . '", "userID": "' . $userID . '", "session": "' . $session . '"}' . "\n", 3, $fullLogFileName);

if (empty($resourceURI)) {
  exitWithJSONStatusMessage("No resourceURI was specified", SEND_FAILURE_HEADER, 400);
}

if (!array_key_exists('resourceContent', $_POST)) {
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

if ($uriSpecifiedLength != $contentLength) {
    // for debugging -- send back content
    // exitWithJSONStatusMessage("Lengths do not agree from URI: $uriSpecifiedLength and from content: $contentLength with content: '$content''", NO_FAILURE_HEADER, 0);
    exitWithJSONStatusMessage("Lengths do not agree from URI: $uriSpecifiedLength and from content: $contentLength", NO_FAILURE_HEADER, 0);
}

$createSubdirectories = true;
$storagePath = calculateStoragePath($pointrelResourcesDirectory, $hexDigits, RESOURCE_STORAGE_LEVEL_COUNT, RESOURCE_STORAGE_SEGMENT_LENGTH, $createSubdirectories);
$fullName = $storagePath . $shortName;

if (file_exists($fullName)) {
  exitWithJSONStatusMessage('File already exists: "' . $fullName . '"', NO_FAILURE_HEADER, 0);
}

$fp = fopen($fullName, 'w');

if (!$fp) {
  exitWithJSONStatusMessage('File could not be opened for writing: "' . $fullName . '"', NO_FAILURE_HEADER, 0);
}

fwrite($fp, $content);
fclose($fp);

// ??? header("Content-type: text/json; charset=UTF-8");
echo '{"status": "OK", "message": "Wrote ' . $fullName . '"}';