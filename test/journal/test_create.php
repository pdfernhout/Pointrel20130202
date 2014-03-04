<?php
chdir("../../pointrel/pointrel-app/server/");

$_POST['userID'] = "pdfernhout@example.com";
$_POST['journalName'] = "test_foo";
$_POST['operation'] = "create";

include "journal-store.php";
