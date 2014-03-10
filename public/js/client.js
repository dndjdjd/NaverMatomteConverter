
/*
ToDo:
- パラメータ付きのurlをtwitterにつぶやけるようにする
- 再生が許可されていない曲を除く
- 全曲版とAC版を切り替えられるようにする
- 最新シリーズとCSが一緒になってる
- フォルダを閉じたり変更した時も、プレイ中の曲を表示し直したときに緑色になるようにする
- キーワードを追加する
- お気に入りストック
　- 動画ID
　- 曲ID...どうやって曲IDを固定化するか（差分アップデート方式にする必要がある）
- 曲の評価（５段階）を入力できる
- 開始5秒、終了5秒をフェードイン・フェードアウトする
- BPMを表示する
- レベルでカテゴライズする
- フォルダを閉じる機能
- 一番上に戻る機能
- リスト表示を切り替えたときに、再生中の曲が画面の一番上にくるようにする。
- 戻る・進むボタン
- 画面サイズに応じてPlayerのサイズを変更する

Bug
- TROOPERSの「Anisakis -somatic mutation type "Forza"-」が再生されない。
- 9thの「Abyss -The Heavens Remix-」が再生されない。エスケープの問題？
- twitterのスクリプトを入れるとエラーが出る

Other
- CSのみの曲がSPADAに入ってる
- AngularJSを試してみる
*/

var ytplayer;
var socket;

var current_sort_type_id = 0;
var change_sort_event = false;
var sort_type = [{dif_n7: "ascending"}, {dif_h7: "ascending"}, {dif_a7: "ascending"},
				 {dif_n14: "ascending"}, {dif_h14: "ascending"}, {dif_a14: "ascending"}];
var sort_type_color = ["info", "warning", "danger", "info", "warning", "danger"];

var current_music_list;			// 選択されているシリーズの曲のデータ(JSON)
var current_music_list_obj;		// 選択されているmusic_listの<li>のオブジェクト
var current_movie_list;			// 選択されている曲の動画のデータ(JSON)
var current_movie_list_obj;		// 選択されているmovie_listの<li>のオブジェクト

var current_next_play_type_id = 1;
var random_play = false;
var loop_play = false;

var device = "";

$(document).ready(function (){

	// 初期化処理
	socket = io.connect();

    // create_social_button();
});

function getUrlVars(){
  var vars = [], hash;
  var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
  for(var i = 0; i <hashes.length; i++) {
    hash = hashes[i].split('=');
    vars.push(hash[0]);
    vars[hash[0]] = hash[1];
  }
  return vars;
}

function getLocation(){
	var url = $("#url").val();
	socket.emit('get', url, function (json){
		$("#result").text(JSON.stringify(json, null, "    "));
		// var div, li;
		// for(var i = 0; json.length > i; i++){

		// 	div = $("<div/>").addClass("text-left")
		// 					 .text(json[i].title);

		// 	li = $("<li/>").attr("series_id", json[i].series)
		// 				   .attr("onClick", "get_music({series: " + json[i].series + "}, this);")
		// 				   .addClass("list-group-item btn btn-info")
		// 				   .append(div);

		// 	$("#music_list").append(li);
		// }

		// div = $("<div/>").addClass("text-left")
		// 				 .text("All Version")
		// 				 .append(" <small>※表示に少し時間がかかります。</small>");

		// li = $("<li/>").attr("series_id", 99)
		// 			   .attr("onClick", "get_music({}, this);")
		// 			   .addClass("list-group-item btn btn-info")
		// 			   .append(div);
		
		// $("#music_list").append(li);
	});
}

function get_music(query, current_obj){
	// 曲リスと取得要求
	// queryは検索条件
	// 戻り値はMusicsの[検索クエリ,ソート条件]
	socket.emit('musics', [query, sort_type[current_sort_type_id]], function (json){
		
		// 現在表示されているmusic_listを削除する
		$("#music_list li[music_id]").each(function (){
			$(this).remove();
		});

		// ダブルクリックで難易度変更した時は、series_listのselectedを変更しない
		if(!change_sort_event){
			// 開いてるシリーズをクリックした時は、曲を消すだけ（フォルダを閉じる）
			if($(current_obj).attr("selected")){
				return $(current_obj).removeAttr("selected");
			}

			// すべてのlistからselected属性を削除する
			$("#music_list li[selected]").removeAttr("selected");

			// 選択されたフォルダにselected属性を付ける
			$(current_obj).attr("selected","true");
		}

		// 曲リストを一時保存する
		current_music_list = json;

		for(var i = 0; json.length > i; i++){
			var diff = get_difficult(json[i]);
			// diffが0は曲が存在しないということなので表示しない
			if(diff == 0) continue;
			var genre = $("<small/>").text(json[i].genre + "（" + json[i].artist + "）");
			var div = $("<div/>").addClass("text-left")
								 .css("white-space","normal")
								 .text("★" + diff + " " + json[i].title)
								 .append("<br>")
								 .append(genre);

			var li = $("<li/>").attr("data_id", i)
							   .attr("music_id", json[i]._id)
							   .attr("onClick", "onclick_music_list(this);")
							   .addClass("list-group-item btn btn-default series")
							   .append(div);

			$(current_obj).after(li);
			current_obj = $(current_obj).next();

		}

		change_sort_event = false;
	});
}

// Youtubeからidを取得し、Playerを再生する
function get_movies(data_id){
	//socket.emit('movies', music_id);

	// サーバ経由ではなく、クライアントからJSONP
	var title = current_music_list[data_id].title;
	var request_url = 'http://gdata.youtube.com/feeds/api/videos?'
				    + '&max-results=20'
				    + '&alt=json-in-script'
				    + '&callback=youtube_api_callback'
				    + '&q=beatmania+' + title;
	var script = $("<script/>").attr("type", "text/javascript")
							   .attr("src", request_url);
	$("body").append(script);
}

// 動画idから情報を取得し、Playerを再生する
function get_movie_by_id(data_id){
	// サーバ経由ではなく、クライアントからJSONP
	//var title = current_music_list[data_id].title;
	var request_url = 'http://gdata.youtube.com/feeds/api/videos/' + data_id + '?'
				    + '&alt=json-in-script'
				    + '&callback=youtube_api_callback_one';
	var script = $("<script/>").attr("type", "text/javascript")
							   .attr("src", request_url);
	$("body").append(script);
}

// youtube APIからのcallback関数
function youtube_api_callback(json) {
	// 検索結果が1件も無い場合。ただし、連続再生が止まってしまう。
	if(!("entry" in json.feed)) return;

	// 一番最初のIDをセットする
	change_movie(json.feed.entry[0].id["$t"].match(/videos\/(.*)$/)[1]);
	play();
	
	var array_data = [];

	// 動画リストを削除
	$("#movie_list").children("li").remove();

	// 動画リストを生成
	for(var i in json.feed.entry){
		var title = json.feed.entry[i].title['$t'];
		var content = json.feed.entry[i].content["$t"]
		var id = json.feed.entry[i].id["$t"].match(/videos\/(.*)$/)[1];
		var thumb = json.feed.entry[i]["media$group"]["media$thumbnail"][1].url;
		var published = json.feed.entry[i].published['$t'].substr(0, 10);
		var view_count = json.feed.entry[i]["yt$statistics"].viewCount;

		var media_object = $("<img/>").addClass("media-object pull-left")
							 .attr("src", thumb);
		var media_published = $("<small/>").text("Upload: " + published);
		var media_view_count = $("<small/>").text("Views: " + view_count);
		var media_heading = $("<h5/>").css("white-space","normal") // 折り返すようにする
									  .text(title);
		var media_body = $("<div/>").addClass("media-body")
									.append(media_heading)
									.append(media_published)
									.append("<br>")
									.append(media_view_count);
		var media = $("<div/>").addClass("text-left media")
							   .append(media_object)
							   .append(media_body);
		var li = $("<li/>").addClass("list-group-item btn btn-default")
						   .attr("data_id", i)
						   .attr("movie_id", id)
						   .attr("onClick", "onclick_movie_list(this);")
						   .append(media);

		$("#movie_list").append(li);

		if(i == 0){
			current_movie_list_obj = li;
			$(current_movie_list_obj).removeClass("btn-default")
			  						 .addClass("btn-success");
		}

		// データを保存
		array_data.push({id: id,
						title: title,
				    	content: content,
						thumb: thumb,
						published: published,
						view_count: view_count});
	}

	// movie_listの情報をjsonで保持
	current_movie_list = JSON.parse(JSON.stringify(array_data));

	// 動画の情報を表示
	set_movie_information(0);
} 

function youtube_api_callback_one(json) {
	// 一番最初のIDをセットする
	change_movie(json.entry.id["$t"].match(/videos\/(.*)$/)[1]);
	play();

	$("#movie_title").text(json.entry.title['$t']);
	$("#movie_content").text(json.entry.content["$t"]);
	$("#movie_information").text("")
					       .append("Upload: " + json.entry.published['$t'].substr(0, 10))
					       .append(" | ")
					       .append("Views: " + json.entry["yt$statistics"].viewCount);
}

function change_list(data){
	if(data == "music"){
		$("#music_list").show();
		$("#movie_list").hide();
		$("#list_select_music").removeClass("btn-default")
							   .addClass("btn-primary active");
		$("#list_select_movie").removeClass("btn-primary active")
							   .addClass("btn-default");
	} else if(data == "movie"){
		$("#music_list").hide();
		$("#movie_list").show();
		$("#list_select_music").removeClass("btn-primary active")
							   .addClass("btn-default");
		$("#list_select_movie").removeClass("btn-default")
							   .addClass("btn-primary active");
	}
}

function onclick_music_list(obj){
	//get_movies($(obj).attr("music_id"));
	get_movies($(obj).attr("data_id"));

	$("#music_list").children("li").removeClass("btn-success");
	$(obj).addClass("btn-success");
	current_music_list_obj = obj;
}

function onclick_movie_list(obj){
	change_movie($(obj).attr("movie_id"));

	$("#movie_list").children("li").removeClass("btn-success");
	$(obj).addClass("btn-success");
	current_movie_list_obj = obj;

	// 動画の情報を表示
	var id = Number($(current_movie_list_obj).attr("data_id"));
	set_movie_information(id);
}


// 動画の情報を表示
function set_movie_information(id){
	// console.log("set_movie_information id: " + String(id));
	$("#movie_title").text(current_movie_list[id].title);
	$("#movie_content").text(current_movie_list[id].content);
	$("#movie_information").text("")
					       .append("Upload: " + current_movie_list[id].published)
					       .append(" | ")
					       .append("Views: " + current_movie_list[id].view_count);
}

function get_difficult(json){
	var diff;
	if(current_sort_type_id == 0) diff = json.dif_n7;
	if(current_sort_type_id == 1) diff = json.dif_h7;
	if(current_sort_type_id == 2) diff = json.dif_a7;
	if(current_sort_type_id == 3) diff = json.dif_n14;
	if(current_sort_type_id == 4) diff = json.dif_h14;
	if(current_sort_type_id == 5) diff = json.dif_a14;
	return diff;
}

// 次再生設定が変更されたとき
function change_next_play_type(id){
	current_next_play_type_id = id;

	$("#setting_next_play").children("div").each(function(){
		if($(this).attr("next_play_type_id") == id){
			$(this).removeClass("btn-default").addClass("btn-primary");
		}
		else{
			$(this).removeClass("btn-primary active").addClass("btn-default");
		}
	});
}

// ソート順が変更されたとき
function change_sort_type(id){
	current_sort_type_id = id;

	$("#setting_sort_type").children("div").each(function(){
		if($(this).attr("sort_type_id") == id){
			$(this).removeClass("btn-default").addClass("btn-primary");
		}
		else{
			$(this).removeClass("btn-primary active").addClass("btn-default");
		}
	});

	$("#music_list").children("li[series_id]").each(function(){
		$(this).removeClass()
			   .addClass("list-group-item btn btn-" + sort_type_color[current_sort_type_id]);
	});
	// TODO: この選択方法は改善の余地あり
	var obj = $("#music_list").children("li[selected]");

	change_sort_event = true;
	get_music({series: $(obj).attr("series_id")}, obj);
}

// Playerが準備できたときのイベントハンドラ
function onYouTubePlayerReady(playerid){
	ytplayer = document.getElementById("myytplayer");
	ytplayer.addEventListener('onStateChange', 'onStateChange');

	// パラメータに動画idがある場合
    var query = getUrlVars();
    if(query["id"]){
    	get_movie_by_id(query["id"]);
    }
}

// Playerの状態が変わったとき
// state: 未開始（-1）、終了（0）、再生中（1）、一時停止中（2）、バッファリング中（3）、頭出し済み（5）
function onStateChange(state){
	console.log("onStateChange: " + String(state));
	if(state == 0){
		// 次のリストが曲なら次の曲を再生する
		if($("#music_list").css("display") == "block"){
			// next
			if(current_next_play_type_id == 1){
				if(!$(current_music_list_obj).next().attr("music_id")) return;

				var data_id = $(current_music_list_obj).next().attr("data_id");
				get_movies(data_id);

				// 曲リストの書き換え
				$(current_music_list_obj).removeClass("btn-success")
										 .addClass("btn-default");
				$(current_music_list_obj).next()
										 .removeClass("btn-default")
										 .addClass("btn-success");
				current_music_list_obj = $(current_music_list_obj).next();
			}
			// random
			else if(current_next_play_type_id == 2){
				var id;
				while(true){
					id = Math.floor(Math.random() * current_music_list.length);
					if(get_difficult(current_music_list[id]) != 0) break;
				}
				get_movies(id);

				$(current_music_list_obj).removeClass("btn-success");
				$("#music_list").children("li[music_id]").each(function(){
					if($(this).attr("data_id") == id){
						$(this).addClass("btn-success");
						current_music_list_obj = $(this);
					}
				});
			}
			// loop
			else if(current_next_play_type_id == 3){
				play();
			}
		}
		else if($("#movie_list").css("display") == "block"){
			// next
			if(current_next_play_type_id == 1){
				if($(current_movie_list_obj).next().attr("movie_id")){
					var movie_id = $(current_movie_list_obj).next().attr("movie_id")
					change_movie(movie_id);
					play();

					// 動画リストの書き換え
					$(current_movie_list_obj).removeClass("btn-success")
											 .addClass("btn-default");
					$(current_movie_list_obj).next()
											 .removeClass("btn-default")
											 .addClass("btn-success");
					current_movie_list_obj = $(current_movie_list_obj).next();

					// 動画の情報を表示
					var id = Number($(current_movie_list_obj).attr("data_id"));
					set_movie_information(id);
				}
			}
			// random
			else if(current_next_play_type_id == 2){
				var id = Math.floor(Math.random() * current_movie_list.length);
				change_movie(current_movie_list[id].id);

				$(current_movie_list_obj).removeClass("btn-success");
				$("#movie_list").children("li").each(function(){
					if($(this).attr("data_id") == id){
						$(this).addClass("btn-success");
						current_movie_list_obj = $(this);
					}
				});

				// 動画の情報を表示
				set_movie_information(id);
			}
			// loop
			else if(current_next_play_type_id == 3){
				play();
			}
		}
	}
}

// 再生する
function play() {
	if (ytplayer) {
		ytplayer.playVideo();
	}
}

// 再生を停止する
function stop() {
	if (ytplayer) {
		ytplayer.stopVideo();
	}
}

// 再生する動画を変更する
// 引数：再生する動画のID
function change_movie(id){
	if(device == "iOS"){
		$("#ytplayer_html5").attr("src","http://www.youtube.com/embed/" + id + "?autoplay=1");
	}
	else{
		if (ytplayer) {
			ytplayer.loadVideoById(id);
		}
	}
}


function create_social_button(){
	$('#hatena').socialbutton('hatena'),{
	    button: 'standard',
    	url: 'http://beatube-iidx.herokuapp.com',
    	title: 'Beatube IIDX'
 	};
	$('#twitter').socialbutton('twitter', {
	    button: 'horizontal',
	    text: 'Beatube IIDX #beatube-iidx'
	});
	$('#facebook_share').socialbutton('facebook_share', {
	    button: 'button_count', // synonym 'type'
	    url: 'http://beatube-iidx.herokuapp.com',
	    text: 'Share'
  });
}