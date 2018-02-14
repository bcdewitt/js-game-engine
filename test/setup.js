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
app.use(express.static('src'))
app.use(express.static('test/files'))

// Set up HTML routes for testing each class
app.get('/class/:className', (req, res) => {
	const className = req.params.className
	const fileName = className.charAt(0).toLowerCase() + className.slice(1) + '.mjs'
	console.log(chalk.green(`Loading page with ${className} class.\n`))
	res.send(`<base href="http://localhost">
<script type="module">
import ${className} from '../${fileName}'
window.${className} = ${className}
</script>`)
})

global.__SERVER__ = app.listen(PORT, function () {
	console.log(chalk.green(`\n\nHTML/resource server listening on port ${PORT}.\n`))
})

// Set up the browser
module.exports = async function() {
	const browser = await puppeteer.launch()
	global.__BROWSER__ = browser
	mkdirp.sync(DIR)
	fs.writeFileSync(path.join(DIR, 'wsEndpoint'), browser.wsEndpoint())
}
