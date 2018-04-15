// TODO: JSDoc

import Collection from './collection.mjs'

const unindexItem = (map, item) => {
	map.forEach((indexer, key) => {
		map.get(key).delete(item)
	})
}

const _Collection = new WeakMap()
export default class IndexedCollection extends Collection {
	constructor() {
		super()
		_Collection.set(this, {
			indexed: new Map(),
			indexers: new Map(),
		})
	}

	// subset filter
	setIndex(indexName, indexer) {
		const _this = _Collection.get(this)

		if (_this.indexers.has(indexName)) return

		_this.indexers.set(indexName, indexer)

		const indexedSet = new Collection()
		this.forEach((item) => {
			const val = indexer(item)
			if (val !== undefined) indexedSet.add(val)
		})

		_this.indexed.set(indexName, indexedSet)

		return this
	}

	// get subset
	getIndexed(indexName) {
		return _Collection.get(this).indexed.get(indexName)
	}

	// Can be called from observing logic (like a Proxy)
	// or events (like if a component property changes)
	reindexItem(item) {
		const _this = _Collection.get(this)
		unindexItem(_this.indexed, item) // in case item was already added
		_this.indexers.forEach((indexer, key) => {
			const val = indexer(item)
			if (val !== undefined) _this.indexed.get(key).add(val)
		})
		return this
	}

	add(item) {
		const returnVal = super.add(item)
		this.reindexItem(item)
		return returnVal
	}

	delete(item) {
		const _this = _Collection.get(this)
		unindexItem(_this.indexed, item)
		return super.delete(item)
	}
}
