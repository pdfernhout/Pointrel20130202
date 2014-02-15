<?php
// Configuration: Override this if needed by creating a config.php file in the same directory
$logsDirectory = "./";

if (file_exists('config.php')) {
	include('config.php');
}

/////////////////

// TODO: Should escape all user input returned as errors with htmlspecialchars or something else
// TODO: Ensure new line translation so it is always the same regardless of platform encoding

// PHP uses advisory locking on many platforms, so this locking may only be adequate if the file  is only accessed by this script
// There could be concurrency issues in between the time a check for existency is done for a file and when it is modified?

// Calculate today's log file name
$fullLogFileName = $logsDirectory . gmdate("Y-m-d") . ".log";

define("SEND_FAILURE_HEADER", TRUE);
define("NO_FAILURE_HEADER", FALSE);

function exitWithJSONStatusMessage($message, $sendHeader = NO_FAILURE_HEADER, $errorNumberForHeader = 400) {
	$messageWithQuotesEscaped = str_replace('"', '\\"', $message);
	if ($sendHeader) header("HTTP/1.1 " . $errorNumberForHeader . " " . $message);
	exit('{"status": "FAIL", "message": "' . $messageWithQuotesEscaped . '"}');
}

function currentTimeStamp() {
	return gmdate('Y-m-d\TH:i:s\Z');
}

function validateFileExistsOrDie($fileName) {
    if (!file_exists($fileName)) {
        // TODO: Can't replace with exitWithJSONStatusMessage because has extra value
        // header("HTTP/1.1 400 Archive file does not exist: " . $fileName);
        exit('{"status": "FAIL", "message": "File does not exist: ' . $fileName . '", "currentValue": null}');
    }
}

function writeArchiveToNewFile($fullArchiveFileName, $contents) {
	$fh = fopen($fullArchiveFileName, 'xb');
	if (!$fh) {
		exitWithJSONStatusMessage("Could not create archive file: '$fullArchiveFileName'", NO_FAILURE_HEADER, 500);
	}
	if (flock($fh, LOCK_EX)) {
		fwrite($fh, $contents);
		flock($fh, LOCK_UN);
	} else {
		exitWithJSONStatusMessage("Could not lock the archive file for creating: '$fullArchiveFileName'", NO_FAILURE_HEADER, 500);
	}
	fclose($fh);
}

function appendDataToArchiveFile($fullArchiveFileName, $dataToAppend) {
	$fh = fopen($fullArchiveFileName, 'ab');
	if (!$fh) {
		exitWithJSONStatusMessage("Could not open archive file: '$fullArchiveFileName'", NO_FAILURE_HEADER, 500);
	}
	if (flock($fh, LOCK_EX)) {
		fwrite($fh, $dataToAppend);
		flock($fh, LOCK_UN);
	} else {
		exitWithJSONStatusMessage("Could not lock the archive file for appending: '$fullArchiveFileName'", NO_FAILURE_HEADER, 500);
	}
	fclose($fh);
}

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

// the userID making the request
$userID = $_POST['userID'];

// the name of the archive
$archiveName = $_POST['archiveName'];

// operations and operands: 
// exists -- see if archive exists
// create -- make the archive
// delete userSuppliedHeader userSuppliedSize -- remove the archive, verifying header and size
// info -- returns data from the first line of the archive (which has a uuid) and the archive's size
// get start length -- retrieves a number of bytes starting from start and ending at start + length - 1
// put hash size type path data -- adds data to the archive, verifying the hash
$operation = $_POST['operation'];

$remoteAddress = $_SERVER['REMOTE_ADDR'];
$logTimeStamp = currentTimeStamp();

// Ideas for later use; need to add to log
// $session = $_POST['session'];
// $authentication = $_POST['authentication'];

// Log what was requested
error_log('{"timeStamp": "' . $logTimeStamp . '", "remoteAddress": "' . $remoteAddress . '", "archiveName": "' . $archiveName . '", "operation": "' . $operation . '", "userID": "' . $userID . '"}' . "\n", 3, $fullLogFileName);

// Validate the input, returning error messages if there is something lacking

if (empty($userID)) {
	exitWithJSONStatusMessage("No userID was specified", NO_FAILURE_HEADER, 400);
}

if (empty($archiveName)) {
	exitWithJSONStatusMessage("No archiveName was specified", NO_FAILURE_HEADER, 400);
}

if (strlen($archiveName) > 100) {
	exitWithJSONStatusMessage("Archive name is too long (maximum 100 characters)", NO_FAILURE_HEADER, 400);
}

if (!array_key_exists('operation', $_POST)) {
	exitWithJSONStatusMessage("No operation was specified", NO_FAILURE_HEADER, 400);
}

$operations = array("exists", "create", "delete", "info", "get", "put");
if (!in_array($operation, $operations)) {
	exitWithJSONStatusMessage("Unsupported operation: '$operation'", NO_FAILURE_HEADER, 400);
}


// Determine the file name to go with the archive

// From: http://stackoverflow.com/questions/2668854/sanitizing-strings-to-make-them-url-and-filename-safe but changed to change dots to underscores
$shortFileNameForArchiveName = preg_replace(array('/\s/', '/\.[\.]+/', '/[^\w_\.\-]/'), array('_', '_', '_'), $archiveName);

$hexDigits = md5($shortFileNameForArchiveName);
// Not creating subdirectories for now
// $createSubdirectories = ($operation == "create");
// $storagePath = calculateStoragePath($pointrelArchivesDirectory, $hexDigits, VARIABLE_STORAGE_LEVEL_COUNT, VARIABLE_STORAGE_SEGMENT_LENGTH, $createSubdirectories);
// $fullArchiveFileName = $storagePath . "archive_" . $hexDigits . "_" . $shortFileNameForArchiveName . '.pointrelArchive';
$fullArchiveFileName = "archive_" . $hexDigits . "_" . $shortFileNameForArchiveName . '.jsonArchive';

$jsonToReturn = '"ERROR"';

// operation: exists

if ($operation == "exists") {
	if (file_exists($fullArchiveFileName)) {
		// TODO: Can't replace this one because it has OK
		exit('{"status": "OK", "message": "Archive file exists: ' . $shortFileNameForArchiveName . '"}');
	}
	exitWithJSONStatusMessage("Archive file does not exist: '" . $shortFileNameForArchiveName . "'", NO_FAILURE_HEADER, 0);
}

// operation: create
// Creates the archive, with the first entry being a JSON object that has a unique ID for this archive instance

if ($operation == "create") {
	if (file_exists($fullArchiveFileName)) {
		exitWithJSONStatusMessage("Archive file already exists: '" . $fullArchiveFileName . "'", NO_FAILURE_HEADER, 400);
	}
	
	// TODO: Should also put archiveName in somehow
	$randomUUID = uniqid('jsonArchiveInstance:', true);
	// TODO: Maybe should use archiveName passed in, but with replacement for any double quotes in it?
	$jsonForArchive = '{"archiveName":"' . $shortFileNameForArchiveName . '","versionUUID":"' . $randomUUID . '"}';
	$firstLineHeader = "$jsonForArchive\n";

	writeArchiveToNewFile($fullArchiveFileName, $firstLineHeader);
	// Return a nested json object instead of a string
	$jsonToReturn = rtrim($firstLineHeader);
}

// operation: delete userSuppliedHeader userSuppliedSize

if ($operation == "delete") {
	validateFileExistsOrDie($fullArchiveFileName);
	
	// Check that header info and size are correct; header must be in canonical form as supplied
	$userSuppliedHeader = $_POST['userSuppliedHeader'];
	$userSuppliedSize = $_POST['userSuppliedSize'];
	
	$fh = fopen($fullArchiveFileName, 'r+b');
	if (flock($fh, LOCK_EX)) {
		$stat = fstat($fh);
		$size = $stat['size'];
		if ($size != $userSuppliedSize) {
			fclose($fh);
			exitWithJSONStatusMessage("Archive size: $size was not as expected: $userSuppliedSize", NO_FAILURE_HEADER, 409);
		}
		
		$firstLineHeader = fgets($fh);
		$firstLineHeader = rtrim($firstLineHeader);
		if ($firstLineHeader != $userSuppliedHeader) {
			fclose($fh);
			exitWithJSONStatusMessage("Archive header: $firstLineHeader was not as expected: $userSuppliedHeader", NO_FAILURE_HEADER, 409);
		}
		fseek($fh, 0);
		// Temporarily set value to delete to prevent other process updating it while try to unlink
		fwrite($fh, "DELETED");
		fflush($fh);
		ftruncate($fh, strlen("DELETED"));
		flock($fh, LOCK_UN);
		fclose($fh);
		unlink($fullArchiveFileName);
		$jsonToReturn = '"DELETED"';
	} else {
		exitWithJSONStatusMessage("Could not lock the archive file for deleting: '$fullArchiveFileName'", NO_FAILURE_HEADER, 500);
	}
		
}

// operation: info

if ($operation == "info") {
	validateFileExistsOrDie($fullArchiveFileName);
	$fh = fopen($fullArchiveFileName, 'rb');
	if (flock($fh, LOCK_EX)) {
		$firstLineHeader = fgets($fh);
		$stat = fstat($fh);
		$size = $stat['size'];
		flock($fh, LOCK_UN);
		fclose($fh);
		
		$firstLineHeader = rtrim($firstLineHeader);
		
		// Returning the header as a string, both so it can be used for deletes and also because if the file is corrupt, it might not be valid json
		$firstLineHeaderWithReplacedQuotes = str_replace('"', '\\"', $firstLineHeader);
		$jsonToReturn = '{"header":"' . $firstLineHeaderWithReplacedQuotes . '", "size": ' . $size . "}";
	} else {
		exitWithJSONStatusMessage("Could not lock the archive file for info: '$fullArchiveFileName'", NO_FAILURE_HEADER, 500);
	}
		
}

// operation: get
// This may return JSON if there is an error; otherwise it returns the byte data in that section of file

if ($operation == "get") {
	validateFileExistsOrDie($fullArchiveFileName);
	
	$start = $_POST['start'];
	
	if ($start == '') {
		exitWithJSONStatusMessage("No start was specified", NO_FAILURE_HEADER, 400);
	}
	
	$length = $_POST['length'];
	
	if (empty($length)) {
		exitWithJSONStatusMessage("No length was specified", NO_FAILURE_HEADER, 400);
	}
	
	// Need to return arbitrary length content in body instead of JSON status result
	// TODO: Just doing it as a single read to a string, which should be improved such as done 
	// in previous pointrel version as readfile at end or instead with buffering similar to::
	// http://stackoverflow.com/questions/1395656/is-there-a-good-implementation-of-partial-file-downloading-in-php
	// http://www.coneural.org/florian/papers/04_byteserving.php
	$contentsPartial = file_get_contents($fullArchiveFileName, true, NULL, $start, $length);
	
	if ($contentsPartial == FALSE) {
		$jsonToReturn = '"FAILED"';
	} else {
		$contentsPartialEncoded = base64_encode($contentsPartial);
		$jsonToReturn = '"' . $contentsPartialEncoded . '"';
		// If wanted to write it out without encoding:
		// header("Content-type: application/octet-stream");
		// echo $contentsPartial;
		// exit();
	}
}

// operation: put

if ($operation == "put") {
	validateFileExistsOrDie($fullArchiveFileName);
	
	$encodedContent = $_POST['encodedContent'];
	if (empty($encodedContent)) {
		exitWithJSONStatusMessage("No encodedContent was specified", NO_FAILURE_HEADER, 400);
	}	
	
	$content = base64_decode($encodedContent);
	
	// TODO: Could check that it is valid JSON content
	appendDataToArchiveFile($fullArchiveFileName, $content . "\n");
	
	$jsonToReturn = '"ADDED"';
}

// header("Content-type: application/json; charset=UTF-8");
header("Content-type: application/json");
echo '{"status": "OK", "message": "Successful operation: ' . $operation . '", "archiveName": "' . $archiveName . '", "result": ' . $jsonToReturn . '}';


