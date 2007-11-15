
var DeliciousApi = {

    // PRIVATE FUNCTION
    // sends the request to the appropriate url
    // performs the results parsing through the tempCallback function
    // then executes the main processing through the mainCallback function
    send: function(url, args, tempCallback, mainCallback) {

        WebHelper.send2(url, args, 
            function(responseText) {
                var results = tempCallback(responseText);
                mainCallback(results);
            }
        );
    },
    
    // PRIVATE FUNCTION
    // parses the input hash to ensure that it has the correct args
    parseargs: function(inputArgs, allowedArgs) {
        var options = inputArgs || {};
        var args = {};
            
        for (var i = 0; i < allowedArgs.length; i++) {
            var field = allowedArgs[i];
            if (options[field])
                args[field] = options[field];
        }
           
        return args;
    },
        
    // PRIVATE FUNCTION
    // parses the "posts" result xml from delicious into an array of UrlItems
    // here's an example of the xml returned by delicious:
    // <posts dt="2005-11-28" tag="webdev" user="user">
    //   <post href="http://www.howtocreate.co.uk/tutorials/texterise.php?dom=1" 
    //   description="JavaScript DOM reference" 
    //   extended="dom reference" 
    //   hash="c0238dc0c44f07daedd9a1fd9bbdeebd" 
    //   others="55" tag="dom javascript webdev" time="2005-11-28T05:26:09Z" />
    // </posts>
    parseposts: function(responseText) {
        
        // helper function to parse the tags from delicious
        function parseTags(tagsStr) {
            return tagsStr.split(" ");
        }

		// helper function to parse delicious date
		function parseTime(timeStr) {
			var pattern = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z/
			var result = timeStr.match(pattern);
			return new Date(result[1],
							result[2],
							result[3],
							result[4],
							result[5],
							result[6]
						   );
		}
		
        var items = new Array();
        var parser = new DOMParser();   // create a parser object
        var doc = parser.parseFromString(responseText, 'text/xml');
            
        // loop through all the posts, creating a new UrlItem for each,
        // and add them to the items array
        var posts = doc.getElementsByTagName('post');
        for (var i = 0; i < posts.length; i++) {
            var attributes = posts.item(i).attributes;
            var urlItem = new DeliciousItem();
            urlItem.url = attributes.getNamedItem('href').nodeValue;
            urlItem.description = attributes.getNamedItem('description').nodeValue;
            if (attributes.getNamedItem('extended')) 
                urlItem.notes = attributes.getNamedItem('extended').nodeValue;
            urlItem.tags = parseTags(attributes.getNamedItem('tag').nodeValue);
			urlItem.time = parseTime(attributes.getNamedItem('time').nodeValue);
            items.push(urlItem);
        }
            
        return items;
    },
    
    get: function(opts, callback) {
    
        // set up the temporary callback function called once the request
        // is complete.  This function parses the response text into an 
        // array of url items
        function getCallback(responseText) {
            return DeliciousApi.parseposts(responseText);
        }
        
        var args = DeliciousApi.parseargs(opts, ['tag', 'dt', 'url']);
            
        // send the web request
        DeliciousApi.send('https://api.del.icio.us/v1/posts/get', args,
                          getCallback, callback);    
    },
  
      recent: function(opts, callback) {
        
            // set up the temporary callback function called once the request
            // is complete.  This function parses the response text into an 
            // array of url items
            function getCallback(responseText) {
                return DeliciousApi.parseposts(responseText);
            }
            
            var args = DeliciousApi.parseargs(opts, ['tag', 'count']);
                
            // send the web request
            DeliciousApi.send('https://api.del.icio.us/v1/posts/recent', args,
                              getCallback, callback);    
      },
      
      all: function(opts, callback) {
        
            // set up the temporary callback function called once the request
            // is complete.  This function parses the response text into an 
            // array of url items
            function getCallback(responseText) {
                return DeliciousApi.parseposts(responseText);
            }
            
            var args = DeliciousApi.parseargs(opts, ['tag']);
                
            // send the web request
            DeliciousApi.send('https://api.del.icio.us/v1/posts/all', args,
                              getCallback, callback);    
      },
      
    add: function(item, shared, callback) {
    
        function getCallback(responseText) {
			var parser = new DOMParser();
			var doc = parser.parseFromString(responseText, 'text/xml');
			if (!doc.firstChild) {
				return false;
			}
			var code = doc.firstChild.attributes.getNamedItem('code');
			if (!code) {
				return false;
			}
			if (code.nodeValue == 'done') {
				return true;
			}
			return false;
        }
        
        var args = item.getArgs();
		if (shared == false)
			args["shared"] = "no";

        // send the web request
        DeliciousApi.send('https://api.del.icio.us/v1/posts/add', args,
                          getCallback, callback);    
        
        
    },
      
    delete: function(url, callback) {
    
        function getCallback(responseText) {
			var parser = new DOMParser();
			var doc = parser.parseFromString(responseText, 'text/xml');
			if (!doc.firstChild) {
				return false;
			}
			var code = doc.firstChild.attributes.getNamedItem('code');
			if (!code) {
				return false;
			}
			if (code.nodeValue == 'done') {
				return true;
			}
			return false;
        }

        var args = { 'url' : url };
        
        DeliciousApi.send('https://api.del.icio.us/v1/posts/delete', args,
                          getCallback, callback);    
    }
  
}
