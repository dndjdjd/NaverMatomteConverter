
var socket;

$(document).ready(function (){
	// 初期化処理
	socket = io.connect();
});

function getLocation(){
	var url = $("#url").val();
	socket.emit('get', url, function (json){
		$("#result").val(JSON.stringify(json, null, "    "));
	});
}
