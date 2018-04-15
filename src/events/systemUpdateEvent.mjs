import { GameEvent } from '../gameEvent.mjs'

export default class SystemUpdateEvent extends GameEvent {
	constructor(type, { entities, deltaTime, timestamp } = {}) {
		super(type)
		Object.defineProperty(this, 'entities', { value: entities, writable: false })
		Object.defineProperty(this, 'timestamp', { value: timestamp, writable: false })
		Object.defineProperty(this, 'deltaTime', { value: deltaTime, writable: false })
	}
}
