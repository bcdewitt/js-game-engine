/**
 * ExampleRenderSystem module.
 * @module RenderSystem
 */
define('ExampleRenderSystem', function(module) {
	'use strict';

	const System = require('System');

	/** Class representing a particular type of System used for Rendering. Not intended to be part of final game engine.
	 * @extends System
	 */
	class ExampleRenderSystem extends System {
		constructor(map) {
			super();
			this.canvas = document.getElementById('game');
			this.context = this.canvas.getContext('2d');
			this.map = map;
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
