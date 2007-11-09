
var processing = false;

var i18n = {

	strings: null,
	
	onLoad: function() {
		i18n.strings = document.getElementById('readeroo-strings');
	},
	
	getString: function(key) {
		return i18n.strings.getString(key);
	}
}

var Preferences = {
	tagtoread: '',
	tagdonereading: '',
	shareditem: true,
	deleteitem: false,
	prefs: null,
	
	load: function() {
		const prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
		Preferences.prefs = prefService.getBranch('extensions.readeroo.');
		if (Preferences.prefs.getCharPref('tagtoread') == '') {
			Preferences.prefs.setCharPref('tagtoread', 'toread');
		}
		Preferences.tagtoread = Preferences.prefs.getCharPref('tagtoread');
		Preferences.tagdonereading = Preferences.prefs.getCharPref('tagdonereading');
		Preferences.deleteitem = Preferences.prefs.getBoolPref("deleteitem");
		Preferences.shareditem = Preferences.prefs.getBoolPref("shareditem");
	}
};

var ReaderooCache = {

	lastLoadDate: '',
	
	refresh: function() {
		var span = 1800000;
		var d = new Date();
		var now = d.getTime();
		if (ReaderooCache.lastLoadDate == '') {
			ReaderooCache.lastLoadDate = d.getTime() + span + 10000;
		}
		if (now - ReaderooCache.lastLoadDate > span) {
			ReaderooCache.lastLoadDate = d.getTime();
			return true;
		} 
		return false;
	}
};

var readeroo = {

	onAddClickCommand: function(e) {
		if (processing == true)
			return;
		DisplayControl.initialize('add');
		DisplayControl.setProcessing(i18n.getString('processing'));
		Preferences.load();
		DocumentHelper.initialize();
		
		// initialize the item to add
		var urlItem = new DeliciousItem();
		urlItem.url = DocumentHelper.getUrl();
		urlItem.description = DocumentHelper.getTitle();
		if (urlItem.url == '') {
			DisplayControl.setError(i18n.getString('error'));
			return;
		}
		urlItem.tags.push(Preferences.tagtoread);

		DeliciousQueue.add(urlItem);
	},

	onReadClickCommand: function(e) {
		if (processing == true)
			return;
		DisplayControl.initialize('read');
		DisplayControl.setProcessing(i18n.getString('processing'));
		Preferences.load();
		DeliciousQueue.read();
	},
	
	onLoad: function() {
		var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch('extensions.readeroo.');
		try {
			if (prefs.getBoolPref("firstRun")){
				setTimeout('readeroo.addToolbarButton();', 0);
				prefs.setBoolPref("firstRun", false);
			}
		} catch (e) {
			prefs.setBoolPref("firstRun", true);
		}
	},
	
	addToolbarButton: function() {
	
		function getIndex(arr, val){
			for (var i = 0; i < arr.length; i++){
				if (arr[i] == val){
					return i;
				}
			}
			
			return -1;
		}
		
		if (!document.getElementById('readeroo-button-add')){
			// Determine which toolbar to place the icon onto
			if (document.getElementById("nav-bar").getAttribute("collapsed") != "true"){
				var toolbar = document.getElementById("nav-bar");
			}
			else {
				var toolbar = document.getElementById("toolbar-menubar");
			}
	
			var toolbox = document.getElementById("navigator-toolbox");
			var toolboxDocument = toolbox.ownerDocument;
		
			var currentSet = toolbar.currentSet;
			var newSet = currentSet;
			var setItems = currentSet.split(',');
			
			// Order of adding:
				// before urlbar-container
				// after home-button
				// after reload-button
				// after stop-button
				// after forward-button
				// before search-container
				// at the end

			if (getIndex(setItems, "urlbar-container") != -1){
				newSet = currentSet.replace("urlbar-container","readeroo-button-add,readeroo-button-read,urlbar-container");
			}
			else if (getIndex(setItems, "home-button") != -1){
				newSet = currentSet.replace("home-button","home-button,readeroo-button-add,readeroo-button-read");
			}
			else if (getIndex(setItems, "reload-button") != -1){
				newSet = currentSet.replace("reload-button","reload-button,readeroo-button-add,readeroo-button-read");
			}
			else if (getIndex(setItems, "stop-button") != -1){
				newSet = currentSet.replace("stop-button","stop-button,readeroo-button-add,readeroo-button-read");
			}
			else if (getIndex(setItems, "forward-button") != -1){
				newSet = currentSet.replace("forward-button","forward-button,readeroo-button-add,readeroo-button-read");
			}
			else if (getIndex(setItems, "search-container") != -1){
				newSet = currentSet.replace("search-container","readeroo-button-add,readeroo-button-read,search-container");
			}
			else {
				newSet += ",readeroo-button-add,readeroo-button-read";
			}
			
			toolbar.currentSet = newSet;
			toolbar.setAttribute("currentset",newSet);
			
			toolboxDocument.persist(toolbar.id, "currentset");
			
			try {
				BrowserToolboxCustomizeDone(true)
			} catch (e) { }
		}
	}
};

var DocumentHelper = {

	initialize: function() {
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
		var recentWindow = wm.getMostRecentWindow("navigator:browser");
		this.document = null;
		if (recentWindow) {
			this.document = recentWindow.content.document;
		}
	},
	
	getTitle: function() {
		if (this.document == null) {
			return 'no title';
		}
		var titles = this.document.getElementsByTagName('title');
		if ((!titles)  || (titles.length == 0)) {
			return 'no title';
		}
		return titles[0].innerHTML;
	},
	
	getUrl: function() {
		if (this.document == null) {
			return '';
		}
		return this.document.location;
	},
	
	redirect: function(url) {
		this.document.location.url = url;
	}
};


var DeliciousQueue = {

	urlCache: [],
	currentItem: null,
	
	onLoad: function() {
		DeliciousQueue.urlCache = new Array();
	},

	clear: function() {
		DeliciousQueue.urlCache = new Array();
		DeliciousQueue.currentItem = null;
		DisplayControl.initialize('read');
		DisplayControl.setNormal(i18n.getString('readtooltip'));
		return false;
	},

	add: function(urlItem) {

        // first check to see if the url already exists
        // in delicious
        DeliciousApi.get({url: urlItem.url},
        
            // callback function for the Delicious API "get" call
            // if the bookmark already exists, copying the old 
            // values over to the new item before saving it to 
            // delicious.
            function(items) { 

                // if the url already exists
                if (items.length > 0) {

                    var oldItem = items[0];
                    
                    // copy all the old values over
                    urlItem.description = oldItem.description;
                    urlItem.notes = oldItem.notes;
                    
                    // copy all the tags over (except for the "toread" 
                    // and "donereading" tags)
                    for (var i = 0; i < oldItem.tags.length; i++) {
                        var currTag = oldItem.tags[i];
                        if ((currTag != Preferences.tagtoread) &&
                            (currTag != Preferences.tagdonereading))
                            urlItem.tags.push(oldItem.tags[i]);
                    }
                }
                
                // call the actual add function
                DeliciousApi.add(urlItem, Preferences.shareditem, 
                
                    // callback from "add" api call.
                    // if add is successful, revert icon back to normal
                    // otherwise show error icon
                    // we are so far deep inside the rabbit hole right now!
                    function(success) {
                        if (success) {
                            // do stuff for success
                            DisplayControl.setNormal(i18n.getString('add'));
                        } else {
                            // failure
                            DisplayControl.setError(i18n.getString('error'));
                        }
                    }
                );
            }
        );
	},
	
	read: function() {
		// if the cache is empty, or its time to refresh the cache              
		if ((DeliciousQueue.urlCache.length == 0) || (ReaderooCache.refresh())) {
         DeliciousApi.recent({tag : Preferences.tagtoread}, 
                function(items) {
                    DeliciousQueue.urlCache = items;
                    DeliciousQueue.readItemFromCache();
                }
            );
		} else {
			DeliciousQueue.readItemFromCache();
		}
	},
	
	readItemFromCache: function() {
		if (DeliciousQueue.urlCache.length == 0) {
			DisplayControl.setNormal(i18n.getString('noitemsleft'));
			return;
		}
		DeliciousQueue.currentItem = DeliciousQueue.urlCache.shift();
		DeliciousQueue.markRead();
	},
	
	markRead: function() {
		if (Preferences.deleteitem) {
			DeliciousApi.delete(DeliciousQueue.currentItem.url,
								DeliciousQueue.markReadCallback);
		} else {
			for (var i = 0; i < DeliciousQueue.currentItem.tags.length; i++) {
				if (DeliciousQueue.currentItem.tags[i] == Preferences.tagtoread) {
					DeliciousQueue.currentItem.tags[i] = Preferences.tagdonereading;
				}
			}
		
			DeliciousApi.add(DeliciousQueue.currentItem, Preferences.shareditem, 
							 DeliciousQueue.markReadCallback);
		}
	},
	
	markReadCallback: function(responseText) {
//		DocumentHelper.initialize();
//		DocumentHelper.redirect(DeliciousQueue.currentItem.url);
		window._content.document.location = DeliciousQueue.currentItem.url;
		var tooltip = '';
		var length = DeliciousQueue.urlCache.length;
		if (length == 0)
			tooltip = i18n.getString('noitemsleft');
		else
			tooltip = length + ' ' + i18n.getString('itemsleft');
		DisplayControl.setNormal(tooltip);
	}
};

var DisplayControl = {

	controlId: '',
	tooltipId: '',
	normalImage: '',
	processingImage: '',
	errorImage: '',
	
	initialize: function(id) {
		DisplayControl.controlId = 'readeroo-button-' + id;
		DisplayControl.tooltipId = id + 'tip';
		DisplayControl.normalImage = 'chrome://readeroo/skin/' + id + '_normal.png';
		DisplayControl.processingImage = 'chrome://readeroo/skin/processing.png';
		DisplayControl.errorImage = 'chrome://readeroo/skin/error.png';
	},
	
	set: function(image, tooltip) {
		document.getElementById(DisplayControl.controlId).image = image;
		document.getElementById(DisplayControl.tooltipId).label = tooltip;
	},
	
	setNormal: function(tooltip) {
		processing = false;
		DisplayControl.set(DisplayControl.normalImage, tooltip);
	},
	
	setProcessing: function(tooltip) {
		processing = true;
		DisplayControl.set(DisplayControl.processingImage, tooltip);
	},
	
	setError: function(tooltip) {
		processing = false;
		DisplayControl.set(DisplayControl.errorImage, tooltip);
	}
};

function onLoad(e) {
	i18n.onLoad();
	readeroo.onLoad();
}

window.addEventListener("load", function(e) { onLoad(e); }, false);
