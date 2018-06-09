var fs = require('fs');

var _static = require('node-static');

/*
// use this for LIVE domains
var options = {
    key: fs.readFileSync('../ssl/private/domain.com.key'),
    cert: fs.readFileSync('../ssl/certs/domain.com.crt'),
    ca: fs.readFileSync('../ssl/certs/domain.com.cabundle')
};
*/
var options = {
    key: fs.readFileSync('fake-keys/privatekey.pem'),
    cert: fs.readFileSync('fake-keys/certificate.pem')
};

var app = require('https').createServer(options, serverCallback);

function serverCallback(request, response) {
    request.addListener('end', function () {
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        response.end("signaling server is running")
    }).resume();
}

var io = require('socket.io').listen(app, {
    log: true,
    origins: '*:*'
});


var channels = {},broadcastedlessson = {};
var broadcastersessionid;
io.sockets.on('connection', function (socket) {
	console.log('A user connected');
	
    var initiatorChannel = '';var initiatorBroadcaster = '';
    if (!io.isConnected) {
        io.isConnected = true;
    }

	socket.on('disconnect', function () {
		
        if (initiatorChannel) {
			delete channels[initiatorChannel];
        }

		if (initiatorBroadcaster) {
			delete broadcastedlessson[initiatorBroadcaster];
			console.log('is boradcaster deleted ' + !broadcastedlessson[initiatorBroadcaster])
        }
    });

	socket.on('isalreadybroadcasting', function (lessonid) {
		console.log('isalreadybroadcasting : ' + !!broadcastedlessson[lessonid])
		 socket.emit('isalreadybroadcasting', !!broadcastedlessson[lessonid]);

    });

	socket.on('startbroadcasting', function (lessonid) {
		
		   initiatorBroadcaster = lessonid;
		   broadcastedlessson[lessonid] = lessonid;
		   console.log('startbroadcasting : ' + !!broadcastedlessson[lessonid])
		   socket.emit('startbroadcasting', !!broadcastedlessson[lessonid]);
    });

    socket.on('new-channel', function (data) {
		
        if (!channels[data.channel]) {
			console.log('initiatorChannel');
            initiatorChannel = data.channel;
        }

        channels[data.channel] = data.channel;
        onNewNamespace(data.channel, data.sender);
    });

    socket.on('presence', function (channel) {
        var isChannelPresent = !! channels[channel];
        socket.emit('presence', isChannelPresent);
    });

    
});

function onNewNamespace(channel, sender) {
    io.of('/' + channel).on('connection', function (socket) {
        var username;
        //if (io.isConnected) {
        //    io.isConnected = false;
         //   socket.emit('connect', true);
       // }

        socket.on('message', function (data) {
		   console.log(data.sender +" "+ sender);
            if (data.sender == sender) {
                if(!username) username = data.data.sender;
				socket.broadcast.emit('message', data.data);
            }
        });
        
        socket.on('disconnect', function() {
            if(username) {
                socket.broadcast.emit('user-left', username);
                username = null;
            }
        });
		
		socket.on('endbroadcasting', function (lessonid) {
		   delete broadcastedlessson[lessonid];
		   console.log('endbroadcasting : ' + !broadcastedlessson[lessonid])
           socket.broadcast.emit('endbroadcasting', !broadcastedlessson[lessonid]);
    });

    });
}

app.listen(8080);

