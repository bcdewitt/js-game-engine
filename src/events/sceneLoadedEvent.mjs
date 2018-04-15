import { GameEvent } from '../gameEvent.mjs'

export default class SceneLoadedEvent extends GameEvent {
	constructor(type, { assets } = {}) {
		super(type, { bubbles: true })
		Object.defineProperty(this, 'assets', { value: assets, writable: false })
	}
}
