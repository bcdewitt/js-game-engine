define('DrawingManager', function(module){
	'use strict';
	
	var canvas, context;
	
	class DrawingManager {
		constructor(id) {
			id = id || 'game';
			canvas = document.getElementById(id);
			context = canvas.getContext('2d');
		}
	}
	
	module.exports = DrawingManager;
});