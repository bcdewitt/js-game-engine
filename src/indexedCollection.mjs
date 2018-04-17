import Collection from './collection.mjs'

const _Collection = new WeakMap()

/**
 * Class that extends Set/Collection to create and access subsets via indexes.
 */
class IndexedCollection extends Collection {
	constructor() {
		super()
		_Collection.set(this, {
			indexed: new Map(),
			indexers: new Map(),
		})
	}

	/**
	 * Creates a subset.
	 *
	 * @param {string} indexName - Key used to identify the subset.
	 * @param {function} indexer - Function that produces an element of the subset.
	 * @returns {this} - Returns self for method chaining.
	 */
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

	/**
	 * Creates a subset.
	 *
	 * @param {string} indexName - Key used to identify the subset.
	 * @returns {Collection} - The subset Collection.
	 */
	getIndexed(indexName) {
		return _Collection.get(this).indexed.get(indexName)
	}

	/**
	 * Removes an item from all subsets.
	 *
	 * @param {*} item - Item to remove.
	 * @returns {this} - Returns self for method chaining.
	 */
	unindexItem(item) {
		const map = _Collection.get(this).indexed
		map.forEach((indexer, key) => {
			map.get(key).delete(item)
		})
		return this
	}

	/**
	 * Removes an item from all subsets. Intended to be called from observing
	 * logic (like a Proxy) or events (like if a component property changes)
	 *
	 * @param {*} item - Item to remove.
	 * @returns {this} - Returns self for method chaining.
	 */
	reindexItem(item) {
		const _this = _Collection.get(this)
		this.unindexItem(item) // in case item was already added
		_this.indexers.forEach((indexer, key) => {
			const val = indexer(item)
			if (val !== undefined) _this.indexed.get(key).add(val)
		})
		return this
	}

	/**
	 * Adds an item to the Collection. All indexer functions are run against
	 * each added item so the item is also added to the correct subset.
	 *
	 * @param {*} item - Item to add.
	 * @returns {this} - Returns self for method chaining.
	 */
	add(item) {
		const returnVal = super.add(item)
		this.reindexItem(item)
		return returnVal
	}

	/**
	 * Removes an item from the Collection and all subsets.
	 *
	 * @param {*} item - Item to remove.
	 * @returns {this} - Returns self for method chaining.
	 */
	delete(item) {
		this.unindexItem(item)
		return super.delete(item)
	}
}

export default IndexedCollection
