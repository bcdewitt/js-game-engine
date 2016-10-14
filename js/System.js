define('System', function(module){
	'use strict';
	
	class System {
		constructor() {
			this.stopGame = false;
		}
		
		run(entities) {
			this.stopGame();
		}
		
		stopGame() {
			this.stopGame = true;
		}
	}
	
	module.exports = System;
});