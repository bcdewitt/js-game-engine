// Game's main entry point
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

const game = new ExampleGameEngine('json/level3.json', new ExampleGameEntityFactory())
game.run()
