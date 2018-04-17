const _AsyncFactory = new WeakMap()

/**
 * A class that serves as a container for asynchronous constructors.
 */
class AsyncFactory {
	constructor() {
		_AsyncFactory.set(this, {
			middleware: new Set(),
			constructors: new Map(),
		})
	}

	/**
	 * @param {function} middlewareFunc - Async function to be called prior to all constructors.
	 * @returns {this} - Returns self for method chaining.
	 */
	use(middlewareFunc) {
		_AsyncFactory.get(this).middleware.add(middlewareFunc)
		return this
	}

	/**
	 * @param {string} constructName - Key to use for access to the constructor.
	 * @param {function} construct - Async constructor function.
	 * @returns {this} - Returns self for method chaining.
	 */
	set(constructName, construct) {
		const constructNames = Array.isArray(constructName) ? constructName : [ constructName ]
		constructNames.forEach((constructName) => {
			_AsyncFactory.get(this).constructors.set(constructName, construct)
		})
		return this
	}

	/**
	 * @param {string} constructName - Key to use for access to the constructor.
	 * @returns {boolean} - True if the constructor is set, false otherwise.
	 */
	has(constructName) {
		return _AsyncFactory.get(this).constructors.has(constructName)
	}

	/**
	 * @async
	 * @param {string} constructName - Key to use for access to the constructor.
	 * @param {Object} data - Data to pass on to the constructor.
	 * @returns {*} - Constructor return value.
	 */
	async create(constructName, data) {
		const _this = _AsyncFactory.get(this)
		const construct = _this.constructors.get(constructName)
		if (!construct) {
			console.warn(`${constructName} constructor doesn't exist`)
			return
		}

		const middleware = [..._this.middleware]

		for (const middlewareFunc of middleware) {
			data = await middlewareFunc(constructName, data)
		}

		return await construct(constructName, data)
	}
}

export default AsyncFactory
