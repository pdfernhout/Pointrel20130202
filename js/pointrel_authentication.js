(function () {
    var login_userIDKey = "login_userID";

    function loginPageLoaded() {
        document.clickedLogin = clickedLogin;
        document.clickedLogout = clickedLogout;
        var userID = LocalStorage_get(login_userIDKey);
        console.log("key and userID read from local storage", login_userIDKey, userID);
        updateStatus(userID);
    }

    function LocalStorage_set(key, value) {
        // console.log("LocalStorage_set", key, value);
        return $.jStorage.set(key, value);
    }

    function LocalStorage_get(key) {
        return $.jStorage.get(key);
    }

    function isLoggedIn() {
        //noinspection RedundantIfStatementJS
        if (LocalStorage_get(login_userIDKey)) return true;
        return false;
    }

    function getUserID() {
        return LocalStorage_get(login_userIDKey);
    }

    function getUserIDOrAnonymous() {
        if (!isLoggedIn()) return "anonymous";
        return LocalStorage_get(login_userIDKey);
    }

    function setUserID(userID) {
        return LocalStorage_set(login_userIDKey, userID);
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
        LocalStorage_set(login_userIDKey, userID);
        updateStatus(userID);
    }

    function clickedLogout() {
        var userID = "";
        console.log("userID", "");
        LocalStorage_set(login_userIDKey, userID);
        updateStatus(userID);
    }

    // Public API
    var pointrel_authentication = {};
    pointrel_authentication.isLoggedIn = isLoggedIn;
    pointrel_authentication.getUserID = getUserID;
    pointrel_authentication.setUserID = setUserID;
    pointrel_authentication.loginPageLoaded = loginPageLoaded;
    pointrel_authentication.getUserIDOrAnonymous = getUserIDOrAnonymous;

    $.pointrel_authentication = pointrel_authentication;

})();