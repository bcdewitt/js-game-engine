/**
 * ExampleEntityFactory module.
 * @module ExampleEntityFactory
 */

import EntityFactory from './ecs-framework/entityFactory.mjs'

// Import component classes
import SpriteComponent from './components/spriteComponent.mjs'
import SpritePhysicsComponent from './components/spritePhysicsComponent.mjs'
import SpriteSoundComponent from './components/spriteSoundComponent.mjs'
import StateComponent from './components/stateComponent.mjs'

/** Class representing a particular implementation of an EntityFactory. Not intended to be part of final game engine.
 * @extends EntityFactory
 */
export default class ExampleEntityFactory extends EntityFactory {

	/**
	 * Create an Entity instance of the given type.
	 * @param {string} entityType - Type of entity (key used to determine which constructor function to use to build entity).
	 * @param {Object} data - Plain object that represents an entity's components.
	 * @param {function} compCallback - Function to call after a component is added/removed or other changes are made that need to be observed.
	 * @returns {Entity}  A single Entity instance.
	 */
	create(entityType, data, compCallback) {
		let entity = super.create(entityType, data, compCallback)
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
					get mapHalfWidth() { return this.mapWidth / 2 },
					get mapHalfHeight() { return this.mapHeight / 2 },
					get mapCenterX() { return this.mapX + this.mapHalfWidth },
					get mapCenterY() { return this.mapY + this.mapHalfHeight },
					following: data.following
				})
				break
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
				})
				break
			case 'PlayerSpawner':
				entity.addComponent('spawner', {
					entityType: 'Player',
					x: data.x,
					y: data.y,
					name: data.name
				})
				break
			case 'EntitySpawner':
				entity.addComponent('spawner', {
					entityType: 'Monster',
					x: data.x,
					y: data.y,
					name: data.name
				})
				break
			case 'Player':
			case 'Monster':
				entity.addComponent('spawned', {
					spawnerSource: data.spawnerSource
				})
				entity.addComponent('being', {
					type: entityType
				})
				entity.addComponent('state', new StateComponent('idle'))
				entity.addComponent('sprite', new SpriteComponent(
					data.x,
					data.y,
					data.width,
					data.height,
					(entityType === 'Player' ? 1 : 0),
					(entityType === 'Player' ? 'Player' : 'Platforms')
				))
				entity.addComponent('physicsBody', new SpritePhysicsComponent(entity))
				entity.addComponent('sound', new SpriteSoundComponent(null, entity))
		}
		return entity
	}
}
