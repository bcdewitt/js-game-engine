import { GameEvent } from '../gameEvent.mjs'

export default class SystemMountedEvent extends GameEvent {
	constructor(type, { entities } = {}) {
		super(type)
		Object.defineProperty(this, 'entities', { value: entities, writable: false })
	}
}
