<?php
chdir("../../pointrel/pointrel-app/server/");

$_POST['userID'] = "pdfernhout@example.com";
$_POST['journalName'] = "test_foo";
$_POST['operation'] = "get";
$_POST['start'] = "10";
$_POST['length'] = "100";

include "journal-store.php";
