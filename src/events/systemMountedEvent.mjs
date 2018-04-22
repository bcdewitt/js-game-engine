import { GameEvent } from '../gameEvent.mjs'

export default class SystemMountedEvent extends GameEvent {
	constructor(type, { entities, indexComponents } = {}) {
		super(type)
		Object.defineProperty(this, 'entities', { value: entities, writable: false })
		Object.defineProperty(this, 'indexComponents', { value: indexComponents, writable: false })
	}
}
