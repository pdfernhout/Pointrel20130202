<?php
ini_set('display_errors', 'On');
error_reporting(E_ALL);
chdir("../../pointrel/pointrel-app/server/");

$sampleURI1 = "pointrel://sha256_2e99758548972a8e8822ad47fa1017ff72f06f3ff6a016851f45c398732bc50c_14.txt";

$_SERVER['REQUEST_METHOD'] = "POST";
$_SERVER['REMOTE_ADDR'] = "localhost-TEST";

$_POST['userID'] = "tester@example.com";
$_POST['variableName'] = "test_001";
$_POST['operation'] = "new";
$_POST['newValue'] = $sampleURI1;

include "variable-query.php";
