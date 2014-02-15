<?php
$_POST['userID'] = "pdfernhout@example.com";
$_POST['archiveName'] = "foo";
$_POST['operation'] = "get";
$_POST['start'] = "10";
$_POST['length'] = "100";

include "../server/json_store.php";
