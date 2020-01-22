require('dotenv').config()
const { createServer } = require("http")
const { createHandler } = require('./lib/Handler')
const { SlackMessage } = require("./lib/SlackMessage")

const slackWebhookPath = process.env.SLACK_WEBHOOK

const handler = createHandler([
  { 'path': process.env.WEBHOOK_PATH, 'secret': process.env.WEBHOOK_SECRET },
])

const app = createServer((request, response) => {
  handler.init(request, response, (error) => {
    console.log("[Handler Callback] Error: ", error)
  })
})

handler.on('push', async (pushData) => {
  SlackMessage.handlePush(pushData, slackWebhookPath)
})

handler.on('pipeline', async (pipelineData) => {
  SlackMessage.handlePipeline(pipelineData, slackWebhookPath)
})

app.listen("7777", () => {
  console.log("Magic at 7777")
})
