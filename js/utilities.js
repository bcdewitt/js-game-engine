/**
 * Utilities module.
 * @module utilities
 */
define('utilities', function(module){
	'use strict';

	/** Class that represents a set of shared convenience methods. */
	class Utilities {

		/**
		 * Creates an associative array (an Object that may be used in a for...of).
		 * @param  {Object=} obj - Plain-data Object.
		 * @returns {Object}  An iterable object for use in for...of loops.
		 */
		createIterableObject(obj) {
			obj = obj || {};
			obj[Symbol.iterator] = Array.prototype[Symbol.iterator];
			return obj;
		}

		/**
		 * Creates an array of the given dimensions.
		 * @param  {...number} [length=0] - Array dimensions.
		 * @returns {Array}  An array that includes the number of dimensions given at the given lengths.
		 */
		createArray(length) {
			let arr, i;

			arr = new Array(length || 0);
			i = length;

			if (arguments.length > 1) {
				let args = Array.prototype.slice.call(arguments, 1);
				while(i--) arr[length-1 - i] = this.createArray.apply(this, args);
			}

			return arr;
		}
	}

	module.exports = new Utilities();
});
