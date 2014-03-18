
/**
* NAVERまとめからデータを取得し、配列にして返す
* 
* @class Scraping
*/
var Scraping = function(){
	// インスタンスをキャッシュする
	var instance = this;

	// ローカル変数
	var request = require('request');
	var cheerio = require('cheerio');

	// 変換データのキャッシュ
	var cache = {};

	/**
	* htmlのbodyを解析して位置情報のリストを返す
	* 
	* @method getLocation
	* @return {Array} 位置情報のリスト
	*/ 
	this.getLocation = function(url, callback){

		// キャッシュ機構
		// if(cache[url]){
		// 	return callback(cache[url]);
		// }

		_getBody(url, function(error, body){
			if(error) {
				return callback({});
			}

			var $ = cheerio.load(body);

			var matomte = {
				title: $(".mdHeading01Ttl a").text() || "",
				discription: $(".mdHeading01DescTxt").text() || ""
			};

			var location = [];
			// $(".MdMTMWidgetList01 ._jWidgetData").each(function(){
			// 	var json = JSON.parse($(this).attr("data-contentdata"));
			// 	// console.log(json);
			// 	if(json.location){
			// 		var lo = {
			// 			spotName: json.location.spotName || json.title,
			// 			address: json.location.address,
			// 			discription: json.description,
			// 			image: {
			// 				thumbnailUrl: json.thumbnailUrl,
			// 				originalUrl: json.url,
			// 				sourceUrl: json.sourceUrl
			// 			},
			// 			lat: json.location.lat,
			// 			lng: json.location.lng
			// 		};
			// 		location.push(lo);
			// 	}
			// });
			$(".MdMTMWidgetList01 div").each(function(){
				// リンク要素
				if($(this).hasClass("MdMTMWidget01") && $(this).hasClass("mdMTMWidget01TypeLink")){
					// カスタマイズ要素
					var title = $(this).find(".mdMTMWidget01ItemTtl01Link").text();
					title = _removeCtrl(title);
					var originalUrl = $(this).find(".mdImgCite01Url").attr("href");
					var sourceUrl = $(this).find(".mdMTMWidget01ItemThumb01View a").attr("href");

					$(this).find("._jWidgetData").each(function(){
						var json = JSON.parse($(this).attr("data-contentdata"));
						// console.log(json);
						if(json.location){
							var lo = {
								spotName: title || json.location.spotName || json.title,
								address: json.location.address,
								discription: json.description,
								image: {
									thumbnailUrl: json.thumbnailUrl,
									originalUrl: originalUrl,
									sourceUrl: sourceUrl
								},
								lat: json.location.lat,
								lng: json.location.lng
							};
							location.push(lo);
						}
					});
				}
				// 画像要素
				else if($(this).hasClass("MdMTMWidget01") && $(this).hasClass("mdMTMWidget01TypeImg")){
					// カスタマイズ要素
					var title = $(this).find(".mdMTMWidget01ItemTtl01View a").text();
					title = _removeCtrl(title);

					$(this).find("._jWidgetData").each(function(){
						var json = JSON.parse($(this).attr("data-contentdata"));
						// console.log(json);
						if(json.location){
							var lo = {
								spotName: title || json.location.spotName || json.title,
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
				}
				// その他要素
				else if($(this).hasClass("MdMTMWidget01")){
					$(this).find("._jWidgetData").each(function(){
						var json = JSON.parse($(this).attr("data-contentdata"));
						// console.log(json);
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
				}
			});

			var result = {
				matome: matomte,
				location: location
			};

			cache[url] = result;
			return callback(result);
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

	function _removeCtrl(text){
		return text.replace(/\s/g, "");
	}

	// Singleton
	// コンストラクタを書き換える
	Scraping = function(){
		return instance;
	};
};

exports.Scraping = Scraping;
