<?php
// Publish a resource to the static part of the website

include "pointrel_utils.php";

$resourceURI = $_POST['resourceURI'];
$destinationURL = $_POST['destinationURL'];
$userID = $_POST['userID'];

// For later use
$session = $_POST['session'];
$authentication = $_POST['authentication'];

$remoteAddress = $_SERVER['REMOTE_ADDR'];

error_log('{"timeStamp": "' . currentTimeStamp() . '", "remoteAddress": "' . $remoteAddress . '", "request": "resource-publish", "resourceURI": "' . $resourceURI . '", "destinationURL": "' . $destinationURL . '", "userID": "' . $userID . '", "session": "' . $session . '"}' . "\n", 3, $fullLogFileName);

if (empty($resourceURI)) {
    exitWithJSONStatusMessage("No resourceURI was specified", SEND_FAILURE_HEADER, 400);
}

if (empty($destinationURL)) {
    exitWithJSONStatusMessage("No destinationURL was specified", SEND_FAILURE_HEADER, 400);
}

if (strstr($destinationURL, "../")) {
    exitWithJSONStatusMessage("Destination URL may not have ../ in it", SEND_FAILURE_HEADER, 400);
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

$extension = getFileExtension($shortName);

$destinationFileName = $pointrelPublishingDirectory . $destinationURL;

if (!endsWith($destinationFileName, $extension)) {
    exitWithJSONStatusMessage('File "' . $destinationFileName . '" does not end with the same extension "' . $extension . '" as the resource: "' . $shortName . '"', NO_FAILURE_HEADER, 404);
}

$baseDir = realpath($pointrelPublishingDirectory);
$desiredPath = normpath($destinationFileName);
// if baseDir isn't at the front 0==strpos, most likely hacking attempt
if (strpos($desiredPath, $baseDir)) {
    exitWithJSONStatusMessage('File has an invalid path: "' . $desiredPath . '"', NO_FAILURE_HEADER, 404);
}

// Overwritting .htaccess and .htpasswd should not be possible if these files are owned by root or a another webserver owner, but adding this as extra check

// Disable overwriting the .htaccess file
if (endsWith($desiredPath, ".htaccess")) {
	exitWithJSONStatusMessage('File has an invalid path (2): "' . $desiredPath . '"', NO_FAILURE_HEADER, 404);
}

// Disable overwriting the .htpasswd file
if (endsWith($desiredPath, ".htpasswd")) {
	exitWithJSONStatusMessage('File has an invalid path (3): "' . $desiredPath . '"', NO_FAILURE_HEADER, 404);
}

if (empty($desiredPath)) {
    exitWithJSONStatusMessage("The desiredPath '$desiredPath' is empty for destinationFileName '$destinationFileName' with baseDir '$baseDir'", NO_FAILURE_HEADER, 400);
}

$copyResult = copy($fullName, $desiredPath);

if (!$copyResult) {
    echo '{"status": "FAILED", "message": "Could not copy ' . $fullName . ' to: ' . $desiredPath . '"}';
} else {
    // ??? header("Content-type: text/json; charset=UTF-8");
    echo '{"status": "OK", "message": "Copied ' . $fullName . ' to: ' . $desiredPath . '"}';
}