exports.index = function(req, res){
	res.render('index');
};
exports.json = function(req, res){
	//
	if(!req.query || !req.query.url){
		res.json(200, {});
	}

	var Scraping = require('../lib/scraping').Scraping;
	var scraping = new Scraping();

	// JSON取得要求
	scraping.getLocation(req.query.url, function(json){
		res.json(200, json);
	});
};