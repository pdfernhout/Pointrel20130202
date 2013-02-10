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
        type: "POST",
        url: "resource-add.php",
        data: {"resourceURI": uri, "resourceContent": encodedContent, "userID": "anonymous"},
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
        url: "resource-get.php",
        data: {"resourceURI": uri, "userID": "anonymous"},
        dataType: "text",
        // cache: false,
        success: function (data) {
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
    var request = {
        type: "POST",
        url: "variable-query.php",
        data: {"variableName": variableName, "operation": "get", "userID": "anonymous"},
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
    var request = {
        type: "POST",
        url: "variable-query.php",
        data: {"variableName": variableName, "operation": "set", "currentValue": oldVersionURI, "newValue": newVersionURI, "userID": "anonymous"},
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

