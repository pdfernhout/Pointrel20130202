<?php

$directory = "../pointrel-data/resources";
$log = "../pointrel-data/logs/" . gmdate("Y-m-d") . ".log";

$resourceURI = $_GET['resourceURI'];
$userID = $_GET['userID'];

// For later use
$session = $_POST['session'];
$authentication = $_POST['authentication'];

$timeStamp = gmdate('Y-m-d\TH:i:s\Z');
error_log('{"timeStamp": "' . $timeStamp . '", "request": "resource-get", "resourceURI": "' . $resourceURI . '", "userID": "' . $userID . '", "session": "' . $session . '"}' . "\n", 3, $log);

if (empty($resourceURI)) {
  header("HTTP/1.1 400 resourceURI not specified");
  die('{"status": "FAIL", "message": "No resourceURI was specified"}');
}

if (empty($userID)) {
  header("HTTP/1.1 400 userID not specified");
  die('{"status": "FAIL", "message": "No userID was specified"}');
}

$pointrelAndRest = explode("//", $resourceURI, 2);
$shortName = $pointrelAndRest[1];

if (empty($userID)) {
  header("HTTP/1.1 400 userID not specified");
  die('{"status": "FAIL", "message": "No userID was specified"}');
}

if ($pointrelAndRest[0] != "pointrel:") {
  header("HTTP/1.1 406 URI does not start with pointrel://");
  die('{"status": "FAIL", "message": "URI does not start with pointrel://"}');
}

// sha256_HEX_SIZE.extension
$shaAndRest = explode("_", $shortName, 3);

if ($shaAndRest[0] != "sha256") {
  header("HTTP/1.1 406 URI does not use sha256");
  die('{"status": "FAIL", "message": "URI does not use sha256"}');
}

$hexDigits = $shaAndRest[1];

if (strlen($hexDigits) != 64) {
  header("HTTP/1.1 406 URI  does have 64 sha256 characters for: " . $hexDigits);
  die('{"status": "FAIL", "message": "Does have 64 sha256 characters for: ' . $hexDigits . '"}');
}

// TODO: sanitize extension or entire file name

$d1 = substr($hexDigits, 0, 2);
$d2 = substr($hexDigits, 2, 2);
$d3 = substr($hexDigits, 4, 2);
$d4 = substr($hexDigits, 6, 2);

$dotPosition = strpos($shortName, '.');
if ($dotPosition === false) {
  $extension = "_no_extension_";
} else {
  // TODO: escape extension
  $extension = substr($shortName, $dotPosition + 1);
}

$fullName = $directory . "/" . $d1 . "/" . $d2 . "/" . $d3 . "/" . $d4 . "/" . $shortName;

if (!file_exists($fullName)) {
  header("HTTP/1.1 404 File does not exist: ' . $fullName . '");
  die('{"status": "FAIL", "message": "File does not exists: ' . $fullName . '"}');
}

readfile($fullName);