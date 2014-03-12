
/**
* NAVERまとめからデータを取得し、配列にして返す
* 
* @class Scraping
*/
exports.Scraping = function Scraping(){
	// ローカル変数
	var request = require('request');
	var cheerio = require('cheerio');

	var cache = {};

	/**
	* htmlのbodyを解析して位置情報のリストを返す
	* 
	* @method getLocation
	* @return {Array} 位置情報のリスト
	*/ 
	this.getLocation = function(url, callback){
		var location_count = 0;
		var location = [];

		if(cache[url]){
			return callback(cache[url]);
		}

		_getBody(url, function(error, body){
			if(error) {
				callback(null);
				return [];
			}

			var $ = cheerio.load(body);
			// $(".MdMTMWidgetList01 .mdMTMWidget01TypeTtl .mdMTMWidget01ItemTtl01View").each(function(){
			$(".MdMTMWidgetList01 ._jWidgetData").each(function(){
				var json = JSON.parse($(this).attr("data-contentdata"));
				console.log(json);
				if(json.location){
					var lo = {
						spotName: json.location.spotName || json.title,
						address: json.location.address,
						discription: json.description,
						image: {
							thumbnailUrl: json.thumbnailUrl,
							originalUrl: json.url,
							sourceUrl: json.sourceUrl
						},
						lat: json.location.lat,
						lng: json.location.lng
					};
					location.push(lo);
				}
			});
			cache[url] = location;
			return callback(location);
		});
	};

	/**
	* リクエストのbody要素を返却する
	* 
	* @method _getBody
	* @return {String} body要素
	*/
	function _getBody(url, callback){
		request({url: url}, function(error, response, body) {
			if(error || response.statusCode != 200){
				// console.log(error);
				return callback(error);
			}
			// console.log(body);
			return callback(null, body);
		});
	}
};
