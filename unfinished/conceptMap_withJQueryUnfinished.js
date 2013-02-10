$(document).ready(conceptMapPageLoaded);

// Treating this file as a singleton instance object :-)
var textBox = null;
var urlBox = null;

var surfaceWidth = 800;
var surfaceHeight = 500;
var _mainSurface = null;
var mainSurface = null;

var items = null;
var changesCount = 0;

var entryDialog = null;
var sourceDialog = null;

var lastSelectedItem = null;

var diagramName = "saved";

var currentVersionURI = "";

var loggedInUserID = "anonymous";

function getQueryStringParamValue(parameter) {
  // document.URL
  var pageURL = window.location.search.substring(1);
  var parametersAndValues = pageURL.split('&');
  for (var i = 0; i < parametersAndValues.length; i++) {
    var parameterAndValue = parametersAndValues[i].split('=');
    if (parameterAndValue[0] == parameter) {
      return parameterAndValue[1];
    }
  }
  return "";
}

function conceptMapPageLoaded() {
  console.log("Called twirlip conceptMap code");
  $("#nojavascript").html('Twirlip Concept Map');
  
  console.log("location.href", location.href);
  console.log("document.URL", document.URL);
  
  diagramName = getQueryStringParamValue("diagram");
  console.log("diagramName", diagramName);
  if (diagramName == "") diagramName = "default";
  
  // Idea from: http://www.webdeveloper.com/forum/showthread.php?t=137518
  // items = getHiddenJSONData("items");
  
  if (items == null) {
    console.log("First time loading");
    items = [];
  } else {
    console.log("Already loaded");
    console.log("items", items);
  }
   
  changesCount = 0;
  
  defineEntryDialog();
  defineSourceDialog();
  
  setupMainButtons();
  
  defineLoginDialog();
  defineSignupDialog();
  
  setupAccountRelatedButton();
  
  setupMainSurface();
  
  requestLatestItemsToLoad();
  
  addItemEditor();

  updateAccountInformation(loggedInUserID);
}

function setFieldValue(name, value) {
  console.log("TODO setFieldVale");
}

function setTextAreaValue(name, value) {
  console.log("TODO setTextAreaValue");
}


function newButton(name, label, callback) {
  // TODO
  document.body.appendChild(something.domNode);
  return something;
}

function setupMainButtons() {

  var addButton = newButton("addButton", "New item", function() {
    setFieldValue("name", "");
    setFieldValue("url", "");
    entryDialog.show();
  });
  
  var newDiagramButton = newButton("newDiagramButton", "Link to new diagram", function() {
    var uuid = "pce:org.twirlip.ConceptMap:uuid:" + Math.uuidFast();
    var url = "conceptMap.html?diagram=" + uuid;
    setFieldValue("name", "");
    setFieldValue("url", url);
    entryDialog.show();
  });
  
  var sourceButton = newButton("sourceButton", "Diagram Source", function() {
    setTextAreaValue("sourceTextArea", JSON.stringify(items, true));  
    sourceDialog.show();
  });
  
  var saveChangesButton = newButton("saveChangesButton", "Save Changes", function() {
    console.log("About to save");
    saveChanges();
  });
}

function setupAccountRelatedButton() {
  accountText = document.createTextNode("Not logged in");
  document.body.appendChild(accountText);
  
  loginButton = newButton("loginButton", "Login", function() {
    //setFieldValue("loginName", "");
    //setFieldValue("loginPassword", "");
    loginDialog.show();
  });
  
  // signupButton = newButton("signupButton", "Signup", function() {
  //   setFieldValue("signupPassword", "");
  //   setFieldValue("signupPassword2", "");
  //   signupDialog.show();
  // });
  
  logoutButton = newButton("logoutButton", "Logout", function() {
    updateAccountInformation("anonymous");
  });
  
  // TODO maybe: updateAccountInformation();
}

function updateAccountInformation(newID) {
  console.log("user name", newID);
  loggedInUserID = newID;
  if (newID != "anonymous") {
      loginButton.domNode.style.display = "none";
      // signupButton.domNode.style.display = "none";
      logoutButton.domNode.style.display = "";
      accountText.textContent = "Logged in as: " + newID;
  } else {
      loginButton.domNode.style.display = "";
      // signupButton.domNode.style.display = "";
      logoutButton.domNode.style.display = "none";
      accountText.textContent = "Not logged in";
  }
}

function setupMainSurface() {
  var node = document.createElement("div");
  var divForCanvasInfo = {width: surfaceWidth, height: surfaceHeight, border: "solid 1px"};
  node.attr("style", divForCanvasInfo);
  document.body.appendChild(node);
  
  // TODOO: make surface for jQuery
  // _mainSurface = dojox.gfx.createSurface(node, divForCanvasInfo.width, divForCanvasInfo.height);
  // mainSurface = _mainSurface.createGroup();
  
  // surface.whenLoaded(drawStuff);
  
  // TODO for jQuery: rebuildItems(mainSurface, items);
  //   items.push({text: theText, url: theURL, x: circle.cx, y: circle.cy});
}

function defineSourceDialog() {
  sourceDialog = new dijit.Dialog({
      title: "Diagram source",
      id: "sourceDialog",
      style: {width: "400px", height: "400px", overflow: "auto"},
      content: 
          "source: <textarea name='sourceTextArea' id='sourceTextArea' rows=10></textarea><br/>" +
          '<button type="submit" onClick="updateSource">Update</button>' +
          '<button type="submit">Cancel</button>'
  });
}

function defineEntryDialog() {
  entryDialog = new dijit.Dialog({
      title: "New item",
      id: "formDialog",
      style: "width: 300px",
      content:
          "name: <input type='text' name='name' id='name'><br/>" +
          "url: <input type='text' name='url' id='url'><br/>" + 
          '<button type="submit" onClick="clickedOK">OK</button>'
  });
}

function defineLoginDialog() {
  loginDialog = new dijit.Dialog({
      title: "Login",
      id: "loginDialog",
      style: "width: 300px",
      content:
          "name: <input type='text' name='loginName' id='loginName'><br/>" +
          // "password: <input type='password' name='loginPassword' id='loginPassword'><br/>" + 
          '<button type="submit" onClick="clickedLogin">Login</button>'
  });
}

function defineSignupDialog() {
  signupDialog = new dijit.Dialog({
      title: "Signup for new account",
      id: "signupDialog",
      style: "width: 300px",
      content:
          "name: <input type='text' name='signupName' id='signupName'><br/>" +
          "email: <input type='text' name='signupEmail' id='signupEmail'><br/>" +
          "<i>Please <b>do not use a valuable password</b> like one already used for a bank or significant social media site.</i><br/>" + 
          "password: <input type='password' name='signupPassword' id='signupPassword'><br/>" + 
          "confirm: <input type='password' name='signupPassword2' id='signupPassword2'><br/>" + 
          '<button type="submit" onClick="clickedSignup">Create account</button>'
  });
}

function addItemEditor() {  
  textBox = new dijit.form.TextBox({
      name: "conceptTextBox",
      value: "",
      placeHolder: "type in a concept"
  }, "conceptTextBox");
  document.body.appendChild(textBox.domNode);
  
  //  var newBreak = document.createElement("br");
  //  document.body.appendChild(newBreak);
  
  urlBox = new dijit.form.TextBox({
      name: "urlTextBox",
      value: "", // http://www.rakontu.org
      placeHolder: "type in a url"
  }, "urlTextBox");
  document.body.appendChild(urlBox.domNode);
  
  var goButton = newButton("goButton", "Go", function() {
    go(urlBox.get("value"));
  });
  
  //  var newBreak = document.createElement("br");
  //  document.body.appendChild(newBreak);
  
  var updateItemButton = newButton("updateItemButton", "Update item", function() {
    if (lastSelectedItem) {
      lastSelectedItem.text = textBox.get("value");
      lastSelectedItem.url = urlBox.get("value");
      changesCount++;
      // Wasteful to do all of them
      rebuildItems(mainSurface, items);
    }
  });
}

function clickedLogin(event) {
  console.log("Clicked Login", event);
  var data = loginDialog.get("value");
  console.log("login data", data);
  // setFieldValue("loginPassword", "");
  updateAccountInformation(data.loginName);
  loginDialog.hide();
}

// TODO: Not used any longer
function clickedSignup(event) {
  console.log("Clicked Signup", event);
  var data = signupDialog.get("value");
  console.log("data", data);
  var valid = false;
  if (!data.signupEmail) {
    alert("No email address entered");
  } else if (!data.signupPassword) {
    alert("No password entered");
  } else if (data.signupPassword.length < 3) {
    alert("Password must be at least three characters");
  } else if (data.signupPassword != data.signupPassword2) {
    alert("Two passwords do not match");
  } else {
    valid = true;
  }
  setFieldValue("signupPassword", "");
  setFieldValue("signupPassword2", "");
  if (valid) {
    var userDocument = {name: data.signupName, email: data.signupEmail};
    jQuery.couch.signup(userDocument, data.signupPassword, {success: function() {
      console.log("Created account OK");
      alert("Account created OK");
      jQuery.couch.login({name: data.signupName, password: data.signupPassword, success: function() {
        updateAccountInformation(data.signupName);
      }});
    }});
  }
}

function clickedOK(event) {
  console.log("Clicked OK", event);
  var data = entryDialog.get("value");
  console.log("data", data);
  group = addItem(mainSurface, null, data.name, data.url);
  items.push(group.item);
  console.log("items", items);
  changesCount++;
  // item.text = textBox.get("value");
  // item.url = urlBox.get("value");
}

function updateSource(event) {
  console.log("Clicked updateSource", event);
  var data = sourceDialog.get("value");
  console.log("data", data);
  
  var jsonText = data.sourceTextArea;
  console.log("data", jsonText);
  
  items = JSON.parse(jsonText);

  console.log("parsed", items);

  rebuildItems(mainSurface, items);
  changesCount++;
  console.log("Updated OK");
}

function rebuildItems(surface, items) {
  // console.log("rebuildItems");
  surface.clear();
  forEach(items, function(index, item) {
    // console.log("looping over: " + item);
    group = addItem(surface, item);
  });
  // console.log("done rebuildItems");
}

function requestLatestItemsToLoad() {
  //dojo.when(twirlipStore.get(diagramName), function(old) {
  //  console.log("old", old);
  //  if (old) {
  //    items = old.items;
  //    rebuildItems(mainSurface, items);
  //  }
  // }, function(error) {console.log("error", error);});

  pointrel_variable_get(diagramName, function(error, variableGetResult) {
    console.log("pointrel_variable_get");
    if (error) {
      return alert("Error happened on variable get; variable name may be new? Result: " + variableGetResult.message);
    }
    var versionURI = variableGetResult.currentValue;
    pointrel_resource_get(versionURI, function(error, versionContents) {
      console.log("pointrel_resource_get");
      if (error) { return alert("Error happened on versionContents get"); }
      console.log("versionContents:", versionContents);
      var version = JSON.parse(versionContents);
      var textURI = version.value;
      pointrel_resource_get(textURI, function(error, text) {
        console.log("pointrel_resource_get");
        if (error) { return alert("Error happened when getting text of version"); }
        currentVersionURI = versionURI;
        items = JSON.parse(text).items;
        rebuildItems(mainSurface, items);
        changesCount = 0;
      });
    });        
  });
}

function saveChanges() {
  // Try to get old value to update it...
  // Although maybe you should not, as it is a conflict?
  // Could warn?
  var newItemsDocument = {_id: diagramName, items: items};

  //twirlipStore.get(diagramName).then(function(oldItemsDocument) {
  //   console.log("save then", oldItemsDocument);
  //  saveChanges2(oldItemsDocument, newItemsDocument);
  // }, function(error) {
  //  console.log("save error1", error);
  //  saveChanges2(null, newItemsDocument);
  // });

  // TODO: Does not deal with editing conflicts except by failing
  var newItemsDocumentText = JSON.stringify(newItemsDocument);
  var textURI = pointrel_resource_add(newItemsDocumentText, "ConceptMapItems.json");
  console.log(textURI);
  var timestamp = new Date().toISOString();
  var userID = loggedInUserID;
  var previousVersionURI = currentVersionURI;
  var version = {timestamp: timestamp, userID: userID, previousVersion: previousVersionURI, value: textURI};
  console.log("version:", version);
  var versionAsString = JSON.stringify(version);
  console.log("versionAsString:", versionAsString);
  var newVersionURI = pointrel_resource_add(versionAsString, "Version.json");
  console.log("newVersionURI:", newVersionURI);
  pointrel_variable_set(diagramName, currentVersionURI, newVersionURI, function (error, result) {
    if (error) { return alert("Error happened when trying to set variable"); }
    console.log("store updating before:", currentVersionURI);
    console.log("store updating after:", newVersionURI);
    currentVersionURI = newVersionURI;
    changesCount = 0;
  });
}

function saveChanges2(oldItemsDocument, newItemsDocument) {
  if (oldItemsDocument != null) {
    newItemsDocument._rev = oldItemsDocument._rev;
    //alert("old rev: " + old._rev);
  } else {
    //alert("old is null");
  }
  twirlipStore.put(newItemsDocument).then(
    function() {
      changesCount = 0;
      console.log("Saved OK");
      alert("Saved OK...");
    }, 
    function(error) {
      console.log("error2", error);
      alert("Save failed. Try logging in first.");
      console.log("done writing out error");
    }
  );
}

function go(url) {
  console.log("go: ", url);
  if (!url) {
    console.log("empty url, not going");
    return;
  }
  console.log("items: ", items);
  // TODO: setHiddenJSONData("items", items);
  if (changesCount != 0) {
    console.log("trying to go with changes...");
    var okToGo = confirm("You have unsaved changes");
    if (!okToGo) return;
  }
  console.log("going to url", url);
  // document.location.href = url;
  window.open(url);
}

function addItem(surface, item, text, url) {
  // alert("Add button pressed");
  //arrow = drawArrow(surface, {start: {x: 200, y: 200}, end: {x: 335, y: 335}});
  //new dojox.gfx.Moveable(arrow);
  // console.log("addClick");
    
  if (item == null) {
    item = {};
    item.text = text;
    item.url = url;
    item.x = 200;
    item.y = 200;
    item.uuid = Math.uuidFast();
  }
  console.log("item", item);
  
    var group = surface.createGroup();
    group.item = item;
    
    console.log("group", group);
    
  var circle = {cx: 0, cy: 0, r: 50 };
  var color = "black";
  if (item.url) color = "green";
  var blueCircle = group.createCircle(circle).
    setFill([0, 0, 155, 0.5]).
    setStroke({color: color, width: 4, cap: "butt", join: 4}).
    applyTransform(dojox.gfx.matrix.identity);
  
  addText(group, item.text, 75);
  
  group.connect("onmousedown", function(e) {
      // console.log("triggered down", e);
    lastSelectedItem = item;
    // console.log("onmousedown item", item);
      textBox.set("value", item.text);
      urlBox.set("value", item.url);
  });

  group.connect("ondblclick", function(e) {
    // alert("triggered ondblclick");
    go(group.item.url);
  });

  var moveable = new dojox.gfx.Moveable(group);
  moveable.item = item;
  
  moveable.onMoved = function(mover, shift) {
    item.x += shift.dx;
    item.y += shift.dy;
    changesCount++;
  };
  
  group.applyTransform(dojox.gfx.matrix.translate(item.x, item.y));
  
  return group;
}

function addText(group, text, maxWidth) {
  var style = {family: "Arial", size: "10pt", weight: "bold"};
  var lineHeight = 12;
  var tb = dojox.gfx._base._getTextBox;
  var words = text.split(" ");
  var lines = [];
  var line = "";
  forEach(words, function(index, word) {
    if (lines.length >= 5) {
      line = "...";
      return;
    }
    if (line == "") {
      line = word;
    } else if (tb(line + " " + word).w < maxWidth) {
      line += " " + word;
    } else {
      lines.push(line);
      line = word;
    }
  });
  if (line != "") lines.push(line);
  var startY = -((lines.length - 1) / 2) * lineHeight;
  if (lines.length == 6) startY += lineHeight;
  var y = startY;
  forEach(lines, function(index, line) {
    var theTextItem = group.createText({text: line, x: 0, y: y, align: "middle"}).
    setFont(style).
    setFill("black");
    y += lineHeight;
  });
}
