function DeliciousItem() {
	this.url = '';
	this.description = '';
	this.notes = '';
	this.hash = '';
	this.others = 0;
	this.time = '';
	this.shared = true;
	this.tags = new Array();
}

DeliciousItem.prototype.getArgs = function() {
	var args = {};
	args['url'] = this.url;
	args['description'] = this.description;
	args['extended'] = this.notes;
	args['tags'] = this.tags.join(' ');
	if (this.shared == false)
        args['shared'] = 'no';
	return args;
}

