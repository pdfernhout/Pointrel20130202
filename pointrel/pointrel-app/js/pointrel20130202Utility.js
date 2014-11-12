"use strict";
	
/* global exports, define */
// Using module definition pattern from Mustache that can support CommonJS, AMD, or direct loading as a script
(function (global, factory) {
	if (typeof exports === "object" && exports) {
		console.log("Pointrel20130202Utility CommonJS init");
		factory(exports); // CommonJS
	} else if (typeof define === "function" && define.amd) {
		console.log("Pointrel20130202Utility AMD init");
		define("Pointrel20130202Utility", ['exports'], factory); // AMD
	} else {
		console.log("Pointrel20130202Utility script init", global, factory);
		global.Pointrel20130202Utility = {};
		factory(global.Pointrel20130202Utility); // <script>
	}
}(this, function (utility) {

	/* global document, localStorage, window */

	// This is a helper class that support updating user information about who is currently logged in.
	// It also updates the screen based on login/logout buttor behavior if field are named a certain way.
	// The fields would have to have these ids:
	// form_loginStatus -- a span
	// form_loginButton -- a button which should call "document.clickedLogin();"
	// form_logoutButton -- a button which should call "document.clickedLogout();"
	// form_userID -- a text input field
	var LoginHelper = (function () {
	    var login_userIDKey = "pointrel20130202_login_userID";
	    
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
	        var form_loginStatus = document.getElementById("form_loginStatus");
	        var form_loginButton = document.getElementById("form_loginButton");
	        var form_logoutButton = document.getElementById("form_logoutButton");
	        var form_userID = document.getElementById("form_userID");
	        if (userID) {
	        	console.log("userID is ", userID);
	            if (form_loginStatus) form_loginStatus.innerHTML = "Logged in as: \"" + userID + "\"";
	            if (form_loginButton) form_loginButton.setAttribute("disabled", true);
	            if (form_logoutButton) form_logoutButton.removeAttribute("disabled");
	            if (form_userID) form_userID.value = userID;
	        } else {
	        	console.log("No userID");
	        	if (form_loginStatus) form_loginStatus.innerHTML = "Not logged in";
	        	if (form_loginButton) form_loginButton.removeAttribute("disabled");
	        	if (form_logoutButton) form_logoutButton.setAttribute("disabled", true);
	        	if (form_userID) form_userID.value = "";
	        }
	    }

	    function clickedLogin() {
	    	var form_userID = document.getElementById("form_userID");
	    	var userID = "";
	    	if (form_userID) userID = form_userID.value;
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
	    var LoginHelper = {};
	    LoginHelper.isLoggedIn = isLoggedIn;
	    LoginHelper.getUserID = getUserID;
	    LoginHelper.setUserID = setUserID;
	    LoginHelper.loginPageLoaded = loginPageLoaded;
	    LoginHelper.getUserIDOrAnonymous = getUserIDOrAnonymous;
	    LoginHelper.userIDFromCredentials = userIDFromCredentials;

	    return LoginHelper;

	})();
	 
	// Get the value of a parameter in the query string
	function getParameter(paramName) {
	    var searchString = window.location.search.substring(1);
	    var params = searchString.split("&");
	
	    for (var i = 0; i < params.length; i++) {
	        var val = params[i].split("=");
	        if (val[0] === paramName) {
	            return decodeURI(val[1]);
	        }
	    }
	    return null;
	}
	
	function displayStringForTimestamp(timestamp) {
	    return timestamp.replace("T", " ").replace("Z", " UTC");
	}
	
	function startsWith(data, start) {
		if (!data) return false;
	    return data.substring(0, start.length) === start;
	}

	utility.LoginHelper = LoginHelper;
	utility.getParameter = getParameter;
	utility.displayStringForTimestamp = displayStringForTimestamp;
	utility.startsWith = startsWith;
}));