<?php
ini_set('display_errors', 'On');
error_reporting(E_ALL);

$result = json_encode("hello");
echo $result;
echo "\n";

$result = json_encode("hello\nnewline");
echo $result;
echo "\n";

$result = json_encode('this "string" has embedded quotes');
echo $result;
echo "\n";

$result = json_encode('pointrel://sha256_514034ca7bc04e802197cfa68dcba9662c2dc83f9101ea8a8f73929ef01dfa0b_31.txt');
echo $result;
echo "\n";
