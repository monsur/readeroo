// handles xmlhttp request to server
var WebHelper = {
	send: function(url,request,callback) {
		var http = new XMLHttpRequest();
		var mode = request?"POST":"GET";
		http.open(mode,url,true);
		if(mode=="POST"){http.setRequestHeader('Content-Type','application/x-www-form-urlencoded');}
		http.onreadystatechange=function(){if(http.readyState==4){callback(http.responseText);}};
		http.send(request);
	},
	
	send2: function(url, args, callback) {
        url = WebHelper.createUrl(url, args);
		var http = new XMLHttpRequest();
		http.open("GET",url,true);
		http.onreadystatechange=function(){if(http.readyState==4){callback(http.responseText);}};
		http.send(null);
	},

    // squish together args array and url to create the full url
	createUrl: function(url, args) {
        
        // join the querystring args
        var qs = '';
        for (key in args) {
            qs = qs + encodeURIComponent(key) + '=' + encodeURIComponent(args[key]) + '&';
        }
        
        // slap the querystring args onto the url
        if (qs != '')
            url = url + '?' + qs;
            
        return url;
	}
};