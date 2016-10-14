define('ComponentFactory', function(module) {
	'use strict';
	
	class ComponentFactory {
		constructor(obj) {
			this.obj = obj || {};
			Object.freeze(this);
		}
		
		create(nameStr) {
			return (this.obj[nameStr] && new this.obj[nameStr]) || null;
		}
	}
	
	module.exports = ComponentFactory;
});

