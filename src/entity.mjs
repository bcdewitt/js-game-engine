import { MixedWith } from './utilities.mjs'
import observableMixin from './observableMixin.mjs'

const _Entity = new WeakMap() // Store private variables here

/** Class that represents an Entity (the "E" in the ECS design pattern). */
class Entity extends MixedWith(observableMixin) {

	/**
	 * Create an Entity.
	 */
	constructor() {
		super()
		_Entity.set(this, {
			components: new Map()
		})
		this.makeObservable('setComponent')
		this.makeObservable('removeComponent')
	}

	/**
	 * Sets a component object for this Entity under the given name.
	 * @param  {string} compName - Name of component.
	 * @param  {Object=} component - Plain-data Object.
	 * @returns {this} - Returns self for method chaining.
	 */
	setComponent(compName, component) {
		component.setParentEntity(this)
		_Entity.get(this).components.set(compName, component)
		return this
	}

	/**
	 * Removes a component object from this Entity under the given name (if it exists).
	 * @param  {string} compName - Name of component.
	 * @returns {this} - Returns self for method chaining.
	 */
	removeComponent(compName) {
		_Entity.get(this).components.delete(compName)
		return this
	}

	/**
	 * Gets the component object for this Entity under the given name.
	 * @param  {string} compName - Name of component.
	 * @returns {Object|null}  Returns the component object under the given name.
	 */
	getComponent(compName) {
		return _Entity.get(this).components.get(compName)
	}

	/**
	 * Check if the given component exists for this Entity.
	 * @param  {string} compName - Name of component.
	 * @returns {boolean}  true if the given component exists for this Entity.
	 */
	hasComponent(compName) {
		return _Entity.get(this).components.has(compName)
	}
}

export default Entity
