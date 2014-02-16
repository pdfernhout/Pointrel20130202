define("Pointrel", ["dojo/_base/xhr"], function (xhr) {

    // Need to load jstorage and pointrel_authentication first

    // TODO: Might need to think about decoding URLs passed back to user and encoding them for variables

    var pointrel = {};

    /// RESOURCES
    
    // TODO: Add callback for success and errors
    // Data should be in 0-255 character range
    function pointrel_resource_add(serverURL, credentials, originalDataString, extension, callback) {
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
            url: serverURL + "resource-add.php",
            // TODO: Is this comment out of date?
            // Need to pass original data string as it will be utf-8 encoded by dojo
            content: {"resourceURI": uri, "resourceContent": base64_encode(originalDataString), "userID": pointrel_authentication.userIDFromCredentials(credentials)},
            // TODO: Are these headers really needed? They are not used in the other requests, although this one has encoded data
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

    function pointrel_resource_get(serverURL, credentials, uri, callback) {
        console.log("pointrel_resource_get: " + uri);
        var request = {
            url: serverURL + "resource-get.php",
            content: {"resourceURI": uri, "userID": pointrel_authentication.userIDFromCredentials(credentials)},
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

    function pointrel_resource_publish(serverURL, credentials, resourceURI, destinationURL, callback) {
        console.log("pointrel_resource_publish: " + resourceURI + " to: " + destinationURL);
        var request = {
            url: serverURL + "resource-publish.php",
            content: {"resourceURI": resourceURI, "destinationURL": destinationURL, "userID": pointrel_authentication.userIDFromCredentials(credentials)},
            handleAs: "json",
            load: function (data) {
                // Guessing this is done by dojo??? data = DecodeFromUTF8(data);
                //alert("GET result: '" + data + "'");
                // document.getElementById("retrieve").innerHTML = data;
                if (typeof(callback) == "function") callback(null, data);
            },
            error: function (error, other) {
                console.log("error", error, other);
                alert("GET resource publish error: " + error);
                // TODO: improve error reporting
                if (typeof(callback) == "function") callback("ERROR", error, other);
            }
        };

        xhr.post(request);

        // alert("sent request: " + JSON.stringify(request));
        // document.getElementById("query").innerHTML = "Waiting... on " + JSON.stringify(request);
    }
    
    ///// VARIABLES

    function pointrel_variable_new(serverURL, credentials, variableName, newVersionURI, callback) {
        console.log("pointrel_resource_new: " + variableName + "new: " + newVersionURI);
        // var encodedVariableName = encodeAsUTF8(variableName);
        var request = {
            url: serverURL + "variable-query.php",
            content: {"variableName": variableName, "operation": "new", "newValue": newVersionURI, "userID": pointrel_authentication.userIDFromCredentials(credentials)},
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

    function pointrel_variable_get(serverURL, credentials, variableName, callback) {
        console.log("pointrel_variable_get: " + variableName);
        // var encodedVariableName = encodeAsUTF8(variableName);
        var request = {
            url: serverURL + "variable-query.php",
            content: {"variableName": variableName, "operation": "get", "userID": pointrel_authentication.userIDFromCredentials(credentials)},
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

    function pointrel_variable_set(serverURL, credentials, variableName, oldVersionURI, newVersionURI, callback) {
        console.log("pointrel_resource_set: " + variableName + " old: " + oldVersionURI + "new: " + newVersionURI);
        // var encodedVariableName = encodeAsUTF8(variableName);
        var request = {
            url: serverURL + "variable-query.php",
            content: {"variableName": variableName, "operation": "set", "currentValue": oldVersionURI, "newValue": newVersionURI, "userID": pointrel_authentication.userIDFromCredentials(credentials)},
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

    function pointrel_variable_delete(serverURL, credentials, variableName, oldVersionURI, callback) {
        console.log("pointrel_resource_set: " + variableName + " old: " + oldVersionURI);
        // var encodedVariableName = encodeAsUTF8(variableName);
        var request = {
            url: serverURL + "variable-query.php",
            content: {"variableName": variableName, "operation": "delete", "currentValue": oldVersionURI, "userID": pointrel_authentication.userIDFromCredentials(credentials)},
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
    
    ///// JOURNALS
    
    function pointrel_journal_ajax(operation, serverURL, credentials, journalName, callback, extra) {
        console.log("pointrel_journal_" + operation + ": " + journalName);
        // var encodedJournalName = encodeAsUTF8(journalName);
        
        // Build merged content with extra fields if needed
        var content = {"journalName": journalName, "operation": operation, "userID": pointrel_authentication.userIDFromCredentials(credentials)};
        for (var attributeName in extra) {
            if (extra.hasOwnProperty(attributeName)) { content[attributeName] = extra[attributeName]; }
        }
        
        var request = {
            url: serverURL + "journal-store.php",
            content: content,
            handleAs: "json",
            load: function (data) {
                // alert("GET result: '" + data + "'");
                // document.getElementById("retrieve").innerHTML = data;
                if (data.status == "OK") {
                	if (operation == "get") data.result = base64_decode(data.result);
                    if (typeof(callback) == "function") callback(null, data);
                } else {
                    if (typeof(callback) == "function") callback("FAILED", data);
                }
            },
            error: function (error, other) {
                console.log("error", error, other);
                alert("POST journal " + operation + " error: " + error);
                // TODO: improve error reporting
                if (typeof(callback) == "function") callback("ERROR", error, other);
            }
        };

        xhr.post(request);

        // alert("sent request: " + JSON.stringify(request));
        // document.getElementById("query").innerHTML = "Waiting... on " + JSON.stringify(request);
    }
    
    function pointrel_journal_exists(serverURL, credentials, journalName, callback) {
        pointrel_journal_ajax("exist", serverURL, credentials, journalName, callback, {});
    }
    
    function pointrel_journal_create(serverURL, credentials, journalName, callback) {
        pointrel_journal_ajax("create", serverURL, credentials, journalName, callback, {});
    }
    
    function pointrel_journal_delete(serverURL, credentials, journalName, header, size, callback) {
        pointrel_journal_ajax("delete", serverURL, credentials, journalName, callback, {userSuppliedHeader: header, userSuppliedSize: size});
    }
    
    function pointrel_journal_info(serverURL, credentials, journalName, callback) {
        pointrel_journal_ajax("info", serverURL, credentials, journalName, callback, {});
    }
    
    function pointrel_journal_get(serverURL, credentials, journalName, start, length, callback) {
        pointrel_journal_ajax("get", serverURL, credentials, journalName, callback, {start: start, length: length});
    }
    
    function pointrel_journal_put(serverURL, credentials, journalName, contentStringToAppend, callback) {
        var encodedContent = base64_encode(contentStringToAppend);
        // Maybe needed: headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
        pointrel_journal_ajax("put", serverURL, credentials, journalName, callback, {encodedContent: encodedContent});
    }
    
    /// EXPORT

    pointrel.resource_add = pointrel_resource_add;
    pointrel.resource_get = pointrel_resource_get;
    pointrel.resource_publish = pointrel_resource_publish;
    
    pointrel.variable_new = pointrel_variable_new;
    pointrel.variable_get = pointrel_variable_get;
    pointrel.variable_set = pointrel_variable_set;
    pointrel.variable_delete = pointrel_variable_delete;
    
    pointrel.journal_exists = pointrel_journal_exists;
    pointrel.journal_create = pointrel_journal_create;
    pointrel.journal_delete = pointrel_journal_delete;
    pointrel.journal_info = pointrel_journal_info;
    pointrel.journal_get = pointrel_journal_get;
    pointrel.journal_put = pointrel_journal_put;
    
    return pointrel;
});
