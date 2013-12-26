var http 	= require('http');
var https	= require('https');
var fs		= require('fs');
var util	= require('util');
var os		= require("os");


var port		= 8000;
var sslOptions = {
	key		: fs.readFileSync('certs/key.pem').toString(),
	cert	: fs.readFileSync('certs/cert.pem').toString()
};


// node --arg script.js
// anything in between node and the file to run

start();

function start() {
	if (!process.argv.length) {
		console.log("No Arguments passed. Starting basic http");
		console.log("For more options node thisFile.js --help");
		console.log("");
		httpBasic();	
		return;
	}

	process.argv.every(function(arg, i) {
		arg = arg.replace(/--/, "");
		switch (arg) {
			case "http":
				httpBasic();
				console.log("Server running at http://127.0.0.1:"+port+"/");
				break;
			case "https":
				httpsBasic();
				console.log("Server running at https://127.0.0.1:"+port+"/");
				break;
			case "https2tls":
				https2tls();
				console.log("Server running at https://127.0.0.1:"+port+"/");
				break;
			case "httpExpress":
				httpExpress();
				console.log("Server running at http://127.0.0.1:"+port+"/");
				break;
			case "httpConnect":
				httpConnect();
				console.log("Server running at http://127.0.0.1:"+port+"/");
				break;
			case "httpsConnect":
				httpsConnect();
				console.log("Server running at https://127.0.0.1:"+port+"/");
				break;
			case "help":
				console.log("Pass an option to start a different type of basic server");
				console.log("E.G. node thisFile.js --httpConnect");
				["http", "https", "httpExpress", "httpConnect", "httpsConnect"].forEach(function(cmd, i) {
					console.log("Option " + i + " : " + cmd );
				});
				break;
			default:
				//continue
				return true;
		}
	
		//break			
		return false;
	});
}

function certs() {
/*
mkdir ./certs;
openssl genrsa -out key.pem 1024;
openssl req -new -key key.pem -out certrequest.csr;
openssl x509 -req -in certrequest.csr -signkey key.pem -out cert.pem;
mv *.pem ./certs;
rm certrequest.csr;
*/	
	//double the above features if possible
		
}

function httpBasic() {
	var server = http.createServer(function (request, response) {
	  response.writeHead(200, {"Content-Type": "text/plain"});
	  response.end("vanila HTTP example\n");
	});
	server.listen(port);
}

function httpsBasic() {
	var sslServer = https.createServer(sslOptions, function (req, res) {
		res.writeHead(200);
		res.end("vanilla HTTPS example");
	});

	sslServer.listen(port);
}

function https2tls() {
	var tls = require('tls');
	tls.createServer(sslOptions, function (s) {
		s.write("welcome!\n");
		s.pipe(s);
	}).listen(port, '127.0.0.1');
}

function httpExpress() {
	var express = require('express');
	var app = express();
    https.createServer(sslOptions, app).listen(port);
}

function httpConnect() {
	var connect = require('connect');
	var http = require('http');
	
	var app = connect()
	  .use(connect.favicon())
	  .use(connect.logger('dev'))
	  .use(connect.static('public'))
	  .use(connect.directory('public'))
	  .use(connect.cookieParser())
	  .use(connect.session({ secret: 'my secret here' }))
	  .use(function(req, res){
	    res.end('Hello from Connect!\n');
	  });
	
	http.createServer(app).listen(port);
}

function httpsConnect() {
	/* setup https server */
	var connect = require('connect');
	var app = connect()
		.use(connect.logger('dev'))
		.use(connect.static(__dirname + '/clients'))
		.use(function(err, req, res) {
			console.log("connect() serve");
			console.log(err);
	
			//i'm not sure I need this func any more
			res.writeHead(200, {'Content-Type' : 'text/html'});
			res.end();
		});

	var sslServer = https.createServer(sslOptions, app);

	sslServer.on("error", function (e) {
		console.log ("ERRR");
		console.log('ssl server error');
		console.log(e);
		console.log(e.stack);
	});

	sslServer.listen(port);
}

exports

