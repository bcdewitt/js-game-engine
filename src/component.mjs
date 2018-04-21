import { MixedWith } from './utilities.mjs'
import observableMixin from './observableMixin.mjs'

const _Component = new WeakMap() // Store private variables here

/**
 * Class representing a Component (the "C" in the ECS design pattern).
 * @mixes observableMixin
 */
class Component extends MixedWith(observableMixin) {

	/**
	 * Create a Component.
	 */
	constructor() {
		super()
		_Component.set(this, {
			parentEntity: null
		})
	}

	/**
	 * Gets the Entity to which this Component belongs
	 * @param {Entity} parentEntity - The Entity to which this Component belongs.
	 * @returns {this} - Returns self for method chaining.
	 */
	setParentEntity(parentEntity = null) {
		_Component.get(this).parentEntity = parentEntity
		return this
	}

	/**
	 * Gets the Entity to which this Component belongs.
	 * @returns {Entity} - Returns the parent Entity.
	 */
	getParentEntity() {
		return _Component.get(this).parentEntity
	}
}

export default Component
