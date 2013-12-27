/*
	simple-web-server-examples

	Example: `node index.js --http`
	Anything in between node and the file to run.
*/

var fs = require('fs');
var url = require('url');
var path = require('path');
var http = require('http');
var https = require('https');
var express = require('express');
var connect = require('connect');

var PORT = 8000;
var FILEDIR = "/_FILESERVEDIR";

start();

function start() {
	if (process.argv.length < 3) {
		console.log("No Arguments passed. Starting basic http");
		console.log("For more options node index.js --help");
		console.log("");
		httpBasic();	
		return;
	}

	process.argv.every(function(arg, i) {
		arg = arg.replace(/--/, "");

		switch (arg) {
			case "http":
				httpBasic();
				break;
			case "https":
				httpsBasic();
				break;
			case "httpsExpress":
				httpsExpress();
				console.log("Server running at http://127.0.0.1:"+PORT+"/");
				break;
			case "httpConnect":
				httpConnect();
				console.log("Server running at http://127.0.0.1:"+PORT+"/");
				break;
			case "httpsConnect":
				httpsConnect();
				console.log("Server running at https://127.0.0.1:"+PORT+"/");
				break;
			case "certs":
				certs();
				break;
			case "help":
				console.log("");
				console.log("Pass an option to start a different type of basic server");
				console.log("E.G. node index.js --httpConnect");
				console.log("");
				[
					"http (default)",
					"https",
					"httpsExpress",
					"httpConnect",
					"httpsConnect",
					"certs (generate https certificates)"
				].forEach(function(cmd, i) {
					console.log("  Option " + i + " : " + cmd );
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
	replaces the following and uses -subj instead of reading stdin

	mkdir ./certs;
	openssl genrsa -out key.pem 1024;
	openssl req -new -key key.pem -out certrequest.csr;
	openssl x509 -req -in certrequest.csr -signkey key.pem -out cert.pem;
	mv *.pem ./certs;
	rm certrequest.csr;
*/

	//double the above features if possible
	var child = require('child_process').spawn;
	var sub = "/C=US/ST=CA/L=SD/O=FOO/OU=BAR/CN=FOOCOM/emailAddress=foo@bar.net";

	fs.mkdir(__dirname + '/certs', function (err) {
		if (err) { 
			if (err.errno === 47) {
				return console.log("Certs directory already exists. Delete if you want to regen.");
			} else {
				return console.log(err);
			}
		}

		var mkPEM = child('openssl', ['genrsa', '-out', 'key.pem', '1024']);
		mkPEM.stdout.on('data', function (m) {console.log(m); });
		mkPEM.stderr.on('data', function (m) {console.log(m);});
		mkPEM.on('exit', function () {

			var mkCSR = child('openssl', ['req', '-new', '-key', 'key.pem', '-out', 'certrequest.csr', '-subj', sub]);
			mkCSR.stdout.on('data', function (m) {console.log(m); });
			mkCSR.stderr.on('data', function (m) {console.log(m); });
			mkCSR.on('exit', function () {

				var mkKeys = child('openssl', ['x509', '-req', '-in', 'certrequest.csr', '-signkey', 'key.pem', '-out', 'cert.pem']);
				mkKeys.stdout.on('data', function (m) {console.log(m); });
				mkKeys.stderr.on('data', function (m) {console.log(m);});
				mkKeys.on('exit', function () {

					fs.rename(__dirname + '/key.pem', __dirname + '/certs/key.pem', function (err) {
						if (err) { return console.log(err); }
					});

					fs.rename(__dirname + '/cert.pem', __dirname + '/certs/cert.pem', function (err) {
						if (err) { return console.log(err); }
					});

					fs.unlink(__dirname + '/certrequest.csr', function (err) {
						if (err) { return console.log(err); }
					});	
				});
			});
		});
	});
}

function getCerts() {
	certs();

	return {
		key		: fs.readFileSync('certs/key.pem').toString(),
		cert	: fs.readFileSync('certs/cert.pem').toString()
	};
}

function getRequestResponse(req, res, serverType, cb) {
    var uri = url.parse(req.url).pathname;
	if (uri === "/") {
		uri = "/index.html";
	}

	var contentTypes = {
		"html"	: "text/html",
		"jpeg"	: "image/jpeg",
		"jpg"	: "image/jpeg",
		"png"	: "image/png",
		"js"	: "text/javascript",
		"css"	: "text/css"
	};

	var code = 404;
	var content = "File Not Found: " + serverType;
	var contentType = "text/plain";

	var filePath = __dirname + FILEDIR + uri;
	var buffer = "";
	fs.exists(filePath, function (exists) {
		console.log(filePath);
		console.log(exists);
		if (exists) {
			contentType = contentTypes[path.basename(filePath).split('.')[1]] || "text/plain";
				
			var fileStream = fs.createReadStream(filePath);
			fileStream.on('data', function (data) {
				buffer += data;
			});

			fileStream.on('end', function () {
				var replaceStr = /{{simple-web-server-example:title}}/;
				content = buffer.replace(replaceStr, "Running " + serverType + " <br/> Path: " + filePath );
				code = 200;

				endRes({
					'contentType'	: contentType,
					'code'			: code,
					'content'		: content
				}, res);	
			});
		} else {
			endRes({
				'contentType'	: contentType,
				'code'			: code,
				'content'		: content
			}, res);	
		}
	});
}

function endRes (parsed, res) {
	res.writeHead(parsed.code, { "Content-Type" : parsed.contentType });
	res.end(parsed.content);
}

function httpBasic() {
	var server = http.createServer(function (req, res) {
		getRequestResponse(req, res, "http");
	});

	server.listen(PORT);
	console.log("Server running at http://127.0.0.1:"+PORT+"/");
}

function httpsBasic() {
	var sslServer = https.createServer(getCerts(), function (req, res) {
		getRequestResponse(req, res, "https")
	});

	sslServer.listen(PORT);
	console.log("Server running at https://127.0.0.1:"+PORT+"/");
}

function httpsExpress() {

	var app = express();
	app.use('/', function (req, res) {
		getRequestResponse(req, res, "httpsExpress");
	});

	app.use(express.static(__dirname + FILEDIR));
    https.createServer(getCerts(), app).listen(PORT);

	console.log("Server running at https://127.0.0.1:"+PORT+"/");
}

function httpConnect() {
	var app = connect();
	connectAddOptions(app, "http");

	http.createServer(app).listen(PORT);
	console.log("Server running at http://127.0.0.1:"+PORT+"/");
}

function httpsConnect() {

	var app = connect();
	connectAddOptions(app, "https");
	var sslServer = https.createServer(getCerts(), app);

	sslServer.on("error", function (e) {
		console.log ("ERROR " + e.stack);
	});

	sslServer.listen(PORT);
	console.log("Server running at https://127.0.0.1:"+PORT+"/");
}

function connectAddOptions(app, httpType) {
	app.use("/", function(req, res) {
		getRequestResponse(req, res, httpType + "Connect");
	});

	app.use(connect.static(__dirname + FILEDIR));

/* OPTIONAL ADDONS */
//	app.use(connect.favicon());
//	app.use(connect.logger('dev'));
	app.use(connect.directory(__dirname + FILEDIR));
//	app.use(connect.cookieParser());

}
