// Test at: http://localhost:8080/pointrel/pointrel-app/
"use strict";

function journalStore(request, response) {
	response.send('{"response": "Unfinished!!!!"}');
}

function resourceAdd(request, response) {
	response.send('{"response": "Unfinished!!!!"}');
}

function resourceGet(request, response) {
	response.send('{"response": "Unfinished!!!!"}');
}

function resourcePublish(request, response) {
	response.send('{"response": "Unfinished!!!!"}');
}

function variableQuery(request, response) {
	response.send('{"response": "Unfinished!!!!"}');
}

// Main code

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

app.post("/pointrel/pointrel-app/server/journal-store.php", function (request, response) {
	journalStore(request, response);
})

app.post("/pointrel/pointrel-app/server/resource-add.php", function (request, response) {
	resourceAdd(request, response);
});

app.post("/pointrel/pointrel-app/server/resource-get.php", function (request, response) {
	resourceGet(request, response);
})

app.post("/pointrel/pointrel-app/server/resource-publish.php", function (request, response) {
	resourcePublish(request, response);
})

app.post("/pointrel/pointrel-app/server/variable-query.php", function (request, response) {
	variableQuery(request, response);
})

var server = app.listen(8080, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log("Pointrel20130202 app listening at http://%s:%s", host, port);
});