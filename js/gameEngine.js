/**
 * GameEngine module.
 * @module GameEngine
 */
define('GameEngine', function(module) {
	'use strict';

	const TiledMap = require('TiledMap');
	const RenderSystem = require('RenderSystem');

	/** Class representing a Game Engine. */
	class GameEngine {

		/**
		 * Create a Game Engine.
		 * @param  {string} jsonPath - File path to map .json file.
		 */
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

		/**
		 * Get an array of Entity instances.
		 * @return {Entity[]}  Entity instances for this game
		 */
		getEntities() {
			return this.entities;
		}

		/**
		 * Instantiate and add Systems for this game.
		 */
		init() {
			this.systems['render'] = new RenderSystem(() => { return this.getEntities(); }, this.map);
			this.initiated = true;
		}

		/**
		 * Fire main loop, which continuously iterates over and runs each System.
		 */
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
