// Test at: http://localhost:8080/pointrel/pointrel-app/
"use strict";

console.log("Pointrel20130202 server for nodejs started: " + Date());

console.log("__dirname", __dirname);

var express = require('express');
var app = express();

var logger = function(request, response, next) {
    console.log("Requesting:", request.url);
    next();
}

app.use(logger);

app.use("/pointrel", express.static(__dirname + "/../pointrel"));

app.get("/", function (request, response) {
  response.send('Hello World!');
});

app.post("/pointrel/pointrel-app/server/variable-query.php", function (request, response) {
	response.send('{"response": "BAD!!!!"}');
});

var server = app.listen(8080, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log("Pointrel20130202 app listening at http://%s:%s", host, port);
});