// TODO: JS Doc

const _AsyncFactory = new WeakMap()

export default class AsyncFactory {
	constructor() {
		_AsyncFactory.set(this, {
			middleware: new Set(),
			constructors: new Map(),
		})
	}

	use(middlewareFunc) {
		_AsyncFactory.get(this).middleware.add(middlewareFunc)
		return this
	}

	set(constructName, construct) {
		const constructNames = Array.isArray(constructName) ? constructName : [ constructName ]
		constructNames.forEach((constructName) => {
			_AsyncFactory.get(this).constructors.set(constructName, construct)
		})
		return this
	}

	async create(constructName, data) {
		const _this = _AsyncFactory.get(this)
		const construct = _this.constructors.get(constructName)
		const middleware = [..._this.middleware]

		for (const middlewareFunc of middleware) {
			data = await middlewareFunc(constructName, data)
		}

		return await construct(constructName, data)
	}
}
