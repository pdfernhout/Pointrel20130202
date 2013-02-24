// Utility classes

// A single use class to do a recursive search for versions in a linked list
// Recursively go through a linked list of versions, up to but not including the stopAtVersionURI
// stopAtVersionURI can be empty or null to load all versions
// the search depth can be limited by specifying a maximumSearchDepth as a positive integer, otherwise use null
// has a endingStatus of "end" if reached the end, "more" if there are more not searched due to maximum search limits,
// "match" if stopped because reach matching URI, or "error" if something went wrong
function PointrelVersionFollower(pointrelReference, startingVersionURI, stopAtVersionURI, maximumSearchDepth, callbackForAllVersions, callbackForNextVersion) {
    var pointrel = pointrelReference;
    this.startingVersionURI = startingVersionURI;
    this.stopAtVersionURI = stopAtVersionURI;
    this.maximumSearchDepth = maximumSearchDepth;
    this.callbackForAllVersions = callbackForAllVersions;
    this.callbackForNextVersion = callbackForNextVersion;
    // reachedEnd can be "end", "more", "match", or "error"
    this.versions = [];
    this.searchStarted = false;
    this.endingStatus = null;
    this.errorStatus = null;
    // Maybe add filtering and then counting versions read
    // Maybe make a variant that can follow multiple diverging and converging branches

    this.done = function (status) {
        this.endingStatus = status;
        console.log("endingStatus", this.endingStatus);
        if (typeof(this.callbackForAllVersions) == "function") this.callbackForAllVersions(null, this.versions, this.endingStatus, this);
    };

    this.nextVersion = function (version) {
        if (typeof(this.callbackForNextVersion) == "function") this.callbackForNextVersion(null, version, this);
    };

    this.doneBecauseOfError = function (error) {
        this.endingStatus = "error";
        this.errorStatus = error;
        console.log("endingStatus", this.endingStatus);
        console.log("errorStatus", this.errorStatus);
        if (typeof(this.callbackForAllVersions) == "function") this.callbackForAllVersions(this.errorStatus, this.versions, this.endingStatus, this);
    };

    this.getPreviousVersionsRecursively = function (versionURI, currentSearchDepth) {
        console.log("getPreviousVersionsRecursively", versionURI, currentSearchDepth);
        if (!versionURI) {
            this.done("end");
        } else if (versionURI === this.stopAtVersionURI) {
            this.done("match");
        } else if (this.maximumSearchDepth && currentSearchDepth >= this.maximumSearchDepth) {
            this.done("more");
        } else {
            // JavaScript has "this" refer to the object a function is called on, or the global object
            var self = this;
            pointrel.resource_get(versionURI, function (error, versionContents) {
                console.log("callback from pointrel.resource_get", versionURI);
                if (error) {
                    var message = "Error happened on versionContents get";
                    alert(message);
                    self.doneBecauseOfError(message);
                    return;
                }
                console.log("versionContents:", versionContents);
                var version = JSON.parse(versionContents);
                console.log("version read", version);
                // Make a note of the place the version was read from in the version itself
                version._readFromVersionURI = versionURI;
                self.versions.push(version);
                var previousVersion = version.previousVersion;
                self.nextVersion(version);
                self.getPreviousVersionsRecursively(previousVersion, currentSearchDepth + 1);
            });
        }
    };

    this.search = function () {
        if (this.searchStarted) throw "Search can only be called once";
        this.searchStarted = true;
        this.getPreviousVersionsRecursively(this.startingVersionURI, 0);
    };
}

function PointrelVariable(pointrelReference, variableName) {
    var pointrel = pointrelReference;
    this.variableName = variableName;
    this.latestVariableVersionURI = null;
    this.mostRecentlyLoadedVersionURI = null;
    this.callbackWhenVersionsLoaded = null;

    // TODO: Handle issue of searching with previous version not latest version -- semantic issue to resolve on meaning of those

//        this.getLatestVersionX = function(callback) {
//            var self = this;
//            pointrel.variable_get(this.variableName, function (error, variableGetResult) {
//                console.log("pointrel.variable_get");
//                if (error) {
//                    alert("Error happened on variable get");
//                    self.latestVersionURI = null;
//                    self.latestVersion = null;
//                    callback(error, null);
//                    return;
//                }
//                self.latestVersionURI = variableGetResult.currentValue;
//                pointrel.resource_get(self.latestVersionURI, function (error, versionContents) {
//                    console.log("pointrel.resource_get");
//                    if (error) {
//                        alert("Error happened on versionContents get");
//                        self.latestVersionURI = null;
//                        self.latestVersion = null;
//                        callback(error, null);
//                        return;
//                    }
//                    console.log("versionContents:", versionContents);
//                    var version  = JSON.parse(versionContents);
//                    // Make a note of the place the version was read from in the version itself
//                    version._readFromVersionURI = self.latestVersionURI;
//                    self.latestVersion = version;
//                    callback(null, self.latestVersion);
//                });
//            });
//        };

    this.getLatestVariableVersionURI = function(callback) {
        console.log("getLatestVariableVersionURI -- callback", callback);
        var self = this;
        pointrel.variable_get(this.variableName, function (error, variableGetResult) {
            console.log("callback for pointrel.variable_get in getLatestVariableVersionURI");
            if (error) {
                alert("Error happened on variable get");
                // self.latestVariableVersionURI = null;
                if (typeof(callback) == "function") callback(error, null);
                return;
            }
            self.latestVariableVersionURI = variableGetResult.currentValue;
            console.log("getLatestVariableVersionURI result", self.latestVariableVersionURI);
            console.log("Callback", callback);
            if (typeof(callback) == "function") callback(null, self.latestVariableVersionURI);
        });
    };

    this.newVersionsDone = function (error, versions, endingStatus, follower) {
        console.log("newVersionsDone in variable", error, endingStatus, versions);
        console.log("newVersionsDone this", this);
        if (error) {
            alert("error");
            if (typeof(this.callbackWhenVersionsLoaded) == "function") this.callbackWhenVersionsLoaded(error, versions, endingStatus, follower);
            return;
        }
        if (versions) {
            this.mostRecentlyLoadedVersionURI = this.latestVariableVersionURI;
        }
        console.log("about to try callback", this.callbackWhenVersionsLoaded);
        if (typeof(this.callbackWhenVersionsLoaded) == "function") this.callbackWhenVersionsLoaded(error, versions, endingStatus, follower);
        console.log("after tried callback");
    };

    this.getNewVersions = function (callbackWhenVersionsLoaded) {
        console.log("getNewVersions -- ", callbackWhenVersionsLoaded);
        this.callbackWhenVersionsLoaded = callbackWhenVersionsLoaded;
        console.log("after set: ", this.callbackWhenVersionsLoaded);
        var self = this;
        this.getLatestVariableVersionURI(function (error, variableGetResult) {
            console.log("callback in getNewVersions after getLatestVariableVersionURI", variableGetResult);
            if (error) {
                alert("error getting latest value of variable");
                // TODO: No callback for this situation?
                return;
            }
            self.follower = new PointrelVersionFollower(pointrel, self.latestVariableVersionURI, self.mostRecentlyLoadedVersionURI, 100, self.newVersionsDone.bind(self), null);
            console.log("about to do follower.search");
            self.follower.search();
        });
    };

    this.setNewVersionURI = function (newVersionURI, callback) {
        var self = this;
        pointrel.variable_set(this.variableName, this.latestVariableVersionURI, newVersionURI, function (error, status) {
            if (error) {
                alert("Error happened when trying to set variable: " + JSON.stringify(status));
                return;
            }
            console.log("after updating to: ", newVersionURI);
            self.latestVariableVersionURI = newVersionURI;
            if (typeof(callback) == "function") callback(error, status, newVersionURI);
        });
    };
}