/* eslint-env node */
/* eslint no-console: "off" */
import express from 'express'
import packageData from './package.json'

const app = express()

app.use('/js/ecs-framework', express.static('node_modules/ecs-framework'))
app.use(express.static('public'))

app.listen(packageData.port, function () {
	console.log(`\n\nHTML/resource server listening on port ${packageData.port}\n\n`)
})
