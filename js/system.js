define('System', function(module) {
	'use strict';

	class System {
		constructor(getEntities) {
			this.getEntities = getEntities;
		}

		forEachEntity() {} // May use param (entity) when overriding this function

		run() {
			let entities = this.getEntities();
			for(let entity of entities) {
				this.forEachEntity(entity);
			}
		}
	}

	module.exports = System;
});
