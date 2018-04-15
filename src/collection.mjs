// TODO: JSDoc

export default class Collection extends Set {
	map(func) {
		const newSet = new Collection()
		this.forEach(item => newSet.add(func(item)))
		return newSet
	}

	filter(func) {
		const newSet = new Collection()
		this.forEach(item => { if (func(item)) newSet.add(item) })
		return newSet
	}

	reject(func) {
		return this.filter(item => !func(item))
	}

	reduce(func, defaultVal) {
		if (defaultVal === undefined && this.size === 0)
			throw new Error('reduce() cannot be called on an empty set')

		const iterator = this.values()
		let lastVal = defaultVal === undefined ? iterator.next().value : defaultVal
		for (const item of iterator) {
			lastVal = func(lastVal, item)
		}
		return lastVal
	}

	some(func) {
		for (const item of this) {
			if (func(item)) return true
		}
		return false
	}

	every(func) {
		for (const item of this) {
			if (!func(item)) return false
		}
		return true
	}

	find(func) {
		for (const item of this) {
			if (func(item)) return item
		}
		return undefined
	}

	concat(iterable) {
		const newSet = new Collection(this) // TODO: Change to make sure we can handle subclasses
		for (const item of iterable) {
			newSet.add(item)
		}
		return newSet
	}
}
