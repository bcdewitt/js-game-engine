/**
 * EntityFactory module.
 * @module EntityFactory
 */

import Entity from './entity.mjs'

/**
 * Class that acts as an interface/abstract class for an EntityFactory. Please avoid instantiating directly.
 * @interface
 */
export default class EntityFactory {

	/**
	 * Create an EntityFactory.
	 */
	constructor() {
		if (this.constructor === EntityFactory) {
			throw new Error('Can\'t instantiate EntityFactory! (abstract class)')
		}
	}

	/**
	 * Create an Entity instance of the given type.
	 * @param {string} entityType - Type of entity (key used to determine which constructor function to use to build entity).
	 * @param {Object} data - Plain object that represents an entity's components.
	 * @param  {function} compCallback - Function to call after a component is added/removed or other changes are made that need to be observed.
	 * @returns  {Entity}  A single Entity instance.
	 */
	create(entityType, data, compCallback) {
		if(typeof data !== 'object' || data.constructor !== Object) {
			throw new Error('Can\'t must use plain objects for data')
		}
		return new Entity(compCallback)
	}
}
