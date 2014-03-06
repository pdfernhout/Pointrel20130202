<?php
chdir("../server/");
include "pointrel_utils.php";
header("Content-Type: text/plain");

// Move variables from base variable directory to subdirectories
// Comment the next line if you need to run this
if (true) exit("You probably don't need to run this");

$needingToBeMovedDirectoryFullPath = $pointrelVariablesDirectory;

echo "moving all variable files from: $needingToBeMovedDirectoryFullPath\n\n";

if (!file_exists($needingToBeMovedDirectoryFullPath)) exit("No such directory: $needingToBeMovedDirectoryFullPath");

// TODO: These would not be put in the index of all variables

function move($entry) {
    echo "going to move resource file from: $entry\n";
    global $pointrelVariablesDirectory;
    $variableName = substr($entry, strlen("variable_"));
    echo "Intermediate: $variableName\n";
    $variableName = substr($variableName, 0, -strlen(".txt"));
    echo "Variable name: $variableName\n";

    $shortName = $variableName;
    $hexDigits = md5($variableName);

    $createSubdirectories = true;
    $storagePath = calculateStoragePath($pointrelVariablesDirectory, $hexDigits, VARIABLE_STORAGE_LEVEL_COUNT, VARIABLE_STORAGE_SEGMENT_LENGTH, $createSubdirectories);

    $fullName = $storagePath . "variable_" . $hexDigits . "_" . $shortName . '.txt';

    echo "new path will be: $fullName\n";
    $moveResult = rename($pointrelVariablesDirectory . $entry, $fullName);
    echo "move result: $moveResult\n\n";
    return $moveResult;
}

if ($handle = opendir($needingToBeMovedDirectoryFullPath)) {
    $moveCount = 0;
    while (false !== ($entry = readdir($handle))) {
        if ($entry != "." && $entry != ".." && startsWith($entry, "variable_")) {
            echo "$entry\n";
            $moveResult = move($entry);
            if ($moveResult) $moveCount++;
        }
    }
    closedir($handle);
    echo "moved $moveCount resources";
}