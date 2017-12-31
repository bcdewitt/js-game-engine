/**
 * ExampleSoundSystem module.
 * @module ExampleSoundSystem
 */

import System from './ecs-framework/system.mjs'

const _playSound = Symbol('_playSound')
const _time = Symbol('_time')

class TimeOffset {
	constructor(timeStr, millisecondsMode) {
		this[_time] = timeStr
		this.msMode = millisecondsMode || false
	}
	valueOf() {
		let val = 0
		let arr = this[_time].split(':')
		arr.reverse()

		if(arr[3]) { throw Error('Bad TimeOffset string') }
		if(arr[2]) { val += (+arr[2] * 3600000) }
		if(arr[1]) { val += (+arr[1] * 60000) }
		if(arr[0]) { val += (+arr[0] * 1000) }

		if(!this.msMode) return val / 1000

		return val
	}
	toBoolean() {
		return !!this.valueOf()
	}
}

// This is a fix (just in case we only have the webkit prefixed version)
window.AudioContext = window.AudioContext || window.webkitAudioContext

/** Class representing a particular type of System used for playing sound effects and music. Not intended to be part of final game engine.
 * @param {TiledMap} map - The loaded map.
 */
export default class ExampleSoundSystem extends System {
	constructor(map) {
		super()
		this.lastUpdate = null
		this.maxUpdateRate = 60 / 1000
		this.map = map
		this.context = new AudioContext()
		this.tracks = {}
		this.bgmPlay = false
		this.bgmLoopTarget = new TimeOffset(map.bgmLoopTarget)

		this.masterVolume = 1
	}

	/**
	 * Gets subset info (helps GameEngine with caching).
	 * @returns {Object}  Plain object used as an associative array. It contains functions which check if a given entity meets criteria.
	 */
	getRequiredSubsets() {
		return {
			camera: function(entity) {
				return entity.hasComponent('camera')
			},
			sound: function(entity) {
				return entity.hasComponent('sound')
			}
		}
	}

	/**
	 * @returns {array}  Array of path strings or plain objects with a "path" and "reviver" function (for JSON).
	 */
	getAssetPaths() {
		return [
			'sfx/sfx1.wav'
		]
	}

	/**
	 * Event handler function - Store downloaded assets.
	 * @param {Object} assets - Plain object that works as an associative array. Each item key is a path from "getAssetPaths()".
	 */
	onAssetsLoaded(assets) {
		let callback = () => {
			super.onAssetsLoaded()
		}

		if(this.map.bgm) {
			this.bgmPlay = true
			assets['bgm'] = this.map.bgm
		}

		let total = Object.keys(assets).length

		let count = 0
		for(let key in assets) {
			let asset = assets[key]

			this.context.decodeAudioData(asset, (decodedData) => {
				this.tracks[key] = decodedData

				count++
				if(count >= total) {
					callback()
					return
				}
			})
		}

		this.processing = true // prevents engine from continuously trying to load assets while we are processing
	}

	[_playSound](src, startAt, loopAt, callback) {
		let sound = this.tracks[src]
		let source = this.context.createBufferSource()

		source.buffer = sound
		if(callback) { source.onended = callback }
		let gainNode = this.context.createGain()
		gainNode.gain.value = 1

		source.connect(gainNode)
		gainNode.connect(this.context.destination)

		if(loopAt) {
			source.loopStart = loopAt % sound.duration
			source.loopEnd = sound.duration
			source.loop = !!loopAt
		}

		source.start(this.context.currentTime + 0.05, startAt || 0) // first param is "time before playing" (in seconds)

		return {
			gainNode: gainNode
		}
	}

	/**
	 * Method that is called once per iteration of the main game loop.
	 * Renders map (and, in the future, Entity objects with sprite components).
	 * @param  {DOMHighResTimeStamp} timestamp - Current time in milliseconds.
	 */
	run(timestamp) {
		this.lastUpdate = this.lastUpdate || timestamp

		if(this.processing) return

		let deltaTime = timestamp - this.lastUpdate
		if(this.maxUpdateRate && deltaTime < this.maxUpdateRate) return

		if(this.bgmPlay) {
			this.bgmPlay = false
			this[_playSound]('bgm', 0, this.bgmLoopTarget)
		}

		let soundEntities = this.getEntities('sound')
		for(let soundEntity of soundEntities) {
			let c = soundEntity.getComponent('sound')
			let state = soundEntity.getComponent('state')

			// Sound conditions
			if(soundEntity.hasComponent('being')) {
				let type = soundEntity.getComponent('being').type
				if(type === 'Player' && state.groundHit) {
					c.src = 'sfx/sfx1.wav'
					c.play = true
				}
			}

			// Determine distance from soundEntity to cameraCenter
			let distanceToCamCenter = 0
			let radius = 0
			let cameraEntities = this.getEntities('camera')
			for(let cameraEntity of cameraEntities) {
				let cam = cameraEntity.getComponent('camera')
				let a = (c.x - cam.mapCenterX)
				let b = (c.y - cam.mapCenterY)
				let currentDist = Math.sqrt((a*a) + (b*b))
				let currentRad = Math.min(cam.mapHalfWidth, cam.mapHalfHeight)

				distanceToCamCenter = !distanceToCamCenter ?
					currentDist :
					Math.min(distanceToCamCenter, currentDist)

				radius = !radius ?
					currentRad :
					Math.min(radius, currentRad)
			}

			// Play
			if(c.play && c.src) {
				c.gainNode = this[_playSound](c.src, 0, 0).gainNode
				c.play = false
			}

			// Adjust the sound gain depending on the volume setting and the sound distance...
			if(c.gainNode) {
				if(distanceToCamCenter <= radius) {
					c.gainNode.gain.value = c.volume
				} else if(distanceToCamCenter - radius >= radius * 2) {
					c.gainNode.gain.value = 0
				} else {
					let calc = ((distanceToCamCenter - radius) / (radius * 2)) * c.volume
					c.gainNode.gain.value = calc
				}
			}

		}

		this.lastUpdate = timestamp
	}
}
