import { GameEvent } from '../gameEvent.mjs'

export default class SceneUpdateEvent extends GameEvent {
	constructor(type, { entities, deltaTime } = {}) {
		super(type, { bubbles: true })
		Object.defineProperty(this, 'entities', { value: entities, writable: false })
		Object.defineProperty(this, 'timestamp', { value: deltaTime, writable: false })
	}
}
