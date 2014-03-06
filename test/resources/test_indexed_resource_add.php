<?php
ini_set('display_errors', 'On');
error_reporting(E_ALL);
chdir("../../pointrel/pointrel-app/server/");

$_SERVER['REQUEST_METHOD'] = "POST";
$_SERVER['REMOTE_ADDR'] = "localhost-TEST";

$_POST['userID'] = "tester@example.com";

// $resourceContent = '{"_pointrelIndexing":["TestIndexing2"],"type":"test","time":"' . time() . '"}';
$resourceContent = '{"_pointrelIndexing":["TestIndexing"],"type":"test","time":"' . time() . '"}';
$resourceLength = strlen($resourceContent);
$resourceExtension = "TestExample.pce.json";
$resourceSHA256 = hash("sha256", $resourceContent);

$_POST['resourceURI'] = "pointrel://sha256_{$resourceSHA256}_$resourceLength.$resourceExtension";

$_POST['resourceContent'] = base64_encode($resourceContent);

include "resource-add.php";
