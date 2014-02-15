<?php
$_POST['userID'] = "pdfernhout@example.com";
$_POST['archiveName'] = "foo";
$_POST['operation'] = "delete";

# these need to be updated by hand to whatever was returned by test_info.php
$_POST['userSuppliedSize'] = 130;
$_POST['userSuppliedHeader'] = "{\"archiveName\":\"foo\",\"versionUUID\":\"jsonArchiveInstance:52fe53661e8540.35129252\"}";

include "../server/json_store.php";
