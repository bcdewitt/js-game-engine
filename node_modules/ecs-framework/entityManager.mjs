/**
 * EntityManager module.
 * @module EntityManager
 */

/** Class representing a collection of entities and logic to run against that collection. */
export default class EntityManager {

	/**
	 * Create an Entity Manager.
	 * @param {EntityFactory} entityFactory - Instance of an EntityFactory. Used when calling addEntity() method.
	 */
	constructor(entityFactory) {
		this.entityFactory = entityFactory
		this.entities = []
		this.entitySubsets = {}
	}

	/**
	 * Get an array of Entity instances.
	 * @param  {string=} subsetName - Name of entity subset.
	 * @returns {Entity[]}  Entity instances for this game.
	 */
	getEntities(subsetName) {
		if(!subsetName) { return this.entities }
		return this.entitySubsets[subsetName].entities
	}

	/**
	 * Create a subset of the Entity array for this game.
	 * @param  {string} subsetName - Name of component used to get subset.
	 * @param  {function} mapper - Function to help determine if an Entity should be a part of this subset.
	 */
	addEntitySubset(subsetName, mapper) {
		this.entitySubsets[subsetName] = {
			entities: this.entities.filter(mapper),
			shouldContain: mapper
		}
	}

	/**
	 * Add an Entity.
	 * @param  {string} entityType - Type of Entity to add to this game.
	 * @param {Object} data - Plain object representing the component data.
	 * @returns {Entity}  Entity that was added
	 */
	addEntity(entityType, data) {

		let callback = (entity) => {
			for(let subsetKey in this.entitySubsets) {
				let subset = this.entitySubsets[subsetKey]
				let idx = subset.entities.indexOf(entity)
				if(idx === -1 && subset.shouldContain(entity)) {
					subset.entities.push(entity)
				} else if (idx !== -1 && !subset.shouldContain(entity)) {
					subset.entities.splice(idx, 1)
				}
			}
		}

		let entityToAdd = this.entityFactory.create(
			entityType,
			data,
			callback
		)

		this.entities.push(entityToAdd)

		return this.entities[this.entities.length - 1]
	}

	/**
	 * Remove an Entity.
	 * @param {Entity}  entity - Entity instance to be removed
	 */
	removeEntity(entity) {
		let handle = (list) => {
			let idx = list.indexOf(entity)
			if(idx !== -1) {
				list.splice(idx, 1)
			}
		}

		// Remove from subset arrays
		for(let subsetKey in this.entitySubsets) {
			let subset = this.entitySubsets[subsetKey]
			handle(subset.entities)
		}

		// Remove from main set array
		handle(this.entities)
	}
}
