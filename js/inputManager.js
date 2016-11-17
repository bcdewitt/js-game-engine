/**
 * InputManager module.
 * @module InputManager
 */
define('InputManager', function(module) {
	'use strict';

	const keyboardInputs = Symbol();
	const wasPressed = Symbol();

	class DigitalInput {
		constructor() {
			this[wasPressed] = false;
			this.held = false;
		}
		get pressed() {
			let held = this.held;
			let pressed = !this[wasPressed] && held;
			this[wasPressed] = held;

			return pressed;
		}
	}

	/* Can probably use something along these lines for analog inputs:
	const wasPressed = Symbol();
	class AnalogInput {
		constructor() {
			this.value = 0; (may be positive OR negative values)
			this.idleValue = 0;
			this.idleThreshold = 20;
			this.min = -500;
			this.max = 500;
			this[wasPressed] = false;
		}

		get pressed() {
			let held = this.held;
			let pressed = !this[wasPressed] && held;
			this[wasPressed] = held;

			return pressed;
		}

		get held() {
			let idleMin = this.idleValue - this.idleThreshold;
			let idleMax = this.idleValue + this.idleThreshold;

			return (this.value < idleMin || this.value > idleMax);
		}

		get idle() {
			let idleMin = this.idleValue - this.idleThreshold;
			let idleMax = this.idleValue + this.idleThreshold;

			return (this.value >= idleMin && this.value <= idleMax);
		}

	}
	*/

	/** Class representing an example input manager. Not intended to be part of final game engine.
	 */
	class InputManager {
		constructor() {
			this[keyboardInputs] = {
				[32]: new DigitalInput(),
				[37]: new DigitalInput(),
				[38]: new DigitalInput(),
				[39]: new DigitalInput(),
				[40]: new DigitalInput()
			};

			window.addEventListener('keydown', (event) => {
				let key = this[keyboardInputs][event.keyCode];
				if(key) { key.held = true; }
			}, false);

			window.addEventListener('keyup', (event) => {
				let key = this[keyboardInputs][event.keyCode];
				if(key) { key.held = false; }
			}, false);
		}

		get jumpButton() {
			return this[keyboardInputs][32];
		}

		get leftButton() {
			return this[keyboardInputs][37];
		}

		get upButton() {
			return this[keyboardInputs][38];
		}

		get rightButton() {
			return this[keyboardInputs][39];
		}

		get downButton() {
			return this[keyboardInputs][40];
		}
	}

	module.exports = InputManager;
});
