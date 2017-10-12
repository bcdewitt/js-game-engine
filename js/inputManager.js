/**
 * InputManager module.
 * @module InputManager
 */
define('InputManager', function(module) {
	'use strict';

	const keyboardInputs = Symbol();

	const wasPressed = Symbol();
	const held = Symbol();

	class DigitalInput {
		constructor() {
			this[wasPressed] = false;
			this.held = false;
		}

		get held() { return this[held]; }
		set held(val) {
			this[held] = val;

			if (val && this[wasPressed]) {
				this[wasPressed] = false;
			}
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

	if(window.WinJS) { navigator.gamepadInputEmulation = 'keyboard'; }

	/** Class representing an example input manager. Not intended to be part of final game engine.
	 */
	class InputManager {
		constructor() {
			this[keyboardInputs] = {
				[32]: new DigitalInput(), // Space Key
				[37]: new DigitalInput(), // Left Arrow
				[39]: new DigitalInput(), // Right Arrow

				[214]: new DigitalInput(), // GamepadLeftThumbstickLeft
				[205]: new DigitalInput(), // GamepadDPadLeft
				[213]: new DigitalInput(), // GamepadLeftThumbstickRight
				[206]: new DigitalInput(), // GamepadDPadRight
				[195]: new DigitalInput()  // A Button
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
			let key = this[keyboardInputs][195];
			if(key.held) { return key; }

			return this[keyboardInputs][32];
		}

		get leftButton() {
			let key = this[keyboardInputs][205];
			if(key.held) { return key; }

			key = this[keyboardInputs][214];
			if(key.held) { return key; }

			return this[keyboardInputs][37];
		}

		get rightButton() {
			let key = this[keyboardInputs][206];
			if(key.held) { return key; }

			key = this[keyboardInputs][213];
			if (key.held) { return key; }

			return this[keyboardInputs][39];
		}
	}

	module.exports = InputManager;
});
