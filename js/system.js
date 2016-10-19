/**
 * System module.
 * @module System
 */
define('System', function(module) {
	'use strict';

	/**
	 * Class that acts as an interface/abstract class for a System (the "S" in the ECS design pattern). Please avoid instantiating directly.
	 * @interface
	 * */
	class System {

		/**
		 * Create a System.
		 * @param  {function} getEntities - Function that, when run, provides an array of Entity objects.
		 */
		constructor(getEntities) {
			if (this.constructor === System) {
				throw new Error('Can\'t instantiate System! (abstract class)');
			}
			this.getEntities = getEntities;
		}

		/**
		 * Intended to be overridden. Provides logic to be run for each Entity.
		 * @abstract
		 * @param  {Entity} entity - A single Entity instance.
		 */
		forEachEntity() {
			throw new Error('"forEachEntity() method" must be implemented by System subclass!');
		}

		/**
		 * Method that is called once per iteration of the main game loop.
		 * Note: This can be overridden too, but it is recommended to call super.run() so the forEachEntity method will still fire.
		 * @param  {DOMHighResTimeStamp} timestamp - Current time in milliseconds.
		 */
		run() {
			let entities = this.getEntities();
			for(let entity of entities) {
				this.forEachEntity(entity);
			}
		}
	}

	module.exports = System;
});
