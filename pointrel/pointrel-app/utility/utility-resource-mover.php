<?php
chdir("../server/");
include "pointrel_utils.php";
header("Content-Type: text/plain");

// Move resources from NeedingToBeMoved directory

$needingToBeMovedDirectoryFullPath = $pointrelResourcesDirectory . "NeedingToBeMoved/";

echo "moving all pointrel resources from: $needingToBeMovedDirectoryFullPath\n\n";

if (!file_exists($needingToBeMovedDirectoryFullPath)) exit("No such directory: $needingToBeMovedDirectoryFullPath");

// TODO: These would not be put in the index of all resources

function move($entry, $urlInfo) {
    echo "going to move resource file from: $entry\n";
    global $pointrelResourcesDirectory;
    $shortName = $urlInfo["shortName"];
    $hexDigits = $urlInfo["hexDigits"];
    $uriSpecifiedLength = $urlInfo["length"];

    $contentLength = filesize($entry);

    if ($uriSpecifiedLength != $contentLength) {
        echo('Lengths do not agree from URI: ' . $uriSpecifiedLength . ' and from content: ' . $contentLength);
        return false;
    }

    $createSubdirectories = true;
    $storagePath = calculateStoragePath($pointrelResourcesDirectory, $hexDigits, RESOURCE_STORAGE_LEVEL_COUNT, RESOURCE_STORAGE_SEGMENT_LENGTH, $createSubdirectories);
    $fullName = $storagePath . $shortName;
    echo "new path will be: $fullName\n";
    $moveResult = rename($entry, $fullName);
    echo "move result: $moveResult\n\n";
    return $moveResult;
}

if ($handle = opendir($needingToBeMovedDirectoryFullPath)) {
    $moveCount = 0;
    while (false !== ($entry = readdir($handle))) {
        if ($entry != "." && $entry != ".." && startsWith($entry, "sha256_")) {
            echo "$entry ";
            // TODO: Maybe do not exit and do the rest...
            $urlInfo = validateURIOrExit("pointrel://" . $entry);
            echo "validates OK\n";
            $moveResult = move($needingToBeMovedDirectoryFullPath . $entry, $urlInfo);
            if ($moveResult) $moveCount++;
        }
    }
    closedir($handle);
    echo "moved $moveCount resources";
}