const chalk = require('chalk')
const puppeteer = require('puppeteer')
const fs = require('fs')
const mkdirp = require('mkdirp')
const os = require('os')
const path = require('path')
const express = require('express')

const DIR = path.join(os.tmpdir(), 'jest_puppeteer_global_setup')
const PORT = 80

// Set up the server with access to JS modules and files (used in AssetManager)
const app = express()
app.use(express.static('esm'))
app.use('/files', express.static('test/files'))

// Set up HTML route
app.get('/', (req, res) => {
	res.send(`<script type="module">
import Game from './index.mjs'
window.Game = Game
</script>`)
})

global.__SERVER__ = app.listen(PORT, function () {
	console.log(chalk.green(`\n\nHTML/resource server listening on port ${PORT}.\n`))
})

// Set up the puppeteer browser
module.exports = async function() {
	const browser = await puppeteer.launch()
	global.__BROWSER__ = browser
	mkdirp.sync(DIR)
	fs.writeFileSync(path.join(DIR, 'wsEndpoint'), browser.wsEndpoint())
}
