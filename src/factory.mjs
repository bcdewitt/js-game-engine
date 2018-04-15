// TODO: JS Doc

const _Factory = new WeakMap()

export default class Factory {
	constructor() {
		_Factory.set(this, {
			middleware: new Set(),
			constructors: new Map(),
		})
	}

	use(middlewareFunc) {
		_Factory.get(this).middleware.add(middlewareFunc)
		return this
	}

	set(constructName, construct) {
		const constructNames = Array.isArray(constructName) ? constructName : [ constructName ]
		constructNames.forEach((constructName) => {
			_Factory.get(this).constructors.set(constructName, construct)
		})
		return this
	}

	has(constructName) {
		return _Factory.get(this).constructors.has(constructName)
	}

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
