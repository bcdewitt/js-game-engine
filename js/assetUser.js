/**
 * AssetUser module.
 * @module AssetUser
 */
define('AssetUser', function(module) {
	'use strict';

	/**
	 * Class that acts as an interface/abstract class for any class requiring assets. Please avoid instantiating directly.
	 * @interface
	 * */
	class AssetUser {

		/**
		 * Create an AssetUser instance (fails unless overridden).
		 */
		constructor() {
			if (this.constructor === AssetUser) {
				throw new Error('Can\'t instantiate AssetUser! (abstract class)');
			}
			this.loaded = false;
		}

		/**
		 * @returns {array}  Array of path strings or plain objects with a "path" and "reviver" function (for JSON).
		 */
		getAssetPaths() {
			return [];
		}

		/**
		 * Event handler function - Store downloaded assets.
		 * @param {Object} assets - Plain object that works as an associative array. Each item key is a path from "getAssetPaths()".
		 */
		onAssetsLoaded() {
			this.loaded = true;
		}
	}

	module.exports = AssetUser;
});
