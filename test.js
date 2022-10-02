'use strict';

const PORT = process.env.PORT || 3000;
const PORT
const express = require('express');
const server = express().listen(PORT, () => console.log(`Listening on ${PORT}`));

const SocketServer = require('ws').Server;
const wss = new SocketServer({ server });

console.log('Constructed socket server.');

function constructWS(wsRaw) {
	let ws = { customEvents: {}, socketid: '' };

	// on, emit abstractions
	ws.on = function (cueName, action) { ws.customEvents[cueName] = { action, needAuth: false }; };
	ws.emit = function (cueName, payload) { wsRaw.send(JSON.stringify({ cueName: cueName, payload: payload })); };

	// a special on which only acts if ws.socketid is set
	ws.authOn = function (cueName, action) { ws.customEvents[cueName] = { action, needAuth: true }; };

	// handle low level socket functionality
	wsRaw.on('message', function (raw, isBinary) {
		let message = isBinary ? raw : raw.toString();
		let data;
		try { data = JSON.parse(message); }
		catch { data = undefined; }
		if (data && data.cueName && ws.customEvents[data.cueName]) {
			if (!ws.customEvents[data.cueName].needAuth || ws.socketid) ws.customEvents[data.cueName].action(data.payload);
			else console.log('Unauthorized socket attempted to perform privileged action!');
		} else console.log('Unrecognized message from client: ', data);
	});
	wsRaw.on('close', function () {
		console.log('Client disconnected.');
	});
	return ws;
}

wss.on('connection', function (wsRaw) {
	console.log('New client connected!');
	let ws = constructWS(wsRaw);

	ws.on('clientPingCue', function () {
		ws.emit('serverPongCue', Date.now());
	});
});


server.get('/', (req, res) => {
  res.send('Hello World!')
});

server.listen(8080, () => {
  console.log(`http listening on 8080.`)
});
