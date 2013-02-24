// Need to load jstorage and pointrel_authentication first

// TODO: Might need to think about decoding URLs passed back to user and encoding them for variables

// TODO: Add callback for success and errors
// Data passed to this needs to be only characters in the range 0-255 (byte)
// That means you should encode and decode text using the UTF8 functions above if needed
function pointrel_resource_add(originalDataString, extension, callback) {
    console.log("pointrel_resource_add extension: " + extension);
    // special validation for now
    if (!validateBinaryData(originalDataString)) { callback("FAILED Not Binary Data", null); return ""; }

    // var shortExtension = extension.split(".").pop();
    // Maybe need a parameter -- expect these to be encoded as they go over the network
//    if (shortExtension == "txt" || shortExtension == "json") {
//        var encodedContent = EncodeAsUTF8(originalDataString);
//    } else {
//        encodedContent = originalDataString;
//    }
    // var encodedExtension = EncodeAsUTF8(extension);
    // var hash = CryptoJS.SHA3(encodedContent, { outputLength: 256 });
    // var myName = "pointrel://sha3-256_" + hash + "_" + encodedContent.length + "." + encodedExtension;
    var hash = CryptoJS.SHA256(originalDataString);
    // var hash = CryptoJS.SHA256(encodedContent);
    var extensionSeperator = ".";
    if (extension == "") extensionSeperator = "";
    var uri = "pointrel://sha256_" + hash + "_" + originalDataString.length + extensionSeperator + extension;

    var request = {
        type: "POST",
        url: "server/resource-add.php",
        // Need to pass original data string as it will be utf-8 encoded by jQuery
        data: {"resourceURI": uri, "resourceContent": base64_encode(originalDataString), "userID": $.pointrel_authentication.getUserIDOrAnonymous()},
        dataType: "text",
        // cache: false,
        success: function (data) {
            // alert("POST success status: " + statusThing);
            //alert("POST result: '" + data + "'");
            // document.getElementById("response").innerHTML = data; // JSON.stringify(data);
            var parsedData = JSON.parse(data);
            if (parsedData.status == "OK") {
                if (typeof(callback) == "function") callback(null, parsedData);
            } else {
                if (typeof(callback) == "function") callback("FAILED", parsedData);
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert("POST xhr.status: " + xhr.status);
            // alert("POST xhr: " + xhr);
            alert("POST thrownError : " + thrownError);
            // TODO: improve error reporting
            if (typeof(callback) == "function") callback("ERROR", xhr);
        }
    };

    $.ajax(request);

    console.log("pointrel_resource_add returning: " + uri);
    return uri;
}

function pointrel_resource_get(uri, callback) {
    console.log("pointrel_resource_get: " + uri);
    var request = {
        type: "GET",
        url: "server/resource-get.php",
        data: {"resourceURI": uri, "userID": $.pointrel_authentication.getUserIDOrAnonymous()},
        dataType: "text",
        // cache: false,
        success: function (data) {
            // Seems like this is done by jQuery??? data = DecodeFromUTF8(data);
            // alert("GET success status: " + statusThing);
            // alert("GET result: '" + data + "'");
            // document.getElementById("retrieve").innerHTML = data;
            if (typeof(callback) == "function") callback(null, data);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert("GET xhr.status: " + xhr.status);
            // alert("GET xhr: " + xhr);
            alert("GET thrownError : " + thrownError);
            // TODO: improve error reporting
            if (typeof(callback) == "function") callback("ERROR", xhr);
        }
    };

    $.ajax(request);

    // alert("sent request: " + JSON.stringify(request));
    // document.getElementById("query").innerHTML = "Waiting... on " + JSON.stringify(request);
}

function pointrel_variable_get(variableName, callback) {
    console.log("pointrel_variable_get: " + variableName);
    // var encodedVariableName = EncodeAsUTF8(variableName);
    var request = {
        type: "POST",
        url: "server/variable-query.php",
        data: {"variableName": variableName, "operation": "get", "userID": $.pointrel_authentication.getUserIDOrAnonymous()},
        dataType: "text",
        // cache: false,
        success: function (data) {
            // alert("GET success status: " + statusThing);
            // alert("GET result: '" + data + "'");
            // document.getElementById("retrieve").innerHTML = data;
            var parsedData = JSON.parse(data);
            if (parsedData.status == "OK") {
                if (typeof(callback) == "function") callback(null, parsedData);
            } else {
                if (typeof(callback) == "function") callback("FAILED", parsedData);
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert("GET xhr.status: " + xhr.status);
            alert("GET xhr: " + xhr);
            alert("GET thrownError : " + thrownError);
            // TODO: improve error reporting
            if (typeof(callback) == "function") callback("ERROR", xhr);
        }
    };

    $.ajax(request);

    // alert("sent request: " + JSON.stringify(request));
    // document.getElementById("query").innerHTML = "Waiting... on " + JSON.stringify(request);
}

function pointrel_variable_set(variableName, oldVersionURI, newVersionURI, callback) {
    console.log("pointrel_resource_set: " + variableName + " old: " + oldVersionURI + "new: " + newVersionURI);
    // var encodedVariableName = EncodeAsUTF8(variableName);
    var request = {
        type: "POST",
        url: "server/variable-query.php",
        data: {"variableName": variableName, "operation": "set", "currentValue": oldVersionURI, "newValue": newVersionURI, "userID": $.pointrel_authentication.getUserIDOrAnonymous()},
        dataType: "text",
        // cache: false,
        success: function (data) {
            // alert("GET success status: " + statusThing);
            // alert("GET result: '" + data + "'");
            // document.getElementById("retrieve").innerHTML = data;
            var parsedData = JSON.parse(data);
            if (parsedData.status == "OK") {
                if (typeof(callback) == "function") callback(null, parsedData);
            } else {
                if (typeof(callback) == "function") callback("FAILED", parsedData);
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert("GET xhr.status: " + xhr.status);
            alert("GET xhr: " + xhr);
            alert("GET thrownError : " + thrownError);
            if (typeof(callback) == "function") callback("ERROR", xhr);
        }
    };

    $.ajax(request);

    // alert("sent request: " + JSON.stringify(request));
    // document.getElementById("query").innerHTML = "Waiting... on " + JSON.stringify(request);
}

