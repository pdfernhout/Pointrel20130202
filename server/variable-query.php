<?php
include "pointrel_utils.php";

// TODO: append md5 or other quick checksum to the start of variable names and store in directories so can support millions of them

// TODO: Should escape all user input returned as errors with htmlspecialchars or something else

function validateFileExistsOrDie($fullVariableFileName) {
    if (!file_exists($fullVariableFileName)) {
        // TODO: Can't replace with exitWithJSONStatusMessage because has extra value
        // header("HTTP/1.1 400 Variable file does not exist: " . $fullVariableFileName);
        exit('{"status": "FAIL", "message": "Variable file does not exist: ' . $fullVariableFileName . '", "currentValue": null}');
    }
}

function writeVariableToNewFile($fullVariableFileName, $newValue) {
    $fh = fopen($fullVariableFileName, 'w');
    if (!$fh) {
        exitWithJSONStatusMessage("Could not create variable file: '" . $fullVariableFileName . '"', NO_FAILURE_HEADER, 500);
    }
    fwrite($fh, $newValue);
    fclose($fh);
}

// Buffer should be big enough for version info...
$MaximumVariableVersionBufferSize = 8192;

$variableName = getPost('variableName');
$operation = getPost('operation');
$createIfMissing = getPost('createIfMissing');
$operation = getPost('operation');
$newValue = getPost('newValue');
$currentValue = getPost('currentValue');
$userID = getPost('userID');

// For later use
$session = getPost('session');
$authentication = getPost('authentication');

// Default createIfMissing to true unless explicitly set to false
if ($createIfMissing == "f" || $createIfMissing == "false" || $createIfMissing == "F" || $createIfMissing == "FALSE") {
    $createIfMissing = FALSE;
} else {
    $createIfMissing = TRUE;
}

$remoteAddress = $_SERVER['REMOTE_ADDR'];

error_log('{"timeStamp": "' . currentTimeStamp() . '", "remoteAddress": "' . $remoteAddress . '", "request": "variable-change", "variableName": "' . $variableName . '", "operation": "' . $operation . '", "newValue": "' . $newValue . '", "currentValue": "' . $currentValue . '", "userID": "' . $userID . '", "session": "' . $session . '"}' . "\n", 3, $fullLogFileName);

if (!array_key_exists('operation', $_POST)) {
    exitWithJSONStatusMessage("No operation was specified", NO_FAILURE_HEADER, 400);
}

$operations = array("exists", "new", "delete", "get", "set", "query");
if (!in_array($operation, $operations)) {
    exitWithJSONStatusMessage("Unsupported operation: '" . $operation . "'", NO_FAILURE_HEADER, 400);
}

if (empty($userID)) {
    exitWithJSONStatusMessage("No userID was specified", NO_FAILURE_HEADER, 400);
}

if (empty($variableName)) {
    exitWithJSONStatusMessage("No variableName was specified", NO_FAILURE_HEADER, 400);
}

if (strlen($variableName) > 100) {
    exitWithJSONStatusMessage("Variable name is too long (maximum 100 characters)", NO_FAILURE_HEADER, 400);
}

// From: http://stackoverflow.com/questions/2668854/sanitizing-strings-to-make-them-url-and-filename-safe
// but changed to change dots to underscores
$shortFileNameForVariableName = preg_replace(array('/\s/', '/\.[\.]+/', '/[^\w_\.\-]/'), array('_', '_', '_'), $variableName);

$hexDigits = md5($shortFileNameForVariableName);

$createSubdirectories = ($operation == "new") || ($operation == "set" && $currentValue === "");
$storagePath = calculateStoragePath($pointrelVariablesDirectory, $hexDigits, VARIABLE_STORAGE_LEVEL_COUNT, VARIABLE_STORAGE_SEGMENT_LENGTH, $createSubdirectories);

$fullVariableFileName = $storagePath . "variable_" . $hexDigits . "_" . $shortFileNameForVariableName . '.txt';
$variableValueAfterOperation = "ERROR";

if ($operation == "exists") {
    if (file_exists($fullVariableFileName)) {
        // TODO: Can't replace this one because it has OK
        exit('{"status": "OK", "message": "Variable file exists: ' . $fullVariableFileName . '"}');
    }
    exitWithJSONStatusMessage("Variable file does not exist: '" . $fullVariableFileName . "'", NO_FAILURE_HEADER, 0);
}

if ($operation == "new") {
    if (file_exists($fullVariableFileName)) {
        exitWithJSONStatusMessage("Variable file already exists: '" . $fullVariableFileName . "'", NO_FAILURE_HEADER, 400);
    }
    validateURIOrExit($newValue, NO_FAILURE_HEADER);

    writeVariableToNewFile($fullVariableFileName, $newValue);
    $variableValueAfterOperation = $newValue;
}

if ($operation == "delete") {
    validateFileExistsOrDie($fullVariableFileName);
    validateURIOrExit($currentValue, NO_FAILURE_HEADER);
    $fh = fopen($fullVariableFileName, 'r+');
    $contents = fread($fh, 8192);
    if ($contents != $currentValue) {
        fclose($fh);
        exitWithJSONStatusMessage("Variable value was changed by another user to: " . $contents, NO_FAILURE_HEADER, 409);
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
    if ($currentValue !== "") validateURIOrExit($currentValue, NO_FAILURE_HEADER);
    if ($newValue !== "") validateURIOrExit($newValue, NO_FAILURE_HEADER);
    if (!file_exists($fullVariableFileName)) {
        // Maybe create the file if it does not exists
        if ($createIfMissing === FALSE) {
            // TODO: Can't replace this as it has extra fields beyond message
            exit('{"status": "FAIL", "message": "Variable file does not exist and createIfMissing is false: ' . $fullVariableFileName . '", "createIfMissing": "' . $createIfMissing . '", "currentValue": "' . $currentValue . '"}');
        } elseif ($currentValue != "") {
            // TODO: Can't replace this as it has extra fields beyond message
            exit('{"status": "FAIL", "message": "Variable file does not exist and currentValue is not empty: ' . $fullVariableFileName . '", "createIfMissing": "' . $createIfMissing . '", "currentValue": "' . $currentValue . '"}');
        } else {
            // TODO: Window of vulnerability where another user could create the file???
            writeVariableToNewFile($fullVariableFileName, $newValue);
            $variableValueAfterOperation = $newValue;
        }
    } else {
        $fh = fopen($fullVariableFileName, 'r+');
        if (!$fh) {
            exit('{"status": "FAIL", "message": "Could not open file for updating: ' . $fullVariableFileName . '"}');
        }
        $contents = fread($fh, $MaximumVariableVersionBufferSize);
        if ($contents != $currentValue) {
            fclose($fh);
            // header("HTTP/1.1 409 Variable value was changed by another user to: " . $contents);
            exit('{"status": "FAIL", "message": "Variable value was changed by another user to: ' . $contents . '", "currentValue": "' . $contents . '"}');
        }
        rewind($fh);
        fwrite($fh, $newValue);
        ftruncate($fh, strlen($newValue));
        fclose($fh);
        $variableValueAfterOperation = $newValue;
    }
}

if ($operation == "get") {
    validateFileExistsOrDie($fullVariableFileName);
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
    exitWithJSONStatusMessage("Operation query not supported yet", NO_FAILURE_HEADER, 0);
}

// ??? header("Content-type: text/json; charset=UTF-8");
echo '{"status": "OK", "message": "Successful operation: ' . $operation . '", "variable": "' . $variableName . '", "currentValue": "' . $variableValueAfterOperation . '"}';


