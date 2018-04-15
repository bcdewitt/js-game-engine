import { GameEvent } from '../gameEvent.mjs'

export default class FetchProgressEvent extends GameEvent {
	constructor(type, { progress } = {}) {
		super(type, { bubbles: true })
		Object.defineProperty(this, 'progress', { value: progress, writable: false })
	}
}
