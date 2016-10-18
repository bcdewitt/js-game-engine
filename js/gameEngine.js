define('GameEngine', function(module) {
	'use strict';

	const TiledMap = require('TiledMap');
	const RenderSystem = require('RenderSystem');

	class GameEngine {
		constructor(jsonPath) {
			this.loaded = false;
			this.initiated = false;
			this.runAfterLoad = false;
			this.systems = {};
			this.entities = [];

			// Set up map
			this.map = new TiledMap(jsonPath, () => {
				this.loaded = true;

				// *call this.run() if an attempt was made to call this.run() before loading was completed
				if(this.runAfterLoad) { this.run(); }
			});
		}

		getEntities() {
			return this.entities;
		}

		init() {
			this.systems['render'] = new RenderSystem(() => { return this.getEntities(); }, this.map);
			this.initiated = true;
		}

		run() {

			// *If we haven't finished loading, mark a flag to run after load and return
			if(!this.loaded) {
				this.runAfterLoad = true;
				return;
			}

			if(!this.initiated) this.init();

			// Define the main loop logic
			let main = (timestamp) => {

				// ECS design pattern
				for(let systemKey in this.systems) {
					this.systems[systemKey].run(timestamp);
				}

				window.requestAnimationFrame(main);
			};

			// Run main loop (wrapper handles loop logic, main)
			main(performance.now());
		}
	}

	module.exports = GameEngine;
});
