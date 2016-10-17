define('GameEngine', function(module) {
	'use strict';

	const utilities = require('utilities');
	const TiledMap = require('TiledMap');

	class GameEngine {
		constructor(jsonPath) {
			this.loaded = false;
			this.initiated = false;
			this.runAfterLoad = false;
			this.canvas = document.getElementById('game');
			this.systems = utilities.createIterableObject();
			this.entities = [];

			// Set up map
			this.map = new TiledMap(jsonPath, () => {
				this.loaded = true;

				// *call this.run() if an attempt was made to call this.run() before loading was completed
				if(this.runAfterLoad) { this.run(); }
			});
		}

		init() {
			// TODO: Init and add each System
			this.initiated = true;
		}

		run() {

			// *If we haven't finished loading, mark a flag to run after load and return
			if(!this.loaded) {
				this.runAfterLoad = true;
				return;
			}

			if(!this.initiated) this.init();

			let context = this.canvas.getContext('2d');

			// Define the main loop logic
			let main = (timestamp) => {

				// TODO: Replace this with actual ECS setup (loop over Systems, RenderSystem will handle context and map.render calls)
				this.map.render(context, 'Background', timestamp, 0, 0, this.canvas.width, this.canvas.height);
				this.map.render(context, 'Platforms', timestamp, 0, 0, this.canvas.width, this.canvas.height);

				window.requestAnimationFrame(main);
			};

			// Run main loop (wrapper handles loop logic, main)
			main(performance.now());
		}
	}

	module.exports = GameEngine;
});
