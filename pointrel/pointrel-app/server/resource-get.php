<?php
include "pointrel_utils.php";

// Example: http://localhost/~pdf/pointrel-app/resource-get.php?userID=anonymous&resourceURI=pointrel://sha256_a2ca24b424919216bdf441301d65fd83215562891a2bd2195984313a26f04029_12466.txt&contentType=text/plain&charset=UTF-8

$resourceURI = getGet('resourceURI');
$userID = getGet('userID');
$contentType = getGet('contentType');
$charset = getGet('charset');
$attachmentName = getGet('attachmentName');

// For later use
$session = getPost('session');
$authentication = getPost('authentication');

$remoteAddress = $_SERVER['REMOTE_ADDR'];

error_log('{"timeStamp": "' . currentTimeStamp() . '", "remoteAddress": "' . $remoteAddress . '", "request": "resource-get", "resourceURI": "' . $resourceURI . '", "userID": "' . $userID . '", "session": "' . $session . '"}' . "\n", 3, $fullLogFileName);

if (empty($resourceURI)) {
    exitWithJSONStatusMessage("No resourceURI was specified", SEND_FAILURE_HEADER, 400);
}

if (empty($userID)) {
    exitWithJSONStatusMessage("No userID was specified", SEND_FAILURE_HEADER, 400);
}

$urlInfo = validateURIOrExit($resourceURI, SEND_FAILURE_HEADER);
$shortName = $urlInfo["shortName"];
$hexDigits = $urlInfo["hexDigits"];

$createSubdirectories = false;
$storagePath = calculateStoragePath($pointrelResourcesDirectory, $hexDigits, RESOURCE_STORAGE_LEVEL_COUNT, RESOURCE_STORAGE_SEGMENT_LENGTH, $createSubdirectories);
$fullName = $storagePath . $shortName;

if (!file_exists($fullName)) {
    exitWithJSONStatusMessage('File does not exist: "' . $fullName . '"', SEND_FAILURE_HEADER, 404);
}

// TODO: mime_content_type has been deprecated for later versions of PHP -- check and use replacement?
if (empty($contentType)) $contentType = mime_content_type($fullName);
if (empty($contentType)) $contentType = "text/plain";
if (empty($charset)) $charset = "utf-8";

header("Content-type: " . $contentType . "; charset=" . $charset);
if ($attachmentName) header('Content-Disposition: attachment; filename="' . $attachmentName . '"');
readfile($fullName);