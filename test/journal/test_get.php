<?php
ini_set('display_errors', 'On');
error_reporting(E_ALL);
chdir("../../pointrel/pointrel-app/server/");

$_SERVER['REQUEST_METHOD'] = "POST";
$_SERVER['REMOTE_ADDR'] = "localhost-TEST";

$_POST['userID'] = "pdfernhout@example.com";
$_POST['journalName'] = "test_foo";
$_POST['operation'] = "get";
$_POST['start'] = "10";
$_POST['length'] = "100";

include "journal-store.php";
