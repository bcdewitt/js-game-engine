/* global Windows, WinJS */

// Game's main entry point








// TODO: May need to put into the build steps - copy game engine files into public/gamelib directory







import GameEngine from './ecs-framework/gameEngine.mjs'
import ExampleSpawnerSystem from './exampleSpawnerSystem.mjs'
import ExampleUpdateSystem from './exampleUpdateSystem.mjs'
import ExamplePhysicsSystem from './examplePhysicsSystem.mjs'
import ExampleSoundSystem from './exampleSoundSystem.mjs'
import ExampleRenderSystem from './exampleRenderSystem.mjs'
import ExampleGameEntityFactory from './exampleEntityFactory.mjs'

class ExampleGameEngine extends GameEngine {
	addSystems() {
		this.addSystem('spawn', new ExampleSpawnerSystem())
		this.addSystem('update', new ExampleUpdateSystem())
		this.addSystem('physics', new ExamplePhysicsSystem())
		this.addSystem('render', new ExampleRenderSystem(this.map))
		this.addSystem('sound', new ExampleSoundSystem(this.map))
		super.addSystems()
	}
}

if (window.WinJS) { // If running as a UWP App (Windows/XBox)
	let app = WinJS.Application
	let activation = Windows.ApplicationModel.Activation

	app.onactivated = function (args) {
		if (args.detail.kind === activation.ActivationKind.launch) {
			let game = new ExampleGameEngine('json/level3.json', new ExampleGameEntityFactory())
			game.run()
		}
	}

	// Run full screen - remove overscan
	let applicationView = Windows.UI.ViewManagement.ApplicationView.getForCurrentView()
	applicationView.setDesiredBoundsMode(Windows.UI.ViewManagement.ApplicationViewBoundsMode.useCoreWindow)

	app.start()
} else {
	let game = new ExampleGameEngine('json/level3.json', new ExampleGameEntityFactory())
	game.run()
}

// To test on Xbox: https://msdn.microsoft.com/windows/uwp/xbox-apps/devkit-activation
// To test on PS4...you need a bunch of steps: https://www.playstation.com/en-us/develop/
// To test on Wii U/3ds: https://developer.nintendo.com/the-process