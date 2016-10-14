define('utilities', function(module){
	'use strict';
	
	class Utilities {
		constructor() {}
		
		createIterableObject(obj) {
			obj = obj || {};
			obj[Symbol.iterator] = Array.prototype[Symbol.iterator];
			return obj;
		}
		
		createArray(length) {
			var
				arr = new Array(length || 0),
				i = length
			;

			if (arguments.length > 1) {
				let args = Array.prototype.slice.call(arguments, 1);
				while(i--) arr[length-1 - i] = this.createArray.apply(this, args);
			}

			return arr;
		}
	}
	
	module.exports = new Utilities();
});