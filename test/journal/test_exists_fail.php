<?php
$_POST['userID'] = "pdfernhout@example.com";
$_POST['journalName'] = "test_foo_fail";
$_POST['operation'] = "exists";

include "../../server/journal-store.php";
