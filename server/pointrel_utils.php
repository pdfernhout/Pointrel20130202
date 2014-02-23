<?php
include "pointrel_config.php";

// These four constants used to figure out where to put resources and variables
// The defaults here should support about a trillion resources and a billion variables
// If you change these after you have started using the system, previously stored resources and variables
// won't be found unless you move them into the new expected places somehow --
// unless you make other changes to look first in the old locations
define("RESOURCE_STORAGE_LEVEL_COUNT", 4);
define("RESOURCE_STORAGE_SEGMENT_LENGTH", 2);
define("VARIABLE_STORAGE_LEVEL_COUNT", 3);
define("VARIABLE_STORAGE_SEGMENT_LENGTH", 2);

// The short name of the main index of all resources added to the archive
define("POINTREL_ALL_INDEX_FILE_NAME", "__PointrelMainIndex.pointrelIndex");

// Calculate today's log file name
$fullLogFileName = $pointrelLogsDirectory . gmdate("Y-m-d") . ".log";

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

function getGet($name) {
	if ($_SERVER['REQUEST_METHOD'] === 'POST') {
		return array_key_exists($name, $_POST) ? $_POST[$name] : null;
	} else {
		return array_key_exists($name, $_GET) ? $_GET[$name] : null;
	}
}

function getPost($name) {
	if ($_SERVER['REQUEST_METHOD'] === 'POST') {
		return array_key_exists($name, $_POST) ? $_POST[$name] : null;
	} else {
		null;
	}
}

function startsWith($haystack, $needle) {
    return !strncmp($haystack, $needle, strlen($needle));
}

function endsWith($haystack, $needle) {
    $length = strlen($needle);
    if ($length == 0) {
        return true;
    }

    return (substr($haystack, -$length) === $needle);
}

function getFileExtension($fileName) {
    return pathinfo($fileName, PATHINFO_EXTENSION);
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

// From: http://stackoverflow.com/questions/2670299/is-there-a-php-equivalent-function-to-the-python-os-path-normpath
// With changes to use current directory to make expanded path (may not be canonical if symbolic links?)
function expandPath($path)
{
    if (empty($path))
        return getcwd() . '/';

    if (strpos($path, '/') !== 0) {
        // append current working directory
        $path = getcwd() . "/" . $path;
    }
    if ((strpos($path, '//') === 0) && (strpos($path, '///') === false)) {
    	$initial_slashes = 2;
    } else {
    	$initial_slashes = 1;
    }

    $comps = explode('/', $path);
    $new_comps = array();
    foreach ($comps as $comp)
    {
        if (in_array($comp, array('', '.')))
            continue;
        if (
            ($comp != '..') ||
            (!$initial_slashes && !$new_comps) ||
            ($new_comps && (end($new_comps) == '..'))
        )
            array_push($new_comps, $comp);
        elseif ($new_comps)
            array_pop($new_comps);
    }
    $comps = $new_comps;
    $path = implode('/', $comps);
    $path = str_repeat('/', $initial_slashes) . $path;
    if ($path)
        return $path;
    else
        return getcwd() . '/';
}

// Functionns used by journals and by indexes
// PHP uses advisory locking on many platforms, so this locking may only be adequate if the file  is only accessed by this script
// There could be concurrency issues in between the time a check for existency is done for a file and when it is modified?

function validateFileExistsOrExit($fullFileName) {
	if (!file_exists($fullFileName)) {
		// TODO: Can't replace with exitWithJSONStatusMessage because has extra value
		// header("HTTP/1.1 400 File does not exist: " . $fullFileName);
		exit('{"status": "FAIL", "message": "File does not exist: ' . $fullFileName . '", "currentValue": null}');
	}
}

function createFile($fullFileName, $contents) {
	$fh = fopen($fullFileName, 'xb');
	if (!$fh) {
		exitWithJSONStatusMessage("Could not create file: '$fullFileName'", NO_FAILURE_HEADER, 500);
	}
	if (flock($fh, LOCK_EX)) {
		fwrite($fh, $contents);
		flock($fh, LOCK_UN);
	} else {
		exitWithJSONStatusMessage("Could not lock the file for creating: '$fullFileName'", NO_FAILURE_HEADER, 500);
	}
	fclose($fh);
}

function appendDataToFile($fullFileName, $dataToAppend) {
	$fh = fopen($fullFileName, 'ab');
	if (!$fh) {
		exitWithJSONStatusMessage("Could not open file: '$fullFileName'", NO_FAILURE_HEADER, 500);
	}
	if (flock($fh, LOCK_EX)) {
		fwrite($fh, $dataToAppend);
		flock($fh, LOCK_UN);
	} else {
		exitWithJSONStatusMessage("Could not lock the file for appending: '$fullFileName'", NO_FAILURE_HEADER, 500);
	}
	fclose($fh);
}

function createIndexEntry($indexString, $shortFileNameForResource, $timestamp, $userID) {
	global $pointrelIndexesDirectory;
	// echo "createIndexEntry '$indexString' '$shortFileName' $timestamp $userID\n";
	$shortFileNameForIndexName = preg_replace(array('/\s/', '/\.[\.]+/', '/[^\w_\.\-]/'), array('_', '_', '_'), $indexString);
	
	$hexDigits = md5($shortFileNameForIndexName);
	$createSubdirectories = true;
	$storagePath = calculateStoragePath($pointrelIndexesDirectory, $hexDigits, VARIABLE_STORAGE_LEVEL_COUNT, VARIABLE_STORAGE_SEGMENT_LENGTH, $createSubdirectories);
	$fullIndexFileName = $storagePath . "index_" . $hexDigits . "_" . $shortFileNameForIndexName . '.pointrelIndex';
	
	// TODO: Ideally should just do this once when install, not every time we add a resource
	if (!file_exists($fullIndexFileName)) {
		$randomUUID = uniqid('pointrelIndex:', true);
		$jsonForIndex = '{"indexFormat":"index","indexName":"' . $shortFileNameForIndexName . '","versionUUID":"' . $randomUUID . '"}';
		$firstLineHeader = "$jsonForIndex\n";
		createFile($fullIndexFileName, $firstLineHeader);
	}
	
	$jsonForIndex = '{"operation":"add","resource":"' . $shortFileNameForResource . '","timestamp":"' . $timestamp . '","userID":"' . $userID . '"}' . "\n";
	appendDataToFile($fullIndexFileName, $jsonForIndex);
	// echo "done making index\n";
}

function addToIndexes($shortFileName, $timestamp, $userID, $content) {
	global $pointrelIndexesMaintain, $pointrelIndexesDirectory, $pointrelIndexesCustomFunction;
	
	if ($pointrelIndexesMaintain !== true) {
		return;
	}
	
	$shortFileNameForMainIndex = POINTREL_ALL_INDEX_FILE_NAME;
	$fullMainIndexFileName = $pointrelIndexesDirectory . $shortFileNameForMainIndex;
	
	// TODO: Ideally should just do this once when install, not every time we add a resource
	if (!file_exists($fullMainIndexFileName)) {
		$randomUUID = uniqid('pointrelIndex:', true);
		$jsonForIndex = '{"indexFormat":"index","indexName":"' . $shortFileNameForMainIndex . '","versionUUID":"' . $randomUUID . '"}';
		$firstLineHeader = "$jsonForIndex\n";
		createFile($fullMainIndexFileName, $firstLineHeader);
	}
	
	// TODO: Implement recovery plan if fails while writing, like keeping resource in temp directory until finished indexing
	$jsonForIndex = '{"operation":"add","resource":"' . $shortFileName . '","timestamp":"' . $timestamp . '","userID":"' . $userID . '"}' . "\n";
	appendDataToFile($fullMainIndexFileName, $jsonForIndex);
	
	// TODO: What kind of files to index?
	if (endsWith($shortFileName, ".pointrel-indexed.json")) {
		// echo "indexable; trying to decode json\n";
		// Do indexing
		$json = json_decode($content, true);
		// Error if array: echo "decoded into: '$json'\n";
		// echo "content: '$content'\n";
		if ($json) {
			if (is_array($json)) {
				// echo "trying to index\n";
				$indexing = $json["indexing"];
				// echo "the array is: $indexing";
				if ($indexing) {
					foreach ($indexing as $indexString) {
						// echo "Index on: $indexString/n";
						// Create index entry for item
						createIndexEntry($indexString, $shortFileName, $timestamp, $userID);
					}
				} else {
					// echo "No indexes\n";
				}
			} else {
				// $json_printable = print_r($json, true);
				// echo "not array '$json_printable'\n";
			}
		}
	}

	if ($pointrelIndexesCustomFunction !== null) {
		call_user_func($pointrelIndexesCustomFunction, $shortFileName, $timestamp, $userID, $contents);
	}
}