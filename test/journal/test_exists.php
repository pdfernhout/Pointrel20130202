<?php
ini_set('display_errors', 'On');
error_reporting(E_ALL);
chdir("../../pointrel/pointrel-app/server/");

$_SERVER['REQUEST_METHOD'] = "POST";
$_SERVER['REMOTE_ADDR'] = "localhost-TEST";

$_POST['userID'] = "pdfernhout@example.com";
$_POST['journalName'] = "test_foo";
$_POST['operation'] = "exists";

include "journal-store.php";
