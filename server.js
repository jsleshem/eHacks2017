
var http = require("http"),
socketio = require("socket.io"),
fs = require("fs");
var express = require('express');
var app = express();
var photonApp = express();
var events = require('events');
var eventEmitter = new events.EventEmitter();

app.set('port', 3456);
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/noah_index.html');
});



photonApp.set('port', 7777);
photonApp.get('/unicorn/', function(req, res) {
	res.send('1234');
	console.log("Move: " + req.query.move);
	eventEmitter.emit('get_event');
});

var server = http.createServer(app).listen(app.get('port'), function() {
	console.log('Server is listening on port: ' + app.get('port'));
});

var photonServer = http.createServer(photonApp).listen(photonApp.get('port'), function() {
	console.log('Server is listening on port: ' + photonApp.get('port'));
});


var io = socketio.listen(server);

var players = [{}];
var chatrooms = [{name: "Lobby", admin: "server", number: 0, code: 0000, started: false, currentPlayer: "", currentTurn: 0}];
io.sockets.on("connection", function(socket){

	eventEmitter.addListener("get_event", function(){
		if (socket.room.started){
			socket.emit("increase_score", {turn: chatrooms[socket.room.number].currentTurn, player: chatrooms[socket.room.number].currentPlayer});
		}
	});

	socket.on('add_user', function(username){
		socket.emit('update_rooms', chatrooms);
		// we store the username in the socket session for this client
		socket.username = username;
		socket.room = chatrooms[0];
		socket.join(socket.room.name);
		// add the client's username to the global list
		players[0][username] = socket;
		console.log(Object.keys(players[0]).length);
		socket.emit('room_joined', socket.room);
	});

	socket.on('join_room', function(data){
		var oldRoom = socket.room;
		var newRoom = chatrooms[data.room];
		if (newRoom.code != data.code){
			socket.emit('error_message', "Bad password");
		} else if (newRoom.started) {
			socket.emit('error_message', "Game has already started");
		} else {
			socket.room = newRoom;

			delete players[oldRoom.number][socket.username];
			players[newRoom.number][socket.username] = socket;
			socket.leave(oldRoom.name);
			socket.join(socket.room.name);

			// echo to client they've connected
			socket.emit('room_joined', newRoom);
			if (newRoom.name != "Lobby"){
				io.sockets.in(newRoom.name).emit('update_users', { users: Object.keys(players[newRoom.number])});
			}
		}
	});

	socket.on('start_game', function(data){
		console.log("Game starting " + data.name);
		chatrooms[data.number].started = true;
		chatrooms[data.number].currentTurn = 17;
		io.sockets.in(data.name).emit("start_turn", chatrooms[data.number].currentPlayer);
	});

	socket.on('create_room', function(data){
		var template = {name: "", admin: "", number: 0, started: false, currentPlayer: ""}; // room template
		template.name = data.name;
		template.code = data.code;
		template.number = chatrooms.length;
		template.admin = socket.username;
		template.currentPlayer = socket.username;
		chatrooms.push(template);
		players.push({});
		io.sockets.emit('update_rooms', chatrooms);
		socket.emit('room_created', {'room': template.number, 'code': data.code});
	});

	socket.on('end_turn', function(data){

		var players_names = Object.keys(players[socket.room.number]);
		console.log(players_names);
		var currentIndex = 0;
		for (var i in players_names){
			console.log(i);
			if (players_names[i] == socket.username){
				currentIndex = parseInt(i);
			}
		}
		if (currentIndex+1 >= players_names.length){
			if (chatrooms[socket.room.number].currentTurn == 18) {
				io.sockets.in(data.name).emit("end_game", players_names);
			} else {
				chatrooms[socket.room.number].currentTurn = parseInt(chatrooms[socket.room.number].currentTurn) + 1;
				chatrooms[socket.room.number].currentPlayer = players_names[0];
				io.sockets.in(data.name).emit("start_turn", players_names[0]);
			}
		} else {
			chatrooms[socket.room.number].currentPlayer = players_names[currentIndex+1];
			io.sockets.in(data.name).emit("start_turn", players_names[currentIndex+1]);
		}
	});

});
