// Test at: http://localhost:8080/pointrel/pointrel-app/

console.log("Pointrel20130202 server for nodejs started: " + Date());

console.log("__dirname", __dirname);

var express = require('express');
var app = express();

app.use(express.static(__dirname + '/..'));

app.listen(8080);