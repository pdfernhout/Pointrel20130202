<?php
chdir("../../pointrel/pointrel-app/server/");

$_POST['userID'] = "pdfernhout@example.com";
$_POST['journalName'] = "test_foo";
$_POST['operation'] = "exists";

include "journal-store.php";
