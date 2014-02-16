<?php
// Support creating an append-only journal under a specific name;
// the journal ideally should be mergable with other journals of the same name on other systems

include "pointrel_utils.php";

/////////////////

// TODO: Should escape all user input returned as errors with htmlspecialchars or something else
// TODO: Ensure new line translation so it is always the same regardless of platform encoding

// PHP uses advisory locking on many platforms, so this locking may only be adequate if the file  is only accessed by this script
// There could be concurrency issues in between the time a check for existency is done for a file and when it is modified?

function validateFileExistsOrDie($fullJournalFileName) {
    if (!file_exists($fullJournalFileName)) {
        // TODO: Can't replace with exitWithJSONStatusMessage because has extra value
        // header("HTTP/1.1 400 Journal file does not exist: " . $fullJournalFileName);
        exit('{"status": "FAIL", "message": "Journal file does not exist: ' . $fullJournalFileName . '", "currentValue": null}');
    }
}

function createJournalFile($fullJournalFileName, $contents) {
	$fh = fopen($fullJournalFileName, 'xb');
	if (!$fh) {
		exitWithJSONStatusMessage("Could not create journal file: '$fullJournalFileName'", NO_FAILURE_HEADER, 500);
	}
	if (flock($fh, LOCK_EX)) {
		fwrite($fh, $contents);
		flock($fh, LOCK_UN);
	} else {
		exitWithJSONStatusMessage("Could not lock the journal file for creating: '$fullJournalFileName'", NO_FAILURE_HEADER, 500);
	}
	fclose($fh);
}

function appendDataToJournalFile($fullJournalFileName, $dataToAppend) {
	$fh = fopen($fullJournalFileName, 'ab');
	if (!$fh) {
		exitWithJSONStatusMessage("Could not open journal file: '$fullJournalFileName'", NO_FAILURE_HEADER, 500);
	}
	if (flock($fh, LOCK_EX)) {
		fwrite($fh, $dataToAppend);
		flock($fh, LOCK_UN);
	} else {
		exitWithJSONStatusMessage("Could not lock the journal file for appending: '$fullJournalFileName'", NO_FAILURE_HEADER, 500);
	}
	fclose($fh);
}

// the userID making the request
$userID = $_POST['userID'];

// the name of the journal
$journalName = $_POST['journalName'];

// Operations and operands: 
//   exists -- see if journal exists
//   create -- make the journal
//   delete userSuppliedHeader userSuppliedSize -- remove the journal, verifying header and size
//   info -- returns data from the first line of the journal (which has a uuid) and the journal's size
//   get start length -- retrieves a number of bytes starting from start and ending at start + length - 1
//   put hash size type path data -- adds data to the journal, verifying the hash
$operation = $_POST['operation'];

$remoteAddress = $_SERVER['REMOTE_ADDR'];
$logTimeStamp = currentTimeStamp();

// Ideas for later use; need to add to log
// $session = $_POST['session'];
// $authentication = $_POST['authentication'];

// Log what was requested
error_log('{"timeStamp": "' . $logTimeStamp . '", "remoteAddress": "' . $remoteAddress . '", "request": "journal-store", journalName": "' . $journalName . '", "operation": "' . $operation . '", "userID": "' . $userID . '"}' . "\n", 3, $fullLogFileName);

// Validate the input, returning error messages if there is something lacking

if (empty($userID)) {
	exitWithJSONStatusMessage("No userID was specified", NO_FAILURE_HEADER, 400);
}

if (empty($journalName)) {
	exitWithJSONStatusMessage("No journalName was specified", NO_FAILURE_HEADER, 400);
}

if (strlen($journalName) > 100) {
	exitWithJSONStatusMessage("Journal name is too long (maximum 100 characters)", NO_FAILURE_HEADER, 400);
}

if (!array_key_exists('operation', $_POST)) {
	exitWithJSONStatusMessage("No operation was specified", NO_FAILURE_HEADER, 400);
}

$operations = array("exists", "create", "delete", "info", "get", "put");
if (!in_array($operation, $operations)) {
	exitWithJSONStatusMessage("Unsupported operation: '$operation'", NO_FAILURE_HEADER, 400);
}


// Determine the file name to go with the journal

// From: http://stackoverflow.com/questions/2668854/sanitizing-strings-to-make-them-url-and-filename-safe but changed to change dots to underscores
$shortFileNameForJournalName = preg_replace(array('/\s/', '/\.[\.]+/', '/[^\w_\.\-]/'), array('_', '_', '_'), $journalName);

$hexDigits = md5($shortFileNameForJournalName);
$createSubdirectories = ($operation == "create");
$storagePath = calculateStoragePath($pointrelJournalsDirectory, $hexDigits, VARIABLE_STORAGE_LEVEL_COUNT, VARIABLE_STORAGE_SEGMENT_LENGTH, $createSubdirectories);
$fullJournalFileName = $storagePath . "journal_" . $hexDigits . "_" . $shortFileNameForJournalName . '.pointrelJournal';
// $fullJournalFileName = "journal_" . $hexDigits . "_" . $shortFileNameForJournalName . '.pointrelJournal';

$jsonToReturn = '"ERROR"';

// operation: exists

if ($operation == "exists") {
	if (file_exists($fullJournalFileName)) {
		// TODO: Can't replace this one because it has OK
		exit('{"status": "OK", "exists": true, "message": "Journal file exists: ' . $shortFileNameForJournalName . '"}');
	} else {
		exit('{"status": "OK", "exists": false, "message": "Journal file does not exist: ' . $shortFileNameForJournalName . '"}');
	}
	// exitWithJSONStatusMessage("Journal file does not exist: '" . $shortFileNameForJournalName . "'", NO_FAILURE_HEADER, 0);
}

// operation: create
// Creates the journal, with the first entry being a JSON object that has a unique ID for this journal instance

if ($operation == "create") {
	if (file_exists($fullJournalFileName)) {
		exitWithJSONStatusMessage("Journal file already exists: '" . $fullJournalFileName . "'", NO_FAILURE_HEADER, 400);
	}
	
	// TODO: Should also put journalName in somehow
	$randomUUID = uniqid('pointrelJournalInstance:', true);
	// TODO: Maybe should use journalName passed in, but with replacement for any double quotes in it?
	$jsonForJournal = '{"journalName":"' . $shortFileNameForJournalName . '","versionUUID":"' . $randomUUID . '"}';
	$firstLineHeader = "$jsonForJournal\n";

	createJournalFile($fullJournalFileName, $firstLineHeader);
	// Return a nested json object instead of a string
	$jsonToReturn = rtrim($firstLineHeader);
}

// operation: delete userSuppliedHeader userSuppliedSize

if ($operation == "delete") {
	validateFileExistsOrDie($fullJournalFileName);
	
	// Check that header info and size are correct; header must be in canonical form as supplied
	$userSuppliedHeader = $_POST['userSuppliedHeader'];
	
	if (empty($userSuppliedHeader)) {
		exitWithJSONStatusMessage("No userSuppliedHeader was specified", NO_FAILURE_HEADER, 400);
	}
	
	$userSuppliedSize = $_POST['userSuppliedSize'];
	
	if ($userSuppliedSize == "") {
		exitWithJSONStatusMessage("No userSuppliedSize was specified", NO_FAILURE_HEADER, 400);
	}
	
	$fh = fopen($fullJournalFileName, 'r+b');
	if (flock($fh, LOCK_EX)) {
		$stat = fstat($fh);
		$size = $stat['size'];
		if ($size != $userSuppliedSize) {
			fclose($fh);
			exitWithJSONStatusMessage("Current journal size: $size was not as supplied: $userSuppliedSize", NO_FAILURE_HEADER, 409);
		}
		
		$firstLineHeader = fgets($fh);
		$firstLineHeader = rtrim($firstLineHeader);
		if ($firstLineHeader != $userSuppliedHeader) {
			fclose($fh);
			exitWithJSONStatusMessage("Current journal header: $firstLineHeader was not as supplied: $userSuppliedHeader", NO_FAILURE_HEADER, 409);
		}
		fseek($fh, 0);
		// Temporarily set value to delete to prevent other process updating it while try to unlink
		fwrite($fh, "DELETED");
		fflush($fh);
		ftruncate($fh, strlen("DELETED"));
		flock($fh, LOCK_UN);
		fclose($fh);
		unlink($fullJournalFileName);
		$jsonToReturn = '"DELETED"';
	} else {
		exitWithJSONStatusMessage("Could not lock the journal file for deleting: '$fullJournalFileName'", NO_FAILURE_HEADER, 500);
	}
		
}

// operation: info

if ($operation == "info") {
	validateFileExistsOrDie($fullJournalFileName);
	$fh = fopen($fullJournalFileName, 'rb');
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
		exitWithJSONStatusMessage("Could not lock the journal file for info: '$fullJournalFileName'", NO_FAILURE_HEADER, 500);
	}		
}

// operation: get
// This may return JSON if there is an error; otherwise it returns the byte data in that section of file

if ($operation == "get") {
	validateFileExistsOrDie($fullJournalFileName);
	
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
	$fh = fopen($fullJournalFileName, 'rb');
	if (flock($fh, LOCK_EX)) {
		if ($length == "END") {
			$stat = fstat($fh);
			$length = $stat['size'];
		}
		if ($length != 0) {
			$contentsPartial = fread($fh, $length);
		} else {
			$contentsPartial = "";
		}
		flock($fh, LOCK_UN);
		fclose($fh);
	} else {
		exitWithJSONStatusMessage("Could not lock the journal file for get: '$fullJournalFileName'", NO_FAILURE_HEADER, 500);
	}
	
	if ($contentsPartial == FALSE) {
		// $jsonToReturn = '"FAILED"';
		exitWithJSONStatusMessage("Could not read the journal file for get: '$fullJournalFileName'", NO_FAILURE_HEADER, 500);
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
	validateFileExistsOrDie($fullJournalFileName);
	
	$encodedContent = $_POST['encodedContent'];
	if (empty($encodedContent)) {
		exitWithJSONStatusMessage("No encodedContent was specified", NO_FAILURE_HEADER, 400);
	}	
	
	$content = base64_decode($encodedContent);
	
	// TODO: Could check that it is valid JSON content
	appendDataToJournalFile($fullJournalFileName, $content . "\n");
	
	$jsonToReturn = '"ADDED"';
}

// header("Content-type: application/json; charset=UTF-8");
header("Content-type: application/json");
echo '{"status": "OK", "message": "Successful operation: ' . $operation . '", "journalName": "' . $journalName . '", "result": ' . $jsonToReturn . '}';


