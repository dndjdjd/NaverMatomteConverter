
var Scraping = require('../lib/scraping').Scraping;
var scraping = new Scraping();

exports.index = function(req, res){
	res.render('index');
};
exports.json = function(req, res){
	//　パラメータチェック
	if(!req.query || !req.query.url){
		res.json(200, {});
	}

	scraping.getLocation(req.query.url, function(json){
		res.json(200, json);
	});
};