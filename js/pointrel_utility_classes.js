// Utility classes

// A single use class to do a recursive search for versions in a linked list
// Recursively go through a linked list of versions, up to but not including the stopAtVersionURI
// stopAtVersionURI can be empty or null to load all versions
// the search depth can be limited by specifying a maximumSearchDepth as a positive integer, otherwise use null
// has a endingStatus of "end" if reached the end, "more" if there are more not searched due to maximum search limits,
// "match" if stopped because reach matching URI, or "error" if something went wrong
function PointrelVersionFollower(archiver, startingVersionURI, stopAtVersionURI, maximumSearchDepth, callbackForAllVersions, callbackForNextVersion) {
    this.archiver = archiver;
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

    // TODO: Could be an issue if this function is called a second time by someone else before it is done? May need guard variable to fail if called while running (or some other approach to pass around state through the recursion).
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
            this.archiver.resource_get(versionURI, function (error, versionContents) {
                console.log("callback from archiver.resource_get", versionURI);
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

function PointrelVariable(archiver, variableName) {
    this.archiver = archiver;
    this.variableName = variableName;
    this.latestVariableVersionURI = null;
    this.mostRecentlyLoadedVersionURI = null;
    this.callbackWhenVersionsLoaded = null;

    // TODO: Handle issue of searching with previous version not latest version -- semantic issue to resolve on meaning of those

//        this.getLatestVersionX = function(callback) {
//            var self = this;
//            this.archiver.variable_get(this.variableName, function (error, variableGetResult) {
//                console.log("in callback from variable_get");
//                if (error) {
//                    alert("Error happened on variable get");
//                    self.latestVersionURI = null;
//                    self.latestVersion = null;
//                    callback(error, variableGetResult);
//                    return;
//                }
//                self.latestVersionURI = variableGetResult.currentValue;
//                this.archiver.resource_get(self.latestVersionURI, function (error, versionContents) {
//                    console.log("in callback from resource_get");
//                    if (error) {
//                        alert("Error happened on versionContents get");
//                        self.latestVersionURI = null;
//                        self.latestVersion = null;
//                        callback(error, versionContents);
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
        this.archiver.variable_get(this.variableName, function (error, variableGetResult) {
            console.log("callback for archiver.variable_get in getLatestVariableVersionURI");
            if (error) {
                alert("Error happened on variable get");
                // self.latestVariableVersionURI = null;
                if (typeof(callback) == "function") callback(error, variableGetResult);
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
            self.follower = new PointrelVersionFollower(this.archiver, self.latestVariableVersionURI, self.mostRecentlyLoadedVersionURI, 100, self.newVersionsDone.bind(self), null);
            console.log("about to do follower.search");
            self.follower.search();
        });
    };

    this.setNewVersionURI = function (newVersionURI, callback) {
        var self = this;
        this.archiver.variable_set(this.variableName, this.latestVariableVersionURI, newVersionURI, function (error, status) {
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

function PointrelJournal(archiver, journalName) {
    this.archiver = archiver;
    this.journalName = journalName;
    this.header = "";
    this.content = "";
    this.newContent = "";

    this.getNewContents = function(callback) {
        console.log("geNewContents -- callback", callback);
        var self = this;
        
        this.archiver.journal_get(this.journalName, this.content.length, "END", function (error, journalGetResult) {
            console.log("callback for archiver.journal_get in getNewContents");
            if (error) {
                alert("Error happened on journal get");
                // self.latestVariableVersionURI = null;
                if (typeof(callback) == "function") callback(error, journalGetResult);
                return;
            }
            self.newContent = journalGetResult.result;
            // console.log("getLatestVariableVersionURI result", self.newContent);
            if (self.newContent) {
                if (!self.content) {
                    // Record the header
                    self.header = self.newContent.split("\n")[0];
                }
                self.content = self.content + self.newContent;
            }
            console.log("Callback", callback);
            if (typeof(callback) == "function") callback(null, self.content, self.newContent);
        });
    };
}

// indexType can be "all" (for all resources), "index" (for a specific index) or also "journal" (but for that you could use PointrelJournal)
function PointrelIndex(archiver, indexName, indexType, fetchResources) {
	// Default some parameters
	if (indexType === undefined) indexType = "index";
	if (fetchResources === undefined) fetchResources = true;
	
	this.archiver = archiver;
	this.indexName = indexName;
	this.indexType = indexType;
	this.fetchResources = fetchResources;
	this.header = "";
	this.headerObject = null;
	this.content = "";
	this.newContent = "";
	this.entries = [];
	this.newEntries = [];

	this.getNewEntries = function(callback) {
		console.log("geNewContents -- callback", callback);
		var self = this;
		var start = this.content.length;

		// TODO: Limit the length requested if the index is too big; would require getting the info first and some kind of looping
		this.archiver.index_get(this.indexName, this.indexType, start, "END", function (error, indexGetResult) {
			console.log("callback for archiver.index_get in getNewEntries");
			if (error) {
				alert("Error happened on index get");
				// self.latestVariableVersionURI = null;
				if (typeof(callback) == "function") callback(error, indexGetResult);
				return;
			}
			self.newContent = indexGetResult.result;
			console.log("start", start, "content.length", self.content.length, "self.newContent.length", self.newContent.length, "getNewEntries result", self.newContent);
			self.newEntries = [];
			self.newResources = [];
			if (self.newContent) {
				// TODO: Error handling if there is only one new line or if JSON parse fails due to data corruption or failure while writing to index
				var lines = self.newContent.split("\n\n");
				for (var i = 0; i < lines.length; i++) {
					var indexEntry = lines[i];
					var parsedIndexEntry = null;
					try {
						parsedIndexEntry = JSON.parse(indexEntry);
					} catch (e) {
						console.log("Problem parsing JSON", indexEntry, e);
					}
					if (parsedIndexEntry != null) {
						if (i === 0 && self.content ==="" && self.header === "") {
							// Handle the header on the first line as a special case
							self.header = lines[0];
							self.headerObject = parsedIndexEntry;
						} else {
							self.entries.push(parsedIndexEntry);
							self.newEntries.push(parsedIndexEntry);
						}
					}
				}
				self.content = self.content + self.newContent;
			}
			
			if (fetchResources) {
//				// Thinking about using JSDeferred to handle asynchronous chain of requests
//				loop(self.newEntries.length, function(i) {
//					return next(function() {
//						var entry = self.newEntries[i];
//						self.archiver.resource_get(entry, function (error, data) {
//							if (error) {
//								console.log("Error while fetching", i, entry, error);
//								// TODO: How to signal this issue? Maybe should just proceed anyway, in case it is a missing resource but more are available?
//							} else {
//								var resourceParsed = JSON.parse(data);
//								entry.resource = resourceParsed;
//							}
//						});
//						// Somehow need to do this at end: if (typeof(callback) == "function") callback(null, self.entries, self.newEntries);
//					});
//				});
				self.fetchEntries(self, 0, self.newEntries, callback);
			} else {
				console.log("Callback", callback);
				if (typeof(callback) == "function") callback(null, self.entries, self.newEntries);
			}
		});
	};
	
	// indirectly recursive function -- could this lead to stack overflow if there are too many new entries in the index? Especially for main index?
	this.fetchEntries = function(self, entryIndex, newEntries, callback) {
		if (entryIndex >= newEntries.length) {
			console.log("Callback", callback);
			if (typeof(callback) == "function") callback(null, self.entries, newEntries);
			return;
		}
		var entry = newEntries[entryIndex];
		var resourceURI = entry.resourceUUID;
		console.log("fetchNewEntries about to request", resourceURI);
		if (!resourceURI) {
			console.log("No resourceUUID", entry);
			self.fetchEntries(self, entryIndex + 1, newEntries, callback);
		} else if (entry.xContent !== undefined) {
			// Handle situation where resource data was directly embedded in index (to save network lookups)
			var data = base64_decode(entry.xContent);
			try {
				var resourceParsed = JSON.parse(data);
				entry.resourceContent = resourceParsed;
			} catch (e) {
				console.log("Problem parsing xContent as JSON", resource.xContent, data, e);
			}
			self.fetchEntries(self, entryIndex + 1, newEntries, callback);
		} else {
			self.archiver.resource_get(resourceURI, function (error, data) {
				if (error) {
					console.log("Error while fetching", entryIndex, entry, error);
					// TODO: How to signal this issue? Maybe should just proceed anyway, in case it is a missing resource but more are available?
				} else {
					// We know the resource must be JSON otherwise it would not have been indexed
					// TODO: Error handling
					var resourceParsed = JSON.parse(data);
					entry.resourceContent = resourceParsed;
				}
				// Continue to try to fetch other entries even if the current one failed
				self.fetchEntries(self, entryIndex + 1, newEntries, callback);
			});
		}
	};
}

function PointrelArchiver(Pointrel, serverURL, credentials) {
    this.serverURL = serverURL;
    this.credentials = credentials;

    // Resources
    
    this.resource_add = function (originalDataString, extension, callback) {
        return Pointrel.resource_add(this.serverURL, this.credentials, originalDataString, extension, callback);

    };

    this.resource_get = function (uri, callback) {
        return Pointrel.resource_get(this.serverURL, this.credentials, uri, callback);

    };

    this.resource_publish = function (resourceURI, destinationURL, callback) {
        return Pointrel.resource_publish(this.serverURL, this.credentials, resourceURI, destinationURL, callback);
    };
    
    // Variables

    this.variable_new = function (variableName, newVersionURI, callback) {
        return Pointrel.variable_new(this.serverURL, this.credentials, variableName, newVersionURI, callback);

    };

    this.variable_get = function (variableName, callback) {
        return Pointrel.variable_get(this.serverURL, this.credentials, variableName, callback);

    };

    this.variable_set = function (variableName, oldVersionURI, newVersionURI, callback) {
        return Pointrel.variable_set(this.serverURL, this.credentials, variableName, oldVersionURI, newVersionURI, callback);

    };

    this.variable_delete = function (variableName, oldVersionURI, callback) {
        return Pointrel.variable_delete(this.serverURL, this.credentials, variableName, oldVersionURI, callback);
    };
    
    // Journals
    
    this.journal_exists = function (journalName, callback) {
        return Pointrel.journal_exists(this.serverURL, this.credentials, journalName, "journal", callback);
    };
    
    this.journal_create = function (journalName, journalFormat, callback) {
        return Pointrel.journal_create(this.serverURL, this.credentials, journalName, "journal", journalFormat, callback);
    };
    
    this.journal_delete = function (journalName, header, size, callback) {
        return Pointrel.journal_delete(this.serverURL, this.credentials, journalName, "journal", header, size, callback);
    };
    
    this.journal_info = function (journalName, callback) {
        return Pointrel.journal_info(this.serverURL, this.credentials, journalName, "journal", callback);
    };
    
    this.journal_get = function (journalName, start, length, callback) {
        return Pointrel.journal_get(this.serverURL, this.credentials, journalName, "journal", start, length, callback);
    };
    
    this.journal_put = function (journalName, contentStringToAppend, callback) {
        return Pointrel.journal_put(this.serverURL, this.credentials, journalName, "journal", contentStringToAppend, callback);
    };
    
    // Indexes -- type can be either journal, index, or all
    
    this.index_exists = function (indexName, indexType, callback) {
        return Pointrel.journal_exists(this.serverURL, this.credentials, indexName, indexType, callback);
    };
    
    this.index_info = function (indexName, indexType, callback) {
        return Pointrel.journal_info(this.serverURL, this.credentials, indexName, indexType, callback);
    };
    
    this.index_get = function (indexName, indexType, start, length, callback) {
        return Pointrel.journal_get(this.serverURL, this.credentials, indexName, indexType, start, length, callback);
    };
}