define('Entity', function(module) {
	'use strict';

	class Entity {
		constructor(components) {
			this.components = components || {};
		}

		hasComponent(compName) {
			return this.components[compName] !== undefined;
		}

		getComponent(compName) {
			return this.components[compName];
		}

		addComponent(compName, component) {
			if(!compName) { return; }

			if(typeof component === 'object' && component.constructor === Object) {
				this.components[compName] = component;
			} else {
				this.components[compName] = null;
			}

		}

		removeComponent(compName) {
			delete this.components[compName];
		}
	}

	module.exports = Entity;
});
