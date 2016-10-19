/**
 * RenderSystem module.
 * @module RenderSystem
 */
define('RenderSystem', function(module) {
	'use strict';

	const System = require('System');

	/** Class representing a particular type of System used for Rendering
	 * @extends System
	 */
	class RenderSystem extends System {
		constructor(getEntities, map) {
			super(getEntities);
			this.canvas = document.getElementById('game');
			this.context = this.canvas.getContext('2d');
			this.map = map;
		}

		/**
		 * For now, this does nothing but output the given Entity to the console
		 * @param  {Entity} entity - A single Entity instance.
		 */
		forEachEntity(entity) {
			console.log(entity);
		}

		/**
		 * Method that is called once per iteration of the main game loop.
		 * Renders map (and, in the future, Entity objects with sprite components).
		 * @param  {DOMHighResTimeStamp} timestamp - Current time in milliseconds.
		 */
		run(timestamp) {
			this.map.render(this.context, 'Background', timestamp, 0, 0, this.canvas.width, this.canvas.height);
			super.run(timestamp);
			this.map.render(this.context, 'Platforms', timestamp, 0, 0, this.canvas.width, this.canvas.height);
		}
	}

	module.exports = RenderSystem;
});
