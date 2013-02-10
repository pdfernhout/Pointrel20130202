define("pointrel", ["dojo/_base/xhr"], function (xhr) {

    var pointrel = {};

    // TODO: A no-op for now...
    function EncodeAsUTF8(text) {
        return text
    }

    // TODO: Add callback for success and errors
    function pointrel_resource_add(originalDataString, extension) {
        console.log("pointrel_resource_add extension: " + extension);
        var encodedContent = EncodeAsUTF8(originalDataString);
        // var hash = CryptoJS.SHA3(encodedContent, { outputLength: 256 });
        // var myName = "pointrel://sha3-256_" + hash + "_" + encodedContent.length + "." + extension;
        var hash = CryptoJS.SHA256(encodedContent);
        var extensionSeperator = ".";
        if (extension == "") extensionSeperator = "";
        var uri = "pointrel://sha256_" + hash + "_" + encodedContent.length + extensionSeperator + extension;

        var request = {
            url: "resource-add.php",
            content: {"resourceURI": uri, "resourceContent": encodedContent, "userID": "anonymous"},
            handleAs: "text",
            load: function (data) {
                //alert("POST result: '" + data + "'");
                // document.getElementById("response").innerHTML = data; // JSON.stringify(data);
                var parsedData = JSON.parse(data);
                if (parsedData.status == "OK") {
                    if (typeof(callback) == "function") callback(null, parsedData);
                } else {
                    if (typeof(callback) == "function") callback("FAILED", parsedData);
                }
            },
            error: function (error, other) {
                console.log("error", error, other);
                alert("POST resource add error: " + error);
                // TODO: improve error reporting
                if (typeof(callback) == "function") callback("ERROR", error, other);
            }
        };

        xhr.post(request);

        console.log("pointrel_resource_add returning: " + uri);
        return uri;
    }

    function pointrel_resource_get(uri, callback) {
        console.log("pointrel_resource_get: " + uri);
        var request = {
            url: "resource-get.php",
            content: {"resourceURI": uri, "userID": "anonymous"},
            handleAs: "text",
            load: function (data) {
                //alert("GET result: '" + data + "'");
                // document.getElementById("retrieve").innerHTML = data;
                if (typeof(callback) == "function") callback(null, data);
            },
            error: function (error, other) {
                console.log("error", error, other);
                alert("GET resource get error: " + error);
                // TODO: improve error reporting
                if (typeof(callback) == "function") callback("ERROR", error, other);
            }
        };

        xhr.get(request);

        // alert("sent request: " + JSON.stringify(request));
        // document.getElementById("query").innerHTML = "Waiting... on " + JSON.stringify(request);
    }

    function pointrel_variable_get(variableName, callback) {
        console.log("pointrel_variable_get: " + variableName);
        var request = {
            url: "variable-query.php",
            content: {"variableName": variableName, "operation": "get", "userID": "anonymous"},
            handleAs: "text",
            load: function (data) {
                // alert("GET result: '" + data + "'");
                // document.getElementById("retrieve").innerHTML = data;
                var parsedData = JSON.parse(data);
                if (parsedData.status == "OK") {
                    if (typeof(callback) == "function") callback(null, parsedData);
                } else {
                    if (typeof(callback) == "function") callback("FAILED", parsedData);
                }
            },
            error: function (error, other) {
                console.log("error", error, other);
                alert("POST variable get error: " + error);
                // TODO: improve error reporting
                if (typeof(callback) == "function") callback("ERROR", error, other);
            }
        };

        xhr.post(request);

        // alert("sent request: " + JSON.stringify(request));
        // document.getElementById("query").innerHTML = "Waiting... on " + JSON.stringify(request);
    }

    function pointrel_variable_set(variableName, oldVersionURI, newVersionURI, callback) {
        console.log("pointrel_resource_set: " + variableName + " old: " + oldVersionURI + "new: " + newVersionURI);
        var request = {
            url: "variable-query.php",
            content: {"variableName": variableName, "operation": "set", "currentValue": oldVersionURI, "newValue": newVersionURI, "userID": "anonymous"},
            handleAs: "text",
            load: function (data) {
                // alert("GET result: '" + data + "'");
                // document.getElementById("retrieve").innerHTML = data;
                var parsedData = JSON.parse(data);
                if (parsedData.status == "OK") {
                    if (typeof(callback) == "function") callback(null, parsedData);
                } else {
                    if (typeof(callback) == "function") callback("FAILED", parsedData);
                }
            },
            error: function (error, other) {
                console.log("error", error, other);
                alert("POST variable set error: " + error);
                // TODO: improve error reporting
                if (typeof(callback) == "function") callback("ERROR", error, other);
            }
        };

        xhr.post(request);

        // alert("sent request: " + JSON.stringify(request));
        // document.getElementById("query").innerHTML = "Waiting... on " + JSON.stringify(request);
    }

    pointrel.resource_add = pointrel_resource_add;
    pointrel.resource_get = pointrel_resource_get;
    pointrel.variable_get = pointrel_variable_get;
    pointrel.variable_set = pointrel_variable_set;
    return pointrel;
});
