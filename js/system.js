/**
 * System module.
 * @module System
 */
define('System', function(module) {
	'use strict';

	const AssetUser = require('AssetUser');

	/**
	 * Class that acts as an interface/abstract class for a System (the "S" in the ECS design pattern). Please avoid instantiating directly.
	 * @interface
	 * */
	class System extends AssetUser {

		/**
		 * Create a System.
		 */
		constructor() {
			super();
			if (this.constructor === System) {
				throw new Error('Can\'t instantiate System! (abstract class)');
			}
		}

		/**
		 * Sets the internal function used to get entities from an external source
		 * @param  {function} getEntities - Function that, when run, provides an array of Entity objects.
		 */
		setEntityGetter(getEntities) {
			this._getEntities = getEntities;
		}

		/**
		 * Wrapper for ._getEntities() function - set using .setEntityGetter() (checks if we correctly set up "getRequiredSubsets()" method)
		 * @param {string} subsetName - Name of entity subset to use.
		 * @returns {Entity[]}  List of entities
		 */
		getEntities(subsetName) {
			if(!subsetName || this.getRequiredSubsets()[subsetName]) {
				return this._getEntities(subsetName);
			}

			throw new Error('You must override .getRequiredSubset() to set up subsets before calling .getEntities(subsetName)');
		}

		/**
		 * Gets subset info (helps GameEngine with caching).
		 * @returns {Object}  Plain object used as an associative array. It contains functions which check if a given entity meets criteria.
		 */
		getRequiredSubsets() {
			return {};
		}

		/**
		 * Method that is called once per iteration of the main game loop.
		 * @param  {DOMHighResTimeStamp} timestamp - Current time in milliseconds.
		 */
		run() {
			throw new Error('You must override .run(). (abstract method)');
		}
	}

	module.exports = System;
});
