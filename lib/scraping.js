
/**
* 曲リストのあるサイトからデータを取得し、配列にして返す
* 
* @class Scraping
*/
exports.Scraping = function Scraping(){
	// ローカル変数
	var request = require('request');
	var cheerio = require('cheerio');

	/**
	* シリーズの名前のリストを返す
	* 
	* @method getLocation
	* @return {Array} シリーズの名前のリスト
	*/ 
	this.getLocation = function(url, callback){
		var location_count = 0;
		var location = [];

		_getBody(url, function(error, body){
			if(error) {
				callback(null);
				return [];
			}

			var $ = cheerio.load(body);
			// $(".MdMTMWidgetList01 .mdMTMWidget01TypeTtl .mdMTMWidget01ItemTtl01View").each(function(){
			$("._jWidgetData").each(function(){
				// var s = {
				// 	data: $(this).attr("data-contentdata")
				// };
				var json = JSON.parse($(this).attr("data-contentdata"));
				if(json.location){
					var lo = {
						spotName: json.location.spotName || json.title,
						discription: json.description,
						address: json.location.address,
						lat: json.location.lat,
						lng: json.location.lng
					};
					location.push(lo);
				}
			});
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

	/**
	* 数値でない値の場合、0にして返す
	* 
	* @method _notNumericToZero
	* @param {String} value
	* @return {String} 0 または value
	*/
	function _notNumericToZero(value){
		return value.match(/[^0-9]+/) ? 0 : value;
	}
};