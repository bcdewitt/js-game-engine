/**
 * ExampleEntityFactory module.
 * @module ExampleEntityFactory
 */
define('ExampleEntityFactory', function(module) {

	const EntityFactory = require('EntityFactory');

	/** Class representing a particular implementation of an EntityFactory. Not intended to be part of final game engine.
	 * @extends EntityFactory
	 */
	class ExampleEntityFactory extends EntityFactory {

		/**
		 * Create an Entity instance of the given type.
		 * @param {string} entityType - Type of entity (key used to determine which constructor function to use to build entity).
		 * @param {Object} data - Plain object that represents an entity's components.
		 * @param {function} compCallback - Function to call after a component is added/removed or other changes are made that need to be observed.
		 * @returns {Entity}  A single Entity instance.
		 */
		create(entityType, data, compCallback) {
			let entity = super.create(entityType, data, compCallback);
			switch(entityType) {
				case 'PlayerSpawner':
					entity.addComponent('spawner', {
						entityType: 'Player',
						x: data.x,
						y: data.y,
						name: data.name
					});
					break;
				case 'EntitySpawner':
					entity.addComponent('spawner', {
						entityType: 'Monster',
						x: data.x,
						y: data.y,
						name: data.name
					});
					break;
				case 'Monster':
					entity.addComponent('spawned', {
						spawnerSource: data.spawnerSource
					});
					entity.addComponent('sprite', {
						x: data.x,
						y: data.y
					});
			}
			return entity;
		}
	}

	module.exports = ExampleEntityFactory;
});
