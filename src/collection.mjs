/**
 * A class that extends Map with partial implementations of common Array
 * methods like .map() .filter(), etc. (and .add() from Set)
 */
class Collection extends Map {
	constructor(iterable, useKeys = false) {
		super(useKeys ? iterable : undefined)
		if (iterable && useKeys === false) {
			for (const item of iterable) {
				this.add(item)
			}
		}
	}

	/**
	 * Adds an item to the Collection, setting the item as the key.
	 *
	 * @param {*} item - The item to be added.
	 * @returns {this} - Returns self for method chaining.
	 */
	add(item) {
		return this.set(item, item)
	}

	/**
	 * The map() method creates a new Collection with the results of calling
	 * a provided function on every element in the calling Collection.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
	 *
	 * @param {function} callback - Function that produces an element of the new Collection.
	 * @returns {Collection} - A new Collection (or subclass) with each element being the result of the callback function.
	 */
	map(callback) {
		const Clazz = this.constructor
		const newCollection = new Clazz()
		this.forEach((item, key) =>
			newCollection.set(key, callback(item, key))
		)
		return newCollection
	}

	/**
	 * The filter() method creates a new Collection with all elements that pass the
	 * test implemented by the provided function.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
	 *
	 * @param {function} callback - Function used to test each element of the Collection.
	 *     Return true to keep the element, false otherwise.
	 * @returns {Collection} - Collection (or subclass) holding filtered results.
	 */
	filter(callback) {
		const Clazz = this.constructor
		const newCollection = new Clazz()
		this.forEach((item, key) => {
			if (callback(item, key)) newCollection.set(key, item)
		})
		return newCollection
	}

	/**
	 * The reduce() method applies a function against an accumulator
	 * and each element in the Collection (from left to right) to reduce
	 * it to a single value.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce
	 *
	 * @param {function} callback - Function to execute on each element in the Collection.
	 * @param {*} [initialValue] - Value to use as the first argument to the first call of the callback.
	 *     If no initial value is supplied, the first element in the Collection will be used.
	 *     Calling reduce() on an empty Collection without an initial value is an error.
	 * @returns {*} - The value that results from the reduction.
	 */
	reduce(callback, initialValue) {
		if (initialValue === undefined && this.size === 0)
			throw new Error('reduce() cannot be called on an empty collection')

		const iterator = this.entries()
		let [, lastVal] = initialValue === undefined
			? iterator.next().value
			: [undefined, initialValue]

		for (const [key, item] of iterator) {
			lastVal = callback(lastVal, item, key)
		}
		return lastVal
	}

	/**
	 * The some() method tests whether at least one element in the Collection passes
	 * the test implemented by the provided function.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some
	 *
	 * @param {function} callback - Function to test for each element.
	 * @returns {boolean} - True if the callback function returns a truthy value for any Collection element; otherwise, false.
	 */
	some(callback) {
		for (const [key, item] of this) {
			if (callback(item, key)) return true
		}
		return false
	}

	/**
	 * The every() method tests whether all elements in the Collection pass the
	 * test implemented by the provided function.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every
	 *
	 * @param {function} callback - Function to test for each element.
	 * @returns {boolean} - True if the callback function returns a truthy value for every Collection element; otherwise, false.
	 */
	every(callback) {
		for (const [key, item] of this) {
			if (!callback(item, key)) return false
		}
		return true
	}

	/**
	 * The find() method returns the value of the first element in the Collection
	 * that satisfies the provided testing function. Otherwise undefined is returned.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
	 *
	 * @param {function} callback - Function to execute on each value in the Collection.
	 * @returns {*} - A value in the Collection if an element passes the test; otherwise, undefined.
	 */
	find(callback) {
		for (const [key, item] of this) {
			if (callback(item, key)) return item
		}
		return undefined
	}

	/**
	 * The findEntry() method returns the first key/value pair in the Collection
	 * that satisfies the provided testing function. Otherwise undefined is returned.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
	 *
	 * @param {function} callback - Function to execute on each value in the Collection.
	 * @returns {*} - A value in the Collection if an element passes the test; otherwise, undefined.
	 */
	findEntry(callback) {
		for (const [key, item] of this) {
			if (callback(item, key)) return [key, item]
		}
		return undefined
	}

	/**
	 * The concat() method is used to merge two or more iterable objects.
	 * This method does not change the existing iterables, but instead
	 * returns a new Collection.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/concat
	 *
	 * @param {...Iterable.<*>} - iterable to concatenate into a new Collection.
	 * @returns {Collection} - A new Collection (or subclass) instance.
	 */
	concat(...iterables) {
		const Clazz = this.constructor // In case Collection gets extended
		const newCollection = new Clazz(this, true)
		for (const iterable of iterables) {
			for (const entry of iterable) {
				const [key, item] = entry
				newCollection.set(key, item)
			}
		}
		return newCollection
	}
}

export default Collection
