import { MixedWith } from './utilities.mjs'
import observableMixin from './observableMixin.mjs'

const getAllObjKeys = (obj) => [... new Set(obj ? Object.keys(obj).concat(
	getAllObjKeys(Object.getPrototypeOf(obj))
) : [])]

const _Component = new WeakMap() // Store private variables here
const _ProtoChainKeys = new WeakMap() // Cache object keys from prototype chains

/** Class that represents an Component (the "C" in the ECS design pattern). */
class Component extends MixedWith(observableMixin) {

	/**
	 * Create a Component.
	 * @param {Object} [obj] - Object with properties to assign to this Component
	 */
	constructor(obj) {
		super()
		if (obj) this.decorate(obj)
		_Component.set(this, {
			parentEntity: null
		})
	}

	/**
	 * Decorates an existing object with Component functionality.
	 * @param {Object} [obj] - Object with properties to assign to this Component
	 * @returns {this} - Returns self for method chaining.
	 */
	decorate(obj = {}) {
		const objProto = Reflect.getPrototypeOf(obj)

		let objKeys
		if (objProto !== Object.prototype) {
			if (!_ProtoChainKeys.has(objProto))
				_ProtoChainKeys.set(objProto, getAllObjKeys(obj))
			objKeys = _ProtoChainKeys.get(objProto)
		} else {
			objKeys = getAllObjKeys(obj)
		}

		objKeys.forEach((key) => {
			Reflect.defineProperty(this, key, {
				enumerable: true,
				get() { return obj[key] },
				set(val) { obj[key] = val },
			})
		})

		return this
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
