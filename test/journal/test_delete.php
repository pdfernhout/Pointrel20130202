<?php
ini_set('display_errors', 'On');
error_reporting(E_ALL);
chdir("../../pointrel/pointrel-app/server/");

$_SERVER['REQUEST_METHOD'] = "POST";
$_SERVER['REMOTE_ADDR'] = "localhost-TEST";

$_POST['userID'] = "tester@example.com";
$_POST['journalName'] = "test_foo";
$_POST['operation'] = "delete";

# these need to be updated by hand to whatever was returned by test_info.php
$_POST['userSuppliedSize'] = 130;
$_POST['userSuppliedHeader'] = "{\"journalName\":\"foo\",\"versionUUID\":\"jsonArchiveInstance:52fe53661e8540.35129252\"}";

include "journal-store.php";
