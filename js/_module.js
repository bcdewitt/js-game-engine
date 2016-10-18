/* eslint no-native-reassign: "off" */
if (!(define && require)) {
	var define, require; // eslint-disable-line no-var

	(function() {
		'use strict';
		let modules = {};

		class Module {
			constructor(nameStr, closure) {
				this.name = nameStr;
				this.run = closure;
			}
		}

		define = function(nameStr, closure) {
			modules[nameStr] || (modules[nameStr] = new Module(nameStr, closure));
		};

		require = function(nameStr) {
			let module = modules[nameStr];

			if(!module) {
				//console.log('could not find module ' + nameStr);
				return undefined;
			}

			if(!module.exports) {
				module.run(module);

				delete module.run;
			}

			return module.exports;
		};
	})();
}
