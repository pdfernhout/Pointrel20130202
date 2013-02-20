define("pointrel", ["dojo/_base/xhr"], function (xhr) {

    // Need to load jstorage and pointrel_authentication first

    // TODO: Might need to think about decoding URLs passed back to user and encoding them for variables

    var pointrel = {};

    function encodeAsUTF8(text) {
        return unescape(encodeURIComponent(text));
    }

    function decodeFromUTF8(text) {
        return decodeURIComponent(escape(text));
    }

    // From: http://phpjs.org/functions/base64_encode/
    function base64_encode(data) {
        // http://kevin.vanzonneveld.net
        // +   original by: Tyler Akins (http://rumkin.com)
        // +   improved by: Bayron Guevara
        // +   improved by: Thunder.m
        // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +   bugfixed by: Pellentesque Malesuada
        // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +   improved by: Rafał Kukawski (http://kukawski.pl)
        // *     example 1: base64_encode('Kevin van Zonneveld');
        // *     returns 1: 'S2V2aW4gdmFuIFpvbm5ldmVsZA=='
        // mozilla has this native
        // - but breaks in 2.0.0.12!
        //if (typeof this.window['btoa'] == 'function') {
        //    return btoa(data);
        //}
        var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        //noinspection JSUnusedAssignment
        var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
            ac = 0,
            enc = "",
            tmp_arr = [];

        if (!data) {
            return data;
        }

        do { // pack three octets into four hexets
            o1 = data.charCodeAt(i++);
            o2 = data.charCodeAt(i++);
            o3 = data.charCodeAt(i++);

            bits = o1 << 16 | o2 << 8 | o3;

            h1 = bits >> 18 & 0x3f;
            h2 = bits >> 12 & 0x3f;
            h3 = bits >> 6 & 0x3f;
            h4 = bits & 0x3f;

            // use hexets to index into b64, and append result to encoded string
            tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
        } while (i < data.length);

        enc = tmp_arr.join('');

        var r = data.length % 3;

        return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);
    }

    // TODO: Add callback for success and errors
    // Data should be in 0-255 character range
    function pointrel_resource_add(originalDataString, extension, callback) {
        console.log("pointrel_resource_add extension: " + extension);
        //var encodedContent = encodeAsUTF8(originalDataString);
        //var encodedExtension = encodeAsUTF8(extension);
        // var hash = CryptoJS.SHA3(encodedContent, { outputLength: 256 });
        // var myName = "pointrel://sha3-256_" + hash + "_" + encodedContent.length + "." + encodedExtension;
        // var hash = CryptoJS.SHA256(encodedContent);
        var hash = CryptoJS.SHA256(originalDataString);
        var extensionSeperator = ".";
        if (extension == "") extensionSeperator = "";
        var uri = "pointrel://sha256_" + hash + "_" + originalDataString.length + extensionSeperator + encodedExtension;

        var request = {
            url: "resource-add.php",
            // Need to pass original data string as it will be utf-8 encoded by dojo
            content: {"resourceURI": uri, "resourceContent": base64_encode(originalDataString), "userID": $.pointrel_authentication.getUserIDOrAnonymous()},
            headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
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
            content: {"resourceURI": uri, "userID": $.pointrel_authentication.getUserIDOrAnonymous()},
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

    function pointrel_variable_get(variableName, callback) {
        console.log("pointrel_variable_get: " + variableName);
        // var encodedVariableName = encodeAsUTF8(variableName);
        var request = {
            url: "variable-query.php",
            content: {"variableName": variableName, "operation": "get", "userID": $.pointrel_authentication.getUserIDOrAnonymous()},
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
        // var encodedVariableName = encodeAsUTF8(variableName);
        var request = {
            url: "variable-query.php",
            content: {"variableName": variableName, "operation": "set", "currentValue": oldVersionURI, "newValue": newVersionURI, "userID": $.pointrel_authentication.getUserIDOrAnonymous()},
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
    pointrel.encodeAsUTF8 = encodeAsUTF8;
    pointrel.decodeFromUTF8 = decodeFromUTF8;
    return pointrel;
});
