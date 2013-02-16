<?php
// Note the need for a trailing slash for these directory names
$pointrelResourcesDirectory = "../pointrel-data/resources/";
$pointrelVariablesDirectory = "../pointrel-data/variables/";

// Calculate today's log file name
$fullLogFileName = "../pointrel-data/logs/" . gmdate("Y-m-d") . ".log";

// recursively strip slashes from an array to deal with "magic quotes"
function stripslashes_recursive($array) {
    foreach ($array as $key => $value) {
        $array[$key] = is_array($value) ?
            stripslashes_recursive($value) :
            stripslashes($value);
    }
    return $array;
}

// Change global values
if (get_magic_quotes_gpc()) {
    $_GET = stripslashes_recursive($_GET);
    $_POST = stripslashes_recursive($_POST);
    $_COOKIE = stripslashes_recursive($_COOKIE);
    $_REQUEST = stripslashes_recursive($_REQUEST);
}


define("SEND_FAILURE_HEADER", TRUE);
define("NO_FAILURE_HEADER", FALSE);

function exitWithJSONStatusMessage($message, $sendHeader = NO_FAILURE_HEADER, $errorNumberForHeader = 400) {
    $messageWithQuotesEscaped = str_replace('"', '\\"', $message);
    if ($sendHeader) header("HTTP/1.1 " . $errorNumberForHeader . " " . $message);
    exit('{"status": "FAIL", "message": "' . $messageWithQuotesEscaped . '"}');
}

function quiet_mkdir($path) {
    if (is_dir($path)) return;
    if (!mkdir($path)) {
        exit("could not make directory " . $path);
    }
}

function currentTimeStamp() {
    return gmdate('Y-m-d\TH:i:s\Z');
}

// TODO: add option to validate for SHA256 content
// Returns short name (after pointrel://) or quits with an error
function validateURIOrExit($pointrelURI, $sendHeader=NO_FAILURE_HEADER) {
    // TODO: Sanitize error messages as they repeat user input
    $pointrelAndRest = explode("//", $pointrelURI, 2);
    $shortName = $pointrelAndRest[1];

    // TODO: Check it does not have a third segment

    if ($pointrelAndRest[0] != "pointrel:") {
        exitWithJSONStatusMessage("URI does not start with pointrel://", $sendHeader, 406);
    }

    if (count($pointrelAndRest) != 2) {
        exitWithJSONStatusMessage('URI is malformed with extra "//"', $sendHeader, 406);
    }

    // sha256_HEX_SIZE.extension
    $shaAndRest = explode("_", $shortName, 3);

    if ($shaAndRest[0] != "sha256") {
        exitWithJSONStatusMessage("URI does not use sha256", $sendHeader, 406);
    }

    $hexDigits = $shaAndRest[1];

    if (strlen($hexDigits) != 64) {
        exitWithJSONStatusMessage("URI does have 64 sha256 characters", $sendHeader, 406);
    }

    // TODO: Make sanitization stricter for hexDigits, size, and probably also for extension
    if (strpos($shortName, "/") !== false || strpos($shortName, "'") !== false || strpos($shortName, '"') !== false) {
        exitWithJSONStatusMessage("Bad characters in URI", $sendHeader, 406);
    }

    $lengthAndRest = explode(".", $shaAndRest[2]);
    $lengthString = $lengthAndRest[0];

    if (strlen($lengthString) == 0) {
        exitWithJSONStatusMessage("URI does have a length field", $sendHeader, 406);
    }

    $length = intval($lengthString);

    if ($length < 0) {
        exitWithJSONStatusMessage("URI has negative length field", $sendHeader, 406);
    }


//    $dotPosition = strpos($shortName, '.');
//    if ($dotPosition === false) {
//        $extension = "_no_extension_";
//    } else {
//        // TODO: escape extension
//        $extension = substr($shortName, $dotPosition + 1);
//    }


    return array(
        "pointrelURI" => $pointrelURI,
        "shortName" => $shortName,
        "hexDigits" => $hexDigits,
        // "extension" => $extension,
        "length" => $length,
    );
}

// Defaults picked to support billions of resources and millions of variables
define("RESOURCE_STORAGE_LEVEL_COUNT", 4);
define("RESOURCE_STORAGE_SEGMENT_LENGTH", 2);
define("VARIABLE_STORAGE_LEVEL_COUNT", 2);
define("VARIABLE_STORAGE_SEGMENT_LENGTH", 2);

// Returns the path where this file would go
function calculateStoragePath($baseDirectory, $hexDigits, $levelCount, $segmentLength, $createSubdirectories) {
    $fullPath = $baseDirectory;
    for ($level = 0; $level < $levelCount; $level++) {
        $startOfSegment = $level * $segmentLength;
        $segment = substr($hexDigits, $startOfSegment, $segmentLength);
        $fullPath = $fullPath . $segment . "/";
        if ($createSubdirectories) quiet_mkdir($fullPath);
    }

    return $fullPath;
}