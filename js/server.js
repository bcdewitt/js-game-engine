/* eslint-env node */
/* eslint no-console: "off" */
'use strict';

//const babel   = require('babel-core'); // Also using https://github.com/babel/babili
const http    = require('http');
const fs      = require('fs');
const path    = require('path');

process.chdir('../');
http.createServer(function(request, response) {
	let filePath = request.url, ext;

	// If filePath ends in a slash, replace the slash with /index.html
	filePath = filePath.replace(/\/$/, '/index.html');

	// If filePath starts with a slash, replace it with ./
	filePath = filePath.replace(/^\//, './');

	ext = path.extname(filePath);

	// If the file path includes no extension and doesn't end with a slash, redirect
	if(!ext && !/\/$/.test(filePath)) {
		response.writeHead(301, { 'Location': filePath + '/' });
		response.end();
	}

	// Preprocess and respond differently depending on the file type
	switch(ext) {

		// JavaScript
		case '.js':
			fs.readFile(filePath, function(error, content) {
				if(!error) {

					// For more options, see http://babeljs.io/docs/usage/options/
					/*
					let options = {
						presets: ['babili']
					};
					*/

					// transpile JS to ES5 standard (also minified thanks to babili preset)
					//content = babel.transform(content, options).code;

					response.writeHead(200);
					response.end(content, 'utf-8');
				} else {
					response.writeHead(404);
					response.end();
				}
			});
			break;

		// Other
		default:
			fs.readFile(filePath, function(error, content) {
				if (error) {
					if(error.code === 'ENOENT'){
						fs.readFile('./404.html', function(error, content) {
							response.writeHead(200);
							response.end(content, 'utf-8');
						});
					} else {
						response.writeHead(500);
						response.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
						response.end();
					}
				} else {
					response.writeHead(200);
					response.end(content, 'utf-8');
				}
			});
	}

}).listen(8080);
console.log('Server running on localhost (port 8080)');
