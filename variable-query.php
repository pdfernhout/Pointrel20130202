<?php

// recursively strip slashes from an array to deal with "magic quotes"
function stripslashes_r($array) {
    foreach ($array as $key => $value) {
        $array[$key] = is_array($value) ?
            stripslashes_r($value) :
            stripslashes($value);
    }
    return $array;
}

if (get_magic_quotes_gpc()) {
    $_GET     = stripslashes_r($_GET);
    $_POST    = stripslashes_r($_POST);
    $_COOKIE  = stripslashes_r($_COOKIE);
    $_REQUEST = stripslashes_r($_REQUEST);
}

$directory = "../pointrel-data/variables";
$log = "../pointrel-data/logs/" . gmdate("Y-m-d") . ".log";

function validateURI($name) {
  // TODO: Sanitize error messages as they repeat user input
  $pointrelAndRest = explode("//", $name, 2);
  $shortName = $pointrelAndRest[1];

  // TODO: Check it does not have a third segment

  if ($pointrelAndRest[0] != "pointrel:") {
    // header("HTTP/1.1 406 URI does not start with pointrel://");
    die('{"status": "FAIL", "message": "URI does not start with pointrel://"}');
  }

  if (count($pointrelAndRest) != 2) {
     die('{"status": "FAIL", "message": "URI is malformed with extra "//""}');
  }


    // sha256_HEX_SIZE.extension
  $shaAndRest = explode("_", $shortName, 3);

  if ($shaAndRest[0] != "sha256") {
    // header("HTTP/1.1 406 URI does not use sha256");
    die('{"status": "FAIL", "message": "URI does not use sha256"}');
  }

  $hexDigits = $shaAndRest[1];

  if (strlen($hexDigits) != 64) {
    // header("HTTP/1.1 406 URI does have 64 sha256 characters for: " . $hexDigits);
    die('{"status": "FAIL", "message": "URI does have 64 sha256 characters for: ' . $hexDigits . '"}');
  }

  // TODO: Make sanitization stricter hexDigits, size, and probably also for extension
  if (strpos($shortName, "/") !== false || strpos($shortName, "'") !== false || strpos($shortName, '"') !== false) {
    die('{"status": "FAIL", "message": "Bad characters in URI: ' . $shortName . '"}');
  }  
}

function validateFileExists($fullVariableFileName) {
  if (!file_exists($fullVariableFileName)) {
    // header("HTTP/1.1 400 Variable file does not exist: " . $fullVariableFileName);
    die('{"status": "FAIL", "message": "Variable file does not exist: ' . $fullVariableFileName . '", "currentValue": null}');
  }
}

function writeVariableToNewFile($fullVariableFileName, $newValue) {
  $fh = fopen($fullVariableFileName, 'w');
  if (!$fh) {
    // header("HTTP/1.1 500 Could not create file");
    die('{"status": "FAIL", "message": "Could not create variable file: ' . $fullVariableFileName . '"}');
  }
  fwrite($fh, $newValue);
  fclose($fh);
}

// Buffer should be big enough for version info...
$MaximumVariableVersionBufferSize = 8192;

$variableName = $_POST['variableName'];
$operation = $_POST['operation'];
$createIfMissing = $_POST['createIfMissing'];
$operation = $_POST['operation'];
$newValue = $_POST['newValue'];
$currentValue = $_POST['currentValue'];
$userID = $_POST['userID'];

// For later use
$session = $_POST['session'];
$authentication = $_POST['authentication'];

// Default createIfMissing to true unless explicitly set to false
if ($createIfMissing == "f" || $createIfMissing == "false" || $createIfMissing == "F" || $createIfMissing == "FALSE") {
  $createIfMissing = FALSE;
} else {
  $createIfMissing = TRUE;
}

$remoteAddress = $_SERVER['REMOTE_ADDR'];

$timeStamp = gmdate('Y-m-d\TH:i:s\Z');
error_log('{"timeStamp": "' . $timeStamp . '", "remoteAddress": "' . $remoteAddress . '", "request": "variable-change", "variableName": "' . $variableName . '", "operation": "' . $operation . '", "newValue": "' . $newValue . '", "currentValue": "' . $currentValue . '", "userID": "' . $userID . '", "session": "' . $session . '"}' . "\n", 3, $log);

if (!array_key_exists('operation', $_POST)) {
  // header("HTTP/1.1 400 operation not specified");
  die('{"status": "FAIL", "message": "No operation was specified"}');
}

$operations = array("exists", "new", "delete", "get", "set", "query");
if (!in_array($operation, $operations)) {
  // header("HTTP/1.1 400 Unsupported operation: '" . $operation . "'");
  die('{"status": "FAIL", "message": "Unsupported operation: ' . $operation . '"}');
}

if (empty($userID)) {
  // header("HTTP/1.1 400 userID not specified");
  die('{"status": "FAIL", "message": "No userID was specified"}');
}

if (empty($variableName)) {
  header("HTTP/1.1 400 variableName not specified");
  die('{"status": "FAIL", "message": "No variableName was specified"}');
}

// TODO: maybe better sanitize variable name perhaps by making it into hash and then can store many of them in nested directories similar to resources? 
// But then could nto easily see variable name (pros and cons)?
// From: http://stackoverflow.com/questions/2668854/sanitizing-strings-to-make-them-url-and-filename-safe
// but changed to change dots to underscores
$shortFileNameForVariableName = preg_replace(array('/\s/', '/\.[\.]+/', '/[^\w_\.\-]/'), array('_', '_', '_'), $variableName);

$fullVariableFileName = $directory . "/" . 'variable_' . $shortFileNameForVariableName . '.txt';
$variableValueAfterOperation = "ERROR";

if ($operation == "exists") {
  if (file_exists($fullVariableFileName)) {
    die('{"status": "OK", "message": "Variable file exists: ' . $fullVariableFileName . '"}');
  }
  die('{"status": "FAIL", "message": "Variable file does not exist: ' . $fullVariableFileName . '"}');
}

if ($operation == "new") {
  if (file_exists($fullVariableFileName)) {
    // header("HTTP/1.1 400 Variable already exists " . $fullVariableFileName);
    die('{"status": "FAIL", "message": "Variable file already exists: ' . $fullVariableFileName . '"}');
  }
  validateURI($newValue);
  writeVariableToNewFile($fullVariableFileName, $newValue);
  $variableValueAfterOperation = $newValue;
}

if ($operation == "delete") {
  validateFileExists($fullVariableFileName);
  validateURI($currentValue);
  $fh = fopen($fullVariableFileName, 'r+');
  $contents = fread($fh, 8192);
  if ($contents != $currentValue) {
    fclose($fh);
    // header("HTTP/1.1 409 Variable value was changed by another user to: " . $contents);
    die('{"status": "FAIL", "message": "Variable value was changed by another user to: ' . $contents . '"}');
  }
  fseek($fh, 0);
  // Temporarily set value to delete to prevent other process updating it
  fwrite($fh, "DELETED");
  ftruncate($fh, strlen("DELETED"));
  fclose($fh);
  unlink($fullVariableFileName);
  // TODO: Perhaps should return JSON null, not a string?
  $variableValueAfterOperation = "DELETED";
}

if ($operation == "set") {
  if ($currentValue !== "") validateURI($currentValue);
  if ($newValue !== "") validateURI($newValue);
  if (!file_exists($fullVariableFileName)) {
    // Maybe create the file if it does not exists
    if ($createIfMissing === FALSE) {
      die('{"status": "FAIL", "message": "Variable file does not exist and createIfMissing is false: ' . $fullVariableFileName . '", "createIfMissing": "' . $createIfMissing . '", "currentValue": "' . $currentValue . '"}');
    } elseif ($currentValue != "") {
      die('{"status": "FAIL", "message": "Variable file does not exist and currentValue is not empty: ' . $fullVariableFileName . '", "createIfMissing": "' . $createIfMissing . '", "currentValue": "' . $currentValue . '"}');
    } else {
      // TODO: Window of vulnerability where another user could create the file???
      writeVariableToNewFile($fullVariableFileName, $newValue); 
      $variableValueAfterOperation = $newValue;
    }
  } else {
    $fh = fopen($fullVariableFileName, 'r+');
    if (!$fh) {
      die('{"status": "FAIL", "message": "Could not open file for updating: ' . $fullVariableFileName . '"}');
    }
    $contents = fread($fh, $MaximumVariableVersionBufferSize);
    if ($contents != $currentValue) {
      fclose($fh);
      // header("HTTP/1.1 409 Variable value was changed by another user to: " . $contents);
      die('{"status": "FAIL", "message": "Variable value was changed by another user to: ' . $contents . '", "currentValue": "' . $contents . '"}');
    }
    rewind($fh);
    fwrite($fh, $newValue);
    ftruncate($fh, strlen($newValue));
    fclose($fh);
    $variableValueAfterOperation = $newValue;
  }
}

if ($operation == "get") {
  validateFileExists($fullVariableFileName);
  $fh = fopen($fullVariableFileName, 'r');
  $contents = fread($fh, $MaximumVariableVersionBufferSize);
  fclose($fh);
  $variableValueAfterOperation = $contents;
  // TODO: Add support for queries to reduce back-and-forth traffic, like to follow previousVersion or retrieve contents of value
  // If a value is a pointrel resource URI ending in ".json", it would be read in if more fields of it are wanted
  // Example: "value value.contents previousVersion.contents previousVersion.previousVersion previousVersion.previousVersion.contents
}

if ($operation == "query") {
  // TODO: Add support for queries to reduce back-and-forth traffic, like to follow previousVersion or retrieve contents of value
  // If a value is a pointrel resource URI ending in ".json", it would be read in if more fields of it are wanted
  // Possible xample: "value value.contents previousVersion.contents previousVersion.previousVersion previousVersion.previousVersion.contents
  die('{"status": "FAIL", "message": "Operation query not supported yet"}');
}

// ??? header("Content-type: text/json; charset=UTF-8");
echo '{"status": "OK", "message": "Successful operation: ' . $operation . '", "variable": "' . $variableName . '", "currentValue": "' . $variableValueAfterOperation . '"}';


