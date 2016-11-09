/**
 * InputManager module.
 * @module InputManager
 */
define('InputManager', function(module) {
	'use strict';

	/** Class representing a particular type of System used for updating entities. Not intended to be part of final game engine.
	 */
	class InputManager {
		constructor() {
			this.reset();

			window.addEventListener('keydown', (event) => {
				switch (event.keyCode) {
					case 37: // Left
						this.leftArrow = true;
						break;
					case 38: // Up
						this.upArrow = true;
						break;
					case 39: // Right
						this.rightArrow = true;
						break;
					case 40: // Down
						this.downArrow = true;
						break;
				}
			}, false);
		}

		reset() {
			this.leftArrow = false;
			this.upArrow = false;
			this.rightArrow = false;
			this.downArrow = false;
		}
	}

	module.exports = InputManager;
});
