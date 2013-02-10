<?php

$directory = "../pointrel-data/resources";
$log = "../pointrel-data/logs/" . gmdate("Y-m-d") . ".log";

function quiet_mkdir($path) {
  if (is_dir($path)) return;
  if (!mkdir($path)) {
    die("could not make directory " . $path);
  }
}

$resourceURI = $_POST['resourceURI'];
$content = $_POST['resourceContent'];
$userID = $_POST['userID'];

if(get_magic_quotes_gpc()) $content = stripslashes($content);

// For later use
$session = $_POST['session'];
$authentication = $_POST['authentication'];

$timeStamp = gmdate('Y-m-d\TH:i:s\Z');
error_log('{"timeStamp": "' . $timeStamp . '", "request": "resource-add", "resourceURI": "' . $resourceURI . '", "userID": "' . $userID . '", "session": "' . $session . '"}' . "\n", 3, $log);

if (empty($resourceURI)) {
  header("HTTP/1.1 400 resourceURI not specified");
  die('{"status": "FAIL", "message": "No resourceURI was specified"}');
}

if (!array_key_exists('resourceContent', $_POST)) {
  header("HTTP/1.1 400 resourceContent not specified");
  die('{"status": "FAIL", "message": "No resourceContent was specified"}');
}

if (empty($userID)) {
  header("HTTP/1.1 400 userID not specified");
  die('{"status": "FAIL", "message": "No userID was specified"}');
}

$pointrelAndRest = explode("//", $resourceURI, 2);
$shortName = $pointrelAndRest[1];

if ($pointrelAndRest[0] != "pointrel:") {
  die('{"status": "FAIL", "message": "Does not start with pointrel://"}');
}

// sha256_HEX_SIZE.extension
$shaAndRest = explode("_", $shortName, 3);

if ($shaAndRest[0] != "sha256") {
  die('{"status": "FAIL", "message": "Does not use sha256"}');
}

$hexDigits = $shaAndRest[1];

if (strlen($hexDigits) != 64) {
  die('{"status": "FAIL", "message": "Does have 64 sha256 characters for: ' . $hexDigits . '"}');
}

$lengthAndRest = explode(".", $shaAndRest[2]);
$uriSpecifiedLength = intval($lengthAndRest[0]);
$contentLength = strlen($content);

if ($uriSpecifiedLength != $contentLength) {
  die('{"status": "FAIL", "message": "Lengths do not agree from URI: ' . $uriSpecifiedLength . ' derived from: \'' . $lengthAndRest[0] . '\' and from content: ' . $contentLength . ' for content: \'' . $content . '\'"}');
}

// TODO: Verify SHA256 of content

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

// TODO: sanitize extension

$fullName = $directory . "/" . $d1 . "/" . $d2 . "/" . $d3 . "/" . $d4 . "/" . $shortName;

if (file_exists($fullName)) {
  die('{"status": "OK", "message": "File already exists: ' . $fullName . '"}');
}

// Make the directories if needed
quiet_mkdir($directory . "/" . $d1);
quiet_mkdir($directory . "/" . $d1 . "/" . $d2);
quiet_mkdir($directory . "/" . $d1 . "/" . $d2 . "/" . $d3);
quiet_mkdir($directory . "/" . $d1 . "/" . $d2 . "/" . $d3 . "/" . $d4);

$fp = fopen($fullName, 'w');

if (!$fp) {
  die('{"status": "FAIL", "message": "File could not be opened for writing: \'' . $fullName . '\'"}');
}

fwrite($fp, $content);
fclose($fp);

echo '{"status": "OK", "message": "Wrote ' . $fullName . '"}';