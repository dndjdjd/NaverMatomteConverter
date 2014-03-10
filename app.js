
// process.env.TZ = "Asia/Tokyo";

// require('newrelic');
// require('./lib/cron');

var express = require('express');
var http = require('http');
var path = require('path');
var ect = require('ect');
var fs = require('fs');
var request = require('request');
// var httpServer = require('http').createServer();

// var db = require('./lib/db');

var app = express();

// all environments
app.set('port', process.env.PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');
app.engine('ect', ect({ watch: true, root: __dirname + '/views', ext: '.ect' }).render);
app.set('view engine', 'ect');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
//app.use(express.session());

// // sessionStoreを設定しないと、Node.jsのメモリストアーにセッションが保存される
// var SessionStore = require("session-mongoose")(express);
// var store = new SessionStore({
//     //url: process.env.MONGOHQ_URL || "mongodb://localhost/TheHabit";,
//     connection: db.mongoose,
//     interval: 120000 // expiration check worker run interval in millisec (default: 60000)
// });
// // configure session provider
// app.use(express.session({
//     store: store,
//     cookie: { maxAge: 1000 * 60 * 60 * 24 * 31 } // expire session in 15 min or 900 seconds
// }));

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}

// app.use(express.static(path.join(__dirname, '/public'))); // なぜかこれだとpublic = 404
app.use(express.static(__dirname, '/public'));
app.use(app.router);

// Routing
var routes = require('./routes');
app.get('/', routes.index);

var httpServer = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


// httpがlistenを開始してからsocket.ioのlistenを行う。
// 順番が逆になると初回アクセスにsocket.io.jsがnot foundになる。
var socketIo = require('socket.io').listen(httpServer);

// ソケット通信開始 ==========================
socketIo.sockets.on('connection', function(socket){
	var Scraping = require('./lib/scraping').Scraping;
	var scraping = new Scraping();

	// シリーズリスト取得要求
	socket.on('get', function(url, callback){
		scraping.getLocation(url, function(location){
			callback(location);
		});
	});

	// 曲リスト取得要求
	socket.on('musics', function(query, callback){
		db.Musics.find(query[0]).sort(query[1]).exec(function(error, result){
			if(error) return console.log(error);
			callback(result);
		});
	});

	// movieデータ取得イベント
	socket.on('movies', function(data){
		// music_idからtitleを検索
		db.Musics.find({_id: data}, function(error, results){
			if (error) return "music not found";
			if (results.length === 0) return "music not found";

			var title = results[0].title;
			// Memo: parameter
			// category
			// orderby

			// http://gdata.youtube.com/feeds/api/videos?q=beatmania&max-results=10&alt=json
			var requestUrl = 'http://gdata.youtube.com/feeds/api/videos?' +
								'q=beatmania+' + title +'&max-results=20&alt=json';
			request({url: requestUrl}, function(error, response, body) {
				if(!error && response.statusCode == 200){
					socket.emit('movies', body, function(data){
						console.log(data);
					});
				}
				else{
					return "youtube api error";
				}

			});
		});
	});
});