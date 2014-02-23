// Need to load jstorage, pointrel_authentication, and utils_common. first

var Pointrel = (function () {
    var pointrel = {};

    //////// RESOURCES

    // TODO: Might need to think about decoding URLs passed back to user and encoding them for variables

    // TODO: Add callback for success and errors
    // Data passed to this needs to be only characters in the range 0-255 (byte)
    // That means you should encode and decode text using the UTF8 functions above if needed
    function pointrel_resource_add(serverURL, credentials, originalDataString, extension, callback) {
        console.log("pointrel_resource_add extension: ", extension);
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
            url: serverURL + "resource-add.php",
            // Need to pass original data string as it will be utf-8 encoded by jQuery
            data: {"resourceURI": uri, "resourceContent": base64_encode(originalDataString), "userID": pointrel_authentication.userIDFromCredentials(credentials)},
            dataType: "json",
            // cache: false,
            success: function (data) {
                // alert("POST success status: " + statusThing);
                //alert("POST result: '" + data + "'");
                // document.getElementById("response").innerHTML = JSON.stringify(data);
                if (data.status == "OK") {
                    if (typeof(callback) == "function") callback(null, data);
                } else {
                    if (typeof(callback) == "function") callback("FAILED", data);
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

        console.log("pointrel_resource_add returning: ", uri);
        return uri;
    }

    function pointrel_resource_get(serverURL, credentials, uri, callback) {
        console.log("pointrel_resource_get: ", uri);
        var request = {
            type: "GET",
            url: serverURL + "resource-get.php",
            data: {"resourceURI": uri, "userID": pointrel_authentication.userIDFromCredentials(credentials)},
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

    function pointrel_resource_publish(serverURL, credentials, resourceURI, destinationURL, callback) {
        console.log("pointrel_resource_publish: ", resourceURI, " to: ", destinationURL);
        var request = {
            type: "POST",
            url: serverURL + "resource-publish.php",
            data: {"resourceURI": resourceURI, "destinationURL": destinationURL, "userID": pointrel_authentication.userIDFromCredentials(credentials)},
            dataType: "json",
            success: function (data) {
                // Guessing this is done by dojo??? data = DecodeFromUTF8(data);
                //alert("GET result: '" + data + "'");
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

    //////// VARIABLES

    function pointrel_variable_new(serverURL, credentials, variableName, newValue, callback) {
        console.log("pointrel_variable_new: ", variableName);
        // var encodedVariableName = EncodeAsUTF8(variableName);
        var request = {
            type: "POST",
            url: serverURL + "variable-query.php",
            data: {"variableName": variableName, "operation": "new", "newValue": newValue, "userID": pointrel_authentication.userIDFromCredentials(credentials)},
            dataType: "json",
            // cache: false,
            success: function (data) {
                // alert("GET success status: " + statusThing);
                // alert("GET result: '" + data + "'");
                // document.getElementById("retrieve").innerHTML = data;
                if (data.status == "OK") {
                    if (typeof(callback) == "function") callback(null, data);
                } else {
                    if (typeof(callback) == "function") callback("FAILED", data);
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

    function pointrel_variable_get(serverURL, credentials, variableName, callback) {
        console.log("pointrel_variable_get: ", variableName);
        // var encodedVariableName = EncodeAsUTF8(variableName);
        var request = {
            type: "POST",
            url: serverURL + "variable-query.php",
            data: {"variableName": variableName, "operation": "get", "userID": pointrel_authentication.userIDFromCredentials(credentials)},
            dataType: "json",
            // cache: false,
            success: function (data) {
                // alert("GET success status: " + statusThing);
                // alert("GET result: '" + data + "'");
                if (data.status == "OK") {
                    if (typeof(callback) == "function") callback(null, data);
                } else {
                    if (typeof(callback) == "function") callback("FAILED", data);
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

    function pointrel_variable_set(serverURL, credentials, variableName, oldVersionURI, newVersionURI, callback) {
        console.log("pointrel_resource_set: ", variableName, " old: ", oldVersionURI, " new: ", newVersionURI);
        // var encodedVariableName = EncodeAsUTF8(variableName);
        var request = {
            type: "POST",
            url: serverURL + "variable-query.php",
            data: {"variableName": variableName, "operation": "set", "currentValue": oldVersionURI, "newValue": newVersionURI, "userID": pointrel_authentication.userIDFromCredentials(credentials)},
            dataType: "json",
            // cache: false,
            success: function (data) {
                // alert("GET success status: " + statusThing);
                // alert("GET result: '" + data + "'");
                // document.getElementById("retrieve").innerHTML = data;
                if (data.status == "OK") {
                    if (typeof(callback) == "function") callback(null, data);
                } else {
                    if (typeof(callback) == "function") callback("FAILED", data);
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

    function pointrel_variable_delete(serverURL, credentials, variableName, currentValue, callback) {
        console.log("pointrel_variable_delete: ", variableName);
        // var encodedVariableName = EncodeAsUTF8(variableName);
        var request = {
            type: "POST",
            url: serverURL + "variable-query.php",
            data: {"variableName": variableName, "operation": "delete", currentValue: currentValue, "userID": pointrel_authentication.userIDFromCredentials(credentials)},
            dataType: "json",
            // cache: false,
            success: function (data) {
                // alert("GET success status: " + statusThing);
                // alert("GET result: '" + data + "'");
                // document.getElementById("retrieve").innerHTML = data;
                if (data.status == "OK") {
                    if (typeof(callback) == "function") callback(null, data);
                } else {
                    if (typeof(callback) == "function") callback("FAILED", data);
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

    ///// JOURNALS
    
    function pointrel_journal_ajax(operation, serverURL, credentials, journalName, callback, extra) {
        console.log("pointrel_journal_ajax", operation, journalName);
        // var encodedJournalName = encodeAsUTF8(journalName);
        
        // Build merged content with extra fields if needed
        var content = {"journalName": journalName, "operation": operation, "userID": pointrel_authentication.userIDFromCredentials(credentials)};
        for (var attributeName in extra) {
            if (extra.hasOwnProperty(attributeName)) { content[attributeName] = extra[attributeName]; }
        }
        
        console.log("content: ", content);

        var request = {
                type: "POST",
                url: serverURL + "journal-store.php",
                data: content,
                dataType: "json",
                // cache: false,
                success: function (data) {
                    // alert("POST success status: " + statusThing);
                    // alert("POST result: '" + data + "'");
                    // document.getElementById("retrieve").innerHTML = data;
                    if (data.status == "OK") {
                        if (operation == "get") data.result = base64_decode(data.result);
                        if (typeof(callback) == "function") callback(null, data);
                    } else {
                        if (typeof(callback) == "function") callback("FAILED", data);
                    }
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    alert("POST xhr.status: " + xhr.status);
                    alert("POST xhr: " + xhr);
                    alert("POST journal " + operation + " error: " + thrownError);
                    // TODO: improve error reporting
                    if (typeof(callback) == "function") callback("ERROR", xhr);
                }
            };

        $.ajax(request);

        // alert("sent request: " + JSON.stringify(request));
        // document.getElementById("query").innerHTML = "Waiting... on " + JSON.stringify(request);
    }
    
    function pointrel_journal_exists(serverURL, credentials, journalName, callback) {
        pointrel_journal_ajax("exists", serverURL, credentials, journalName, callback, {});
    }
    
    function pointrel_journal_create(serverURL, credentials, journalName, journalFormat, callback) {
        pointrel_journal_ajax("create", serverURL, credentials, journalName, callback, {"journalFormat": journalFormat});
    }
    
    function pointrel_journal_delete(serverURL, credentials, journalName, header, size, callback) {
        pointrel_journal_ajax("delete", serverURL, credentials, journalName, callback, {"userSuppliedHeader": header, "userSuppliedSize": size});
    }
    
    function pointrel_journal_info(serverURL, credentials, journalName, callback) {
        pointrel_journal_ajax("info", serverURL, credentials, journalName, callback, {});
    }
    
    function pointrel_journal_get(serverURL, credentials, journalName, start, length, callback) {
        pointrel_journal_ajax("get", serverURL, credentials, journalName, callback, {"start": start, "length": length});
    }
    
    function pointrel_journal_put(serverURL, credentials, journalName, contentStringToAppend, callback) {
        var encodedContent = base64_encode(contentStringToAppend);
        // Maybe needed: headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
        pointrel_journal_ajax("put", serverURL, credentials, journalName, callback, {"encodedContent": encodedContent});
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
}());
