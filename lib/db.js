var mongoose = require('mongoose');

// Schema定義 =============================
var musics_schema = new mongoose.Schema({
	series: Number,
	title: String,
	genre: String,
	artist: String,
	bpm: String,
	dif_n7: Number,
	dif_h7: Number,
	dif_a7: Number,
	dif_n14: Number,
	dif_h14: Number,
	dif_a14: Number,
	// dif_array: Number,
	notes_n7: Number,
	notes_h7: Number,
	notes_a7: Number,
	notes_n14: Number,
	notes_h14: Number,
	notes_a14: Number
	// notes_array: Number
});
var series_schema = new mongoose.Schema({
	series: Number,
	title: String
});
mongoose.model('musics', musics_schema);
mongoose.model('series', series_schema);

var mongo_url = process.env.MONGOHQ_URL || "mongodb://localhost/iidx";
mongoose.connect(mongo_url);

exports.mongoose = mongoose;
exports.Musics = mongoose.model('musics');
exports.Series = mongoose.model('series');