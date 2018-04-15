import { GameEvent } from '../gameEvent.mjs'

export default class GameSceneChangeEvent extends GameEvent {
	constructor(type, { sceneName } = {}) {
		super(type, { bubbles: true })
		Object.defineProperty(this, 'sceneName', { value: sceneName, writable: false })
	}
}
