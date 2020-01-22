# Gitlab Slack Notification

Gitlab Slack Notification is a simple slack app which notifies the slack channel of the event of the gitlab. I made this for personal use to notify the slack channel when someone pushes commit to the gitlab server.

Currently, handled events are:
  - Push Event
  - Pipeline Event

### Installation and Usages

Gitlab Slack Notification requires [Node.js](https://nodejs.org/) v10.16.0+ to run. Before 

Clone the Repository and Install the dependencies and start the server.
```sh
$ git clone https://github.com/hlgkb/gitlab-slack-notification.git
$ cd gitlab-slack-notification
$ npm install
```

But before running the app there are certain things we need to configure. This is the content of .ene.example we need to update the values. `SLACK_WEBHOOK`, is the URL for the incoming webhook for your app. We can get the Slack Webhook URL from your slack app setting section; see  [Getting started with Incoming Webhooks](https://api.slack.com/messaging/webhooks) for more information. Whereas `WEBHOOK_PATH` and `WEBHOOK_SECRET` refer to Gitlab webhook path and secret token respectively, which you have mentioned during integration setting.

```sh
SLACK_WEBHOOK=
WEBHOOK_SECRET=/webookpath
WEBHOOK_PATH=
```
Running the application
```sh
node .
```
Or using the pm2 module for the production environment
```sh
$ npm install -g pm2
$ pm2 .
```

If you are using in local environment I recommend either using localtunnel or ngrok for tunneling and using the tunneled url with path to the gitlab integration section.

```sh
$ ngrok http 7777

Session Status                online
Session Expires               7 hours, 59 minutes
Version                       2.3.35
Region                        United States (us)
Web Interface                 http://127.0.0.1:4040
Forwarding                    http://37e800d1.ngrok.io -> http://localhost:7777
Forwarding                    https://37e800d1.ngrok.io -> http://localhost:7777
```

Now in this case the webhook url to go in gitlab integration section is `https://37e800d1.ngrok.ioWEBHOOK_PATH`, `WEBHOOK_PATH` is the one that you mentioned in the .env file. Do remember `WEBHOOK_PATH` is path with including `/`, like `/webhook`

### Extending

Currently, I've only added a single webhook for multiple projects but if you need to you can also add for multiple webhooks

In `src\index.js` line number `8` you can see
```js
const handler = createHandler([
  { 'path': process.env.WEBHOOK_PATH, 'secret': process.env.WEBHOOK_SECRET },
])
```

You can add another webhook path and secret in .env
```
WEBHOOK_SECRET1=
WEBHOOK_PATH1=
```

Now add recently added webhook and secret in line number `10`
```js
const handler = createHandler([
  { 'path': process.env.WEBHOOK_PATH, 'secret': process.env.WEBHOOK_SECRET },
  { 'path': process.env.WEBHOOK_PATH1, 'secret': process.env.WEBHOOK_SECRET1 },
])
```

### Todos

 - Write Tests 😊
 - Add support for `Comments`, `Merge Request events`, `Issues events`, `Job events`, `Tag push events`, `Wiki Page events`

License
----

MIT

