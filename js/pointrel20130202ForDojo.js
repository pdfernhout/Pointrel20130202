define("pointrel", ["dojo/_base/xhr"], function (xhr) {

    // Need to load jstorage and pointrel_authentication first

    // TODO: Might need to think about decoding URLs passed back to user and encoding them for variables

    var pointrel = {};

    // TODO: Add callback for success and errors
    // Data should be in 0-255 character range
    function pointrel_resource_add(originalDataString, extension, callback) {
        console.log("pointrel_resource_add extension: " + extension);

        // special validation for now
        if (!validateBinaryData(originalDataString)) { callback("FAILED Not Binary Data", null); return ""; }

        //var encodedContent = encodeAsUTF8(originalDataString);
        //var encodedExtension = encodeAsUTF8(extension);
        // var hash = CryptoJS.SHA3(encodedContent, { outputLength: 256 });
        // var myName = "pointrel://sha3-256_" + hash + "_" + encodedContent.length + "." + encodedExtension;
        // var hash = CryptoJS.SHA256(encodedContent);
        var hash = CryptoJS.SHA256(originalDataString);
        var extensionSeperator = ".";
        if (extension == "") extensionSeperator = "";
        var uri = "pointrel://sha256_" + hash + "_" + originalDataString.length + extensionSeperator + extension;

        var request = {
            url: "server/resource-add.php",
            // Need to pass original data string as it will be utf-8 encoded by dojo
            content: {"resourceURI": uri, "resourceContent": base64_encode(originalDataString), "userID": pointrel_authentication.getUserIDOrAnonymous()},
            headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
            handleAs: "json",
            load: function (data) {
                //alert("POST result: '" + data + "'");
                // document.getElementById("response").innerHTML = data; // JSON.stringify(data);
                if (data.status == "OK") {
                    if (typeof(callback) == "function") callback(null, data);
                } else {
                    if (typeof(callback) == "function") callback("FAILED", data);
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
            url: "server/resource-get.php",
            content: {"resourceURI": uri, "userID": pointrel_authentication.getUserIDOrAnonymous()},
            handleAs: "text",
            load: function (data) {
                // Guessing this is done by dojo??? data = DecodeFromUTF8(data);
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

    function pointrel_variable_new(variableName, newVersionURI, callback) {
        console.log("pointrel_resource_new: " + variableName + "new: " + newVersionURI);
        // var encodedVariableName = encodeAsUTF8(variableName);
        var request = {
            url: "server/variable-query.php",
            content: {"variableName": variableName, "operation": "new", "newValue": newVersionURI, "userID": pointrel_authentication.getUserIDOrAnonymous()},
            handleAs: "json",
            load: function (data) {
                // alert("GET result: '" + data + "'");
                // document.getElementById("retrieve").innerHTML = data;
                if (data.status == "OK") {
                    if (typeof(callback) == "function") callback(null, data);
                } else {
                    if (typeof(callback) == "function") callback("FAILED", data);
                }
            },
            error: function (error, other) {
                console.log("error", error, other);
                alert("POST variable new error: " + error);
                // TODO: improve error reporting
                if (typeof(callback) == "function") callback("ERROR", error, other);
            }
        };

        xhr.post(request);

        // alert("sent request: " + JSON.stringify(request));
        // document.getElementById("query").innerHTML = "Waiting... on " + JSON.stringify(request);
    }

    function pointrel_variable_get(variableName, callback) {
        console.log("pointrel_variable_get: " + variableName);
        // var encodedVariableName = encodeAsUTF8(variableName);
        var request = {
            url: "server/variable-query.php",
            content: {"variableName": variableName, "operation": "get", "userID": pointrel_authentication.getUserIDOrAnonymous()},
            handleAs: "json",
            load: function (data) {
                // alert("GET result: '" + data + "'");
                // document.getElementById("retrieve").innerHTML = data;
                if (data.status == "OK") {
                    if (typeof(callback) == "function") callback(null, data);
                } else {
                    if (typeof(callback) == "function") callback("FAILED", data);
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
        // var encodedVariableName = encodeAsUTF8(variableName);
        var request = {
            url: "server/variable-query.php",
            content: {"variableName": variableName, "operation": "set", "currentValue": oldVersionURI, "newValue": newVersionURI, "userID": pointrel_authentication.getUserIDOrAnonymous()},
            handleAs: "json",
            load: function (data) {
                // alert("GET result: '" + data + "'");
                // document.getElementById("retrieve").innerHTML = data;
                if (data.status == "OK") {
                    if (typeof(callback) == "function") callback(null, data);
                } else {
                    if (typeof(callback) == "function") callback("FAILED", data);
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

    function pointrel_variable_delete(variableName, oldVersionURI, callback) {
        console.log("pointrel_resource_set: " + variableName + " old: " + oldVersionURI);
        // var encodedVariableName = encodeAsUTF8(variableName);
        var request = {
            url: "server/variable-query.php",
            content: {"variableName": variableName, "operation": "delete", "currentValue": oldVersionURI, "userID": pointrel_authentication.getUserIDOrAnonymous()},
            handleAs: "json",
            load: function (data) {
                // alert("GET result: '" + data + "'");
                // document.getElementById("retrieve").innerHTML = data;
                if (data.status == "OK") {
                    if (typeof(callback) == "function") callback(null, data);
                } else {
                    if (typeof(callback) == "function") callback("FAILED", data);
                }
            },
            error: function (error, other) {
                console.log("error", error, other);
                alert("POST variable delete error: " + error);
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
    pointrel.variable_new = pointrel_variable_new;
    pointrel.variable_get = pointrel_variable_get;
    pointrel.variable_set = pointrel_variable_set;
    pointrel.variable_delete = pointrel_variable_delete;
    return pointrel;
});
