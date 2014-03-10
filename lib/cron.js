/**
* cronの設定
*/
(function () {
	var db = require('./db');
	var Scraping = require('./scraping').Scraping;
	var CronJob = require('cron').CronJob;

	var scraping = new Scraping();
	var cronJob = new CronJob({
		// cronTime: "00 00 00 */7 * *",	// 7日間隔で実行
		cronTime: "*/10 * * * * *",	// 10秒間隔で実行(debug)

		// The function to fire at the specified time.
		onTick: function() {
			console.log("Cron start.");

			// seriesのinsert。データが既にある時はupdate。
			scraping.getJSON(function(series){
				console.log(series);
			});
		},

		// A function that will fire when the job is complete, when it is stopped
		// onComplete: function() {
		//    	console.log('Cron completed.');
		// },

		// Specified whether to start the job after just before exiting the constructor.
		start: false
	}).start();
}());