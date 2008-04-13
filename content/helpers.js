/**
 * handles xmlhttp request to server
 */
var WebHelper = {
  
  /**
   * Sends an http GET request to a remote server
   * @param {String} url The url to send the request to.
   * @param {Object} args The querystring arguments
   * @param {Function} callback
   * @param {Function} errorCallback
   */
  send: function(url, args, callback, errorCallback) {
    url = this.createUrl(url, args);
    var http = new XMLHttpRequest();
    http.open("GET",url,true);
    http.onreadystatechange = function() {
      if (http.readyState != 4) {
        return;
      }
      if (http.status != 200) {
        // Handle error
        if (errorCallback) {
          errorCallback(http);
        }
        return;
      }
      callback(http.responseText);
    }
    http.send('');
  },

  /**
   * Merges the inputs to create a url string with query parameters.
   * @param {String} url The url
   * @param {Object} args Set of key/value pairs for each querystring parameter.
   */
  createUrl: function(url, args) {

    // join the querystring args
    var qs = '';
    for (key in args) {
      qs = qs + encodeURIComponent(key) + '=' +
          encodeURIComponent(args[key]) + '&';
    }

    // slap the querystring args onto the url
    if (qs != '') {
      url = url + '?' + qs;
    }
    return url;
  }
};

/**
 * Interacts with the browser window to retrieve and set the current url
 */
DocumentHelper = {

  initialize: function() {
    var wm = Components.classes['@mozilla.org/appshell/window-mediator;1']
        .getService(Components.interfaces.nsIWindowMediator);
    var recentWindow = wm.getMostRecentWindow('navigator:browser');
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
