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
			this.entityManager = null;
		}

		/**
		 * Sets the internal function used to get entities from an external source
		 * @param  {EntityManager} entityManager - Provides an API for an entity collection.
		 */
		setEntityManager(entityManager) {
			this.entityManager = entityManager;
		}

		/**
		 * Wrapper for ._getEntities() function - set using .setEntityGetter() (checks if we correctly set up "getRequiredSubsets()" method)
		 * @param {string} subsetName - Name of entity subset to use.
		 * @returns {Entity[]}  List of entities
		 */
		getEntities(subsetName) {
			if(!subsetName || this.getRequiredSubsets()[subsetName]) {
				return this.entityManager && this.entityManager.getEntities(subsetName);
			}

			throw new Error('You must override .getRequiredSubset() to set up subsets before calling .getEntities(subsetName)');
		}

		/**
		 * Add an Entity.
		 * @param  {string} entityType - Type of Entity to add to this game.
		 * @param {Object} data - Plain object representing the component data.
		 * @returns {Entity}  Entity that was added
		 */
		addEntity(entityType, data) {
			return this.entityManager && this.entityManager.addEntity(entityType, data);
		}

		/**
		 * Remove an Entity.
		 * @param {Entity}  entity - Entity instance to be removed
		 */
		removeEntity(entity) {
			this.entityManager && this.entityManager.removeEntity(entity);
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
