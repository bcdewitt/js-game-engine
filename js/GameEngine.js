define('GameEngine', function(module) {
	'use strict';
	
	var utilities = require('utilities');
	var System = require('System');
	var Entity = require('Entity');

	class GameEngine {
		constructor() {
			this.systems = utilities.createIterableObject({});

			this.loaded = false;
			this.entities = [];
			this.intervalId = -1;
			this.interval = 60;
		}
		
		load(func) {
			this.loaded = true;
			func.call(this);
		}
		
		addSystem(nameStr, system) {
			if (!(nameStr && system && system instanceof System)) return;
			this.systems[nameStr] = system;
		}
		
		removeSystem(nameStr) {
			if(!nameStr) return;
			
			var system = this.systems[nameStr];
			if (system) {
				system.onDestroy && system.onDestroy(this.entities);
				delete this.systems[nameStr];
			};
		}
				
		gameLoop() {
			var playing = true;
			for(let key of this.systems) {
				system.run(this.entities);
				playing = playing && !system.stopGame;
			}
			
			if (!this.playing) {
				clearInterval(this.intervalId);
				return;
			}
		}
		
		run() {
			if(!this.loaded) this.load();
			
			this.intervalId = setInterval(() => {
				this.gameLoop();
			}, this.interval);
		}
		
	}

	module.exports = GameEngine;

});