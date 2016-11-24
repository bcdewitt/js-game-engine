/**
 * ExampleEntityFactory module.
 * @module ExampleEntityFactory
 */
define('ExampleEntityFactory', function(module) {

	const EntityFactory = require('EntityFactory');

	const SpriteComponent = (function() {
		let _x = Symbol('_x');
		let _y = Symbol('_y');
		let _width = Symbol('_width');
		let _height = Symbol('_height');
		class SpriteComponent {
			constructor(x, y, width, height, frame, layer) {
				this.x = x;
				this.y = y;
				this.width = width;
				this.height = height;
				this.frame = frame;
				this.layer = layer;
				this.flipped = false;
			}
			get x() {
				return this[_x];
			}
			set x(val) {
				this[_x] = val;
				this.midPointX = val + this.halfWidth;
			}

			get y() {
				return this[_y];
			}
			set y(val) {
				this[_y] = val;
				this.midPointY = val + this.halfHeight;
			}

			get width() {
				return this[_width];
			}
			set width(val) {
				this[_width] = val;
				this.halfWidth = val / 2;
				this.midPointX = this.x + this.halfWidth;
			}

			get height() {
				return this[_height];
			}
			set height(val) {
				this[_height] = val;
				this.halfHeight = val / 2;
				this.midPointY = this.y + this.halfHeight;
			}
		}

		return SpriteComponent;
	})();

	const SpritePhysicsComponent = (function() {
		let _entity = Symbol('_x');
		let _spriteComp = Symbol('_x');
		class SpritePhysicsComponent {
			constructor(entity) {
				this[_entity] = entity;
				this.accX = 0;
				this.accY = 0;
				this.spdX = 0;
				this.spdY = 0;
			}
			get [_spriteComp]() { return this[_entity].getComponent('sprite'); }
			get x() { return this[_spriteComp].x; }
			set x(val) { this[_spriteComp].x = val; }
			get y() { return this[_spriteComp].y; }
			set y(val) { this[_spriteComp].y = val; }
			get width() { return this[_spriteComp].width; }
			set width(val) { this[_spriteComp].width = val; }
			get height() { return this[_spriteComp].height; }
			set height(val) { this[_spriteComp].height = val; }
			get midPointX() { return this[_spriteComp].midPointX; }
			set midPointX(val) { this[_spriteComp].midPointX = val; }
			get midPointY() { return this[_spriteComp].midPointY; }
			set midPointY(val) { this[_spriteComp].midPointY = val; }
			get halfWidth() { return this[_spriteComp].halfWidth; }
			set halfWidth(val) { this[_spriteComp].halfWidth = val; }
			get halfHeight() { return this[_spriteComp].halfHeight; }
			set halfHeight(val) { this[_spriteComp].halfHeight = val; }
		}

		return SpritePhysicsComponent;
	})();

	const StateComponent = (function() {
		const state = Symbol('_symbol');
		class StateComponent {
			constructor(initialState) {
				this[state] = null;
				this.lastState = null;
				this.lastUpdate = null;
				this.grounded = false;
				this.state = initialState;
			}
			get state() {
				return this[state];
			}
			set state(val) {
				this.lastState = this[state];
				this[state] = val;
				this.lastUpdate = window.performance.now();
			}
		}

		return StateComponent;
	})();

	/** Class representing a particular implementation of an EntityFactory. Not intended to be part of final game engine.
	 * @extends EntityFactory
	 */
	class ExampleEntityFactory extends EntityFactory {

		/**
		 * Create an Entity instance of the given type.
		 * @param {string} entityType - Type of entity (key used to determine which constructor function to use to build entity).
		 * @param {Object} data - Plain object that represents an entity's components.
		 * @param {function} compCallback - Function to call after a component is added/removed or other changes are made that need to be observed.
		 * @returns {Entity}  A single Entity instance.
		 */
		create(entityType, data, compCallback) {
			let entity = super.create(entityType, data, compCallback);
			switch(entityType) {
				case 'Camera':
					entity.addComponent('camera', {
						x: data.x,
						y: data.y,
						width: data.width,
						height: data.height,
						mapX: data.mapX,
						mapY: data.mapY,
						mapWidth: data.mapWidth,
						mapHeight: data.mapHeight,
						following: data.following
					});
					break;
				case 'Collision':
					entity.addComponent('staticPhysicsBody', {
						x: data.x,
						y: data.y,
						width: data.width,
						height: data.height,
						halfWidth: data.width / 2,
						halfHeight: data.height / 2,
						midPointX: data.x + (data.width / 2),
						midPointY: data.y + (data.height / 2)
					});
					break;
				case 'PlayerSpawner':
					entity.addComponent('spawner', {
						entityType: 'Player',
						x: data.x,
						y: data.y,
						name: data.name
					});
					break;
				case 'EntitySpawner':
					entity.addComponent('spawner', {
						entityType: 'Monster',
						x: data.x,
						y: data.y,
						name: data.name
					});
					break;
				case 'Player':
				case 'Monster':
					entity.addComponent('spawned', {
						spawnerSource: data.spawnerSource
					});
					entity.addComponent('being', {
						type: entityType
					});
					entity.addComponent('state', new StateComponent('idle'));
					entity.addComponent('sprite', new SpriteComponent(
						data.x,
						data.y,
						data.width,
						data.height,
						(entityType === 'Player' ? 1 : 0),
						(entityType === 'Player' ? 'Player' : 'Platforms')
					));
					entity.addComponent('physicsBody', new SpritePhysicsComponent(entity));
			}
			return entity;
		}
	}

	module.exports = ExampleEntityFactory;
});
