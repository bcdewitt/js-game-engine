const _Factory = new WeakMap()

/**
 * A class that serves as a container for synchronous constructors.
 */
class Factory {
	constructor() {
		_Factory.set(this, {
			middleware: new Set(),
			constructors: new Map(),
		})
	}

	/**
	 * @param {function} middlewareFunc - Function to be called prior to all constructors.
	 * @returns {this} - Returns self for method chaining.
	 */
	use(middlewareFunc) {
		_Factory.get(this).middleware.add(middlewareFunc)
		return this
	}

	/**
	 * @param {string} constructName - Key to use for access to the constructor.
	 * @param {function} construct - Constructor function.
	 * @returns {this} - Returns self for method chaining.
	 */
	set(constructName, construct) {
		const constructNames = Array.isArray(constructName) ? constructName : [ constructName ]
		constructNames.forEach((constructName) => {
			_Factory.get(this).constructors.set(constructName, construct)
		})
		return this
	}

	/**
	 * @param {string} constructName - Key to use for access to the constructor.
	 * @returns {boolean} - True if the constructor is set, false otherwise.
	 */
	has(constructName) {
		return _Factory.get(this).constructors.has(constructName)
	}

	/**
	 * @param {string} constructName - Key to use for access to the constructor.
	 * @param {Object} data - Data to pass on to the constructor.
	 * @returns {*} - Constructor return value.
	 */
	create(constructName, data) {
		const _this = _Factory.get(this)
		const construct = _this.constructors.get(constructName)
		if (!construct) {
			console.warn(`${constructName} constructor doesn't exist`)
			return
		}
		const middleware = [..._this.middleware]
		data = middleware.reduce((inData, func) => func(constructName, inData), data)
		return construct(constructName, data)
	}
}

export default Factory
