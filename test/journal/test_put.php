<?php
$_POST['userID'] = "pdfernhout@example.com";
$_POST['archiveName'] = "foo";
$_POST['operation'] = "put";

$testJSON = '{"test":"Hello, world"}';
$encodedJSON = base64_encode($testJSON);

$_POST['encodedContent'] = $encodedJSON;

include "../server/json_store.php";
