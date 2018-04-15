import { GameEvent } from '../gameEvent.mjs'

export default class SystemLoadedEvent extends GameEvent {
	constructor(type, { assets } = {}) {
		super(type)
		Object.defineProperty(this, 'assets', { value: assets, writable: false })
	}
}
