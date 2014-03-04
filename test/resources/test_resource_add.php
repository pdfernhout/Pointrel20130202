<?php
ini_set('display_errors', 'On');
error_reporting(E_ALL);
chdir("../../pointrel/pointrel-app/server/");

$_SERVER['REQUEST_METHOD'] = "POST";
$_SERVER['REMOTE_ADDR'] = "localhost-TEST";

$_POST['userID'] = "tester@example.com";

$resourceContent = "Hello world test at: " . time();
$resourceLength = strlen($resourceContent);
$resourceExtension = "txt";
// $resourceSHA256 = hash("sha256", $resourceContent + "ERROR");
$resourceSHA256 = hash("sha256", $resourceContent);

// $_POST['resourceURI'] = "foo";
// $_POST['resourceURI'] = "pointrel:";
// $_POST['resourceURI'] = "pointrel://";
// $_POST['resourceURI'] = "pointrel://foo";
// $_POST['resourceURI'] = "pointrel://sha256_foo";
// $_POST['resourceURI'] = "pointrel://sha256_foo_3.txt";
$_POST['resourceURI'] = "pointrel://sha256_{$resourceSHA256}_$resourceLength.$resourceExtension";

$_POST['resourceContent'] = base64_encode($resourceContent);


include "resource-add.php";
