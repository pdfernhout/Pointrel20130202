<?php
$_POST['userID'] = "pdfernhout@example.com";
$_POST['journalName'] = "test_foo";
$_POST['operation'] = "exists";

include "../../server/journal-store.php";
