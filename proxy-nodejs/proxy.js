#!/usr/local/bin/node
var conn = {};
var WebSocketServer = require('websocket').server;
var http = require('http');
var originIsAllowed = function(){return true;}
var server = http.createServer(function(request, response) {
        console.log((new Date()) + " Received request for " + request.url);
        response.writeHead(404);
        response.end();
});

server.listen(10808, function() {
        console.log((new Date()) + "Proxy Server is listening on port 10808");
});

wsServer = new WebSocketServer({
        httpServer: server,
    autoAcceptConnections: false
});

wsServer.on('close', function(request) {
});

wsServer.on('request', function(request) {
	if (!originIsAllowed(request.origin)) {
	        request.reject();
	        console.log((new Date()) + " Connection from origin " + request.origin + " rejected.");
	        return;
	}
	console.log("Connected");
	var con = request.accept(null, request.origin);
	var conID = 0;
	var channels = {};
	con.on('message', function(mg) {
		if (mg.utf8Data.match(/^[a-zA-Z0-9]+\:$/i)) {
			channel = mg.utf8Data.substring(0,mg.utf8Data.length-1);
			con.sendUTF(channel+";");
			console.log("["+channel+"]");
			if(typeof conn[channel] == "undefined"){
				conn[channel] = {};
			}
			conID = (new Date()).getTime();
			conn[channel][conID] = con;
			channels[conID] = channel;
		}else if (mg.utf8Data.match(/^[a-zA-Z0-9]+\:/i)) {
			var msg = mg.utf8Data.split(":");
			var channel = mg.utf8Data.substring(0,mg.utf8Data.indexOf(":"));
			var msg = mg.utf8Data.substring(mg.utf8Data.indexOf(":")+1);
			for(var id in conn[channel]){
				if(id != conID){
					conn[channel][id].sendUTF(mg.utf8Data);
				}
			}
			console.log(channel + "\t" + msg);
		}
	});
	con.on('close', function(reasonCode, description) {
		console.log("Closed('"+channels[conID]+"','"+conID+"'): " + con.remoteAddress);
		if(typeof conn[channels[conID]][conID] == "undefined"){
			delete conn[channels[conID]][conID];
			delete channels[conID];
		}
	});
});