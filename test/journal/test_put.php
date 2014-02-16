<?php
$_POST['userID'] = "pdfernhout@example.com";
$_POST['journalName'] = "test_foo";
$_POST['operation'] = "put";

$testJSON = '{"test":"Hello, world"}\n';
$encodedJSON = base64_encode($testJSON);

$_POST['encodedContent'] = $encodedJSON;

include "../../server/journal-store.php";
