/**
 * Entity module.
 * @module Entity
 */

/** Class that represents an Entity (the "E" in the ECS design pattern). */
export default class Entity {

	/**
	 * Create an Entity.
	 * @param  {function} compCallback - Function to call after a component is added/removed.
	 */
	constructor(compCallback) {
		this.compCallback = compCallback
		this.components = {}
	}

	/**
	 * Check if the given component exists for this Entity.
	 * @param  {string} compName - Name of component.
	 * @returns {boolean}  true if the given component exists for this Entity.
	 */
	hasComponent(compName) {
		return this.components[compName] !== undefined
	}

	/**
	 * Gets the component object for this Entity under the given name.
	 * @param  {string} compName - Name of component.
	 * @returns {Object|null}  Returns the component object under the given name.
	 */
	getComponent(compName) {
		return this.components[compName]
	}

	/**
	 * Adds a component object for this Entity under the given name.
	 * @param  {string} compName - Name of component.
	 * @param  {Object=} component - Plain-data Object.
	 * @returns {Object|null}  Returns the component object added under the given name.
	 */
	addComponent(compName, component) {
		if(!compName) { return }

		this.components[compName] = component

		if(this.compCallback) {
			this.compCallback(this)
		}

		return this.components[compName]
	}

	/**
	 * Removes a component object from this Entity under the given name (if it exists).
	 * @param  {string} compName - Name of component.
	 */
	removeComponent(compName) {
		delete this.components[compName]

		if(this.compCallback) {
			this.compCallback(this)
		}
	}
}
