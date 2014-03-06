<?php
// Utility application you probably won't use that takes a file with a list of variable names and creates log entries for them
// It wos used to help create log entries for existing variables when the indexing was first added

ini_set('display_errors', 'On');
error_reporting(E_ALL);

// Fill this file with the names of the variables, one per line
$variables = file("existing_variables.txt");

chdir("../pointrel/pointrel-app/server/");

include "pointrel_utils.php";

$timestamp = currentTimeStamp();

// Put in a user ID
$userID = "YourUserID@example.com";

foreach ($variables as $variable) {
	$variable = trim($variable);
	echo "Variable: '$variable'\n";
	addNewVariableToIndexes($variable, $timestamp, $userID);
}