define('Entity', function(module) {
	'use strict';
		
	class Entity {
		constructor(componentFactory) {
			this.componentFactory = componentFactory;
			this.components = {};
			Object.seal(this);
		}
		
		addComponent(nameStr) {
			if(!nameStr) return;
			this.components[nameStr] || (this.components[nameStr] = this.componentFactory.create(nameStr));
		}
		
		removeComponent(nameStr) {
			delete this.components[nameStr];
		}
		
		getComponent(nameStr) {
			return this.components[nameStr];
		}
		
		hasComponent(nameStr) {
			if(nameStr === undefined) return false;
			return !!this.components[nameStr];
		}
	}

	module.exports = Entity;

});