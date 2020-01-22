const EventEmitter = require('events').EventEmitter

class Handler extends EventEmitter {

  constructor(webhook) {
    super()
    this.webhook = webhook
  }

  _deepCopy(object) {
    return JSON.parse(JSON.stringify(object))
  }

  _hasError(res, msg) {
    res.writeHead(400, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ error: msg }))

    this.callback(new Error(msg))
  }

  _findHandler(requestPath, webhooks) {
    let arrRequestPath = requestPath.split('?')
    let requestedWebhooks = webhooks.filter((webhook) => {
      return this._deepCopy(arrRequestPath).shift() === webhook.path
    })
    return requestedWebhooks[0]
  }

  _initialCheck(req, webHook) {
    if (req.url.split('?').shift() !== webHook.path || req.method !== 'POST') {
      console.log("[_initialCheck] Calling Callback")
      return this.callback()
    }
    let token = req.headers['x-gitlab-token']
    if (!token || token !== webHook.secret) {
      return false
    }
  }

  init(request, response, callback) {
    this.callback = callback

    let data = ''
    let event = ''
    let body = ''
    let webHook = ''

    if (Array.isArray(this.webhook)) {
      webHook = this._findHandler(request.url, this.webhook)
    } else {
      webHook = this.webhook
    }

    if (this._initialCheck(request, webHook, callback) === false) {
      return this._hasError(response, 'No X-Gitlab-Token found on request or the token did not match')
    }

    request.setEncoding('utf8');

    request.on('data', (chunk) => {
      data += chunk
    })

    request.on('end', () => {
      try {
        body = JSON.parse(data)
        event = body['object_kind']
      } catch (error) {
        console.log(error)
        this.emit('error', error)
      }

      let emitData = {
        event: event,
        payload: body,
        protocol: request.protocol,
        host: request.headers['host'],
        url: request.url,
        path: webHook.path
      }
      // Emit the event to handle it better
      this.emit(event, emitData)

      response.writeHead(200, { 'content-type': 'application/json' })
      response.end('{"ok":true}')
    })
  }
}

const createHandler = (webhook) => {
  return new Handler(webhook)
}

exports.createHandler = createHandler
