/**
 * ExampleRenderSystem module.
 * @module RenderSystem
 */
define('ExampleRenderSystem', function(module) {
	'use strict';

	const System = require('System');
	const TiledMap = require('TiledMap');

	/** Class representing a particular type of System used for Rendering. Not intended to be part of final game engine.
	 * @extends System
	 */
	class ExampleRenderSystem extends System {
		constructor() {
			super();
			this.canvas = document.getElementById('game');
			this.context = this.canvas && this.canvas.getContext('2d');
			this.loadingPhase = 0;
			this.mapPath = 'json/level2.json';
			this.map;
		}

		/**
		 * @returns {array}  Array of path strings or plain objects with a "path" and "reviver" function (for JSON)
		 */
		getAssetPaths() {
			switch(this.loadingPhase) {
				case 0:
					return [{
						path: this.mapPath,
						reviver: function(data) {
							return new TiledMap(data);
						}
					}];
				case 1:
					return this.map.getAssetPaths();
			}
		}

		/**
		 * Event handler function - Store downloaded assets
		 * @param {Object} assets - Plain object that works as an associative array. Each item key is a path from "getAssetPaths()"
		 */
		onAssetsLoaded(assets) {
			switch(this.loadingPhase) {
				case 0:
					this.map = assets[this.mapPath];
					break;
				case 1:
					this.map.onAssetsLoaded(assets);
					this.loaded = true;
					break;
			}
			this.loadingPhase++;
		}

		/**
		 * For now, this does nothing but output the given Entity to the console
		 * @param  {Entity} entity - A single Entity instance.
		 */
		forEachEntity() {}

		/**
		 * Gets subset info (helps GameEngine with caching).
		 * @returns {Object}  Plain object used as an associative array. It contains functions which check if a given entity meets criteria.
		 */
		getRequiredSubsets() {
			return {
				tunnelDetails: function(entity) {
					return entity.hasComponent('tunnelDetails');
				}
			};
		}

		/**
		 * Method that is called once per iteration of the main game loop.
		 * Renders map (and, in the future, Entity objects with sprite components).
		 * @param  {DOMHighResTimeStamp} timestamp - Current time in milliseconds.
		 */
		run(timestamp) {
			this.map.render(this.context, 'Background', timestamp, 0, 0, this.canvas.width, this.canvas.height);
			super.run(timestamp, 'tunnelDetails');
			this.map.render(this.context, 'Platforms', timestamp, 0, 0, this.canvas.width, this.canvas.height);
		}
	}

	module.exports = ExampleRenderSystem;
});
