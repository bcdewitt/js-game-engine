import { GameEvent } from '../gameEvent.mjs'

export default class GameStopEvent extends GameEvent {
	constructor(type) {
		super(type, { bubbles: true })
	}
}
