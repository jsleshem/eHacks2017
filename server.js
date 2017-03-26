
var http = require("http"),
socketio = require("socket.io"),
fs = require("fs");
var express = require('express');
var app = express();
var photonApp = express();

app.set('port', 3456);
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/noah_index.html');
});

photonApp.set('port', 7777);
photonApp.get('/unicorn/', function(req, res) {
	res.send('1234');
	console.log("Received GET request");
});

var server = http.createServer(app).listen(app.get('port'), function() {
	console.log('Server is listening on port: ' + app.get('port'));
});

var photonServer = http.createServer(photonApp).listen(photonApp.get('port'), function() {
	console.log('Server is listening on port: ' + photonApp.get('port'));
});


var io = socketio.listen(server);

var players = [{}];
var chatrooms = [{name: "Lobby", admin: "server", number: 0, code: 0000, started: false, currentPlayer: ""}];
io.sockets.on("connection", function(socket){

	socket.on('add_user', function(username){
		socket.emit('update_rooms', chatrooms);
		// we store the username in the socket session for this client
		socket.username = username;
		socket.room = chatrooms[0];
		socket.join(socket.room.name);
		// add the client's username to the global list
		players[0][username] = socket;
		console.log(Object.keys(players[0]).length);
		socket.emit('room-joined', socket.room);
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
			socket.emit('room-joined', newRoom);
			if (newRoom.name != "Lobby"){
				io.sockets.in(newRoom.name).emit('update_users', { users: Object.keys(players[newRoom.number])});
			}
		}
	});

	socket.on('start-game', function(data){
		console.log("Game starting " + data.name);
		chatrooms[data.number].started = true;
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
});
