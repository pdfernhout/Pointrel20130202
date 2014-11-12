"use strict";

/* global document, localStorage, window */

var pointrel_authentication = (function () {
    var login_userIDKey = "login_userID";
    
    var fallbackTemporaryStorage = {};
    
    function isHTML5StorageAvailable() {
    	try {
    		return 'localStorage' in window && window.localStorage !== null;
    	} catch (e) {
    		return false;
    	}
    }

    function loginPageLoaded() {
        document.clickedLogin = clickedLogin;
        document.clickedLogout = clickedLogout;
        var userID = localStorage_get(login_userIDKey);
        console.log("key and userID read from local storage", login_userIDKey, userID);
        updateStatus(userID);
    }

    function localStorage_set(key, value) {
        // console.log("LocalStorage_set", key, value);
    	if (isHTML5StorageAvailable()) {
    		localStorage[key] = value;
    	} else {
    		fallbackTemporaryStorage[key] = value;
    	}
    	return value;
    }

    function localStorage_get(key) {
    	if (isHTML5StorageAvailable()) {
    		return localStorage[key];
    	} else {
    		return fallbackTemporaryStorage[key];
    	}
    }

    function isLoggedIn() {
        //noinspection RedundantIfStatementJS
        if (localStorage_get(login_userIDKey)) return true;
        return false;
    }

    function getUserID() {
        return localStorage_get(login_userIDKey);
    }

    function getUserIDOrAnonymous() {
        if (!isLoggedIn()) return "anonymous";
        return localStorage_get(login_userIDKey);
    }

    function setUserID(userID) {
        return localStorage_set(login_userIDKey, userID);
    }

    function updateStatus(userID) {
        console.log("updateStatus userID", userID);
        if (userID) {
            $("#form_loginStatus").text("Logged in as: \"" + userID + "\"");
            $("#form_loginButton").attr("disabled", true);
            $("#form_logoutButton").removeAttr("disabled");
            $("#form_userID").val(userID);
        } else {
            $("#form_loginStatus").text("Not logged in");
            $("#form_loginButton").removeAttr("disabled");
            $("#form_logoutButton").attr("disabled", true);
            $("#form_userID").val("");
        }
    }

    function clickedLogin() {
        var userID = $("#form_userID").val();
        console.log("userID", userID);
        if (!userID) {
            alert("No user ID entered");
            return;
        }
        localStorage_set(login_userIDKey, userID);
        updateStatus(userID);
    }

    function clickedLogout() {
        var userID = "";
        console.log("userID", "");
        localStorage_set(login_userIDKey, userID);
        updateStatus(userID);
    }

    function userIDFromCredentials(credentials) {
        return credentials;
    }

    // Public API
    var pointrel_authentication = {};
    pointrel_authentication.isLoggedIn = isLoggedIn;
    pointrel_authentication.getUserID = getUserID;
    pointrel_authentication.setUserID = setUserID;
    pointrel_authentication.loginPageLoaded = loginPageLoaded;
    pointrel_authentication.getUserIDOrAnonymous = getUserIDOrAnonymous;
    pointrel_authentication.userIDFromCredentials = userIDFromCredentials;

    return pointrel_authentication;

})();