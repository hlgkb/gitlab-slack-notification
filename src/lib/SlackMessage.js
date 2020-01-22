const request = require("request")
const { forEach, humanFormatDate } = require('./Utils')

class SlackMessage {

  async _post(webHookUrl, postData) {
    return new Promise((resolve, reject) => {
      let options = {
        url: webHookUrl,
        method: 'POST',
        body: JSON.stringify(postData),
        headers: { 'Content-Type': 'application/json' }
      }

      function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
          resolve(body)
        } else {
          if (error) {
            reject(error)
          }
        }
      }
      request(options, callback);
    })
  }

  _commitMessage(commitDetails) {
    let message = [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "\n*Gitlab Commit Update* :wave:"
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `Project: *<${commitDetails["url"]}|${commitDetails["projectName"]}>*\n Commit Author *${commitDetails["commitDetails"]["commitAuthor"]}* `
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `• Commit id: ${commitDetails["commitDetails"]["commitId"]} \n • Commit Message: *<${commitDetails["commitDetails"]["commitUrl"]}|${commitDetails["commitDetails"]["_commitMessage"]}>* \n • Commit Date: 2011-12-12 2:15 PM  `
        }
      },
    ]
    return message
  }

  _pipelineMessage(pipelineDetails) {
    let noBuilds = {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "No Build Found 😊"
        }
      ]
    }
    let message = [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*Gitlab Pipeline Update* :construction: :rocket:"
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `Hello there :muscle:, a pipeline has update on ${pipelineDetails["ref"]} branch. Do look into gitlab CI pipelines.`
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `*Commit Details*\n:bearded_person: Author: *${pipelineDetails["commitDetails"]["commitAuthor"]}*\n :speech_balloon: Message: *${pipelineDetails["commitDetails"]["_commitMessage"]}*`
        },
      },
      {
        "type": "divider"
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*_Builds_*"
        }
      },
    ]

    if (pipelineDetails.stages.length === 0) {
      message.push(noBuilds)
    } else {
      for (let index = 0;index < pipelineDetails.stages.length;index++) {
        const build_stage = pipelineDetails.stages[index];
        let mrkdwn = `Stage: *${build_stage}*\n`
        let stages = pipelineDetails["builds"][build_stage]
        forEach(stages, (stage) => {
          let _str = `    :small_blue_diamond: ${stage.name}`
          if (stage.status === 'success') {
            _str += `   *Success*      :heavy_check_mark:  ${(stage.finished_at != null) ? humanFormatDate(stage.finished_at) : ''}\n `
          } else if (stage.status === 'skipped') {
            _str += `   *Skipped*     :fast_forward: ${(stage.finished_at != null) ? humanFormatDate(stage.finished_at) : ''}\n`
          } else if (stage.status === 'canceled') {
            _str += `   *Canceled*     :cow:  ${(stage.finished_at != null) ? humanFormatDate(stage.finished_at) : ''}\n`
          } else if (stage.status === 'manual') {
            _str += `   *Not Started*     :black_medium_small_square:  ${(stage.finished_at != null) ? humanFormatDate(stage.finished_at) : ''}\n`
          } else if (stage.status === 'pending') {
            _str += `   *Pending*     :hourglass_flowing_sand:  ${(stage.finished_at != null) ? humanFormatDate(stage.finished_at) : ''}\n`
          } else {
            _str += `   *Failed*     :heavy_multiplication_x:  ${(stage.finished_at != null) ? humanFormatDate(stage.finished_at) : ''}\n`
          }
          mrkdwn += _str
        })
        let mrkdwnSection = {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": mrkdwn
          },
        }
        message.push(mrkdwnSection)
      }
    }
    return message
  }

  async _message(webHookUrl, postingMessage) {
    let requestData = {
      blocks: postingMessage
    }
    try {
      let response = await this._post(webHookUrl, requestData)
      console.log("[slackMessage] Updated in slack. Response ", response)
    } catch (error) {
      console.log("[slackMessage] Error: ", error)
    }
  }

  async handlePush(data, slackWebhookPath) {
    data = data.payload
    let details = {
      projectName: data["project"]["name"],
      url: data["repository"]["homepage"],
      commitDetails: {
        commitId: data["commits"][0]["id"],
        commitUrl: data["commits"][0]["url"],
        _commitMessage: data["commits"][0]["message"].replace(/\n/g, ""),
        commitTimeStamp: data["commits"][0]["timestamp"],
        commitAuthor: data["commits"][0]["author"]["name"],
      }
    }
    await this._message(slackWebhookPath, this._commitMessage(details))
  }

  async handlePipeline(pipelineData, slackWebhookPath) {
    let data = pipelineData.payload
    let details = {
      projectName: data["project"]["name"],
      url: data["project"]["web_url"],
      ref: data["object_attributes"]["ref"],
      commitDetails: {
        commitId: data["commit"]["id"],
        commitUrl: data["commit"]["url"],
        _commitMessage: data["commit"]["message"].replace(/\n/g, " "),
        commitTimeStamp: data["commit"]["timestamp"],
        commitAuthor: data["commit"]["author"]["name"],
      },
      stages: data["object_attributes"]["stages"],
    }
    let builds = {}
    for (let index = 0;index < details.stages.length;index++) {
      const element = details.stages[index];
      builds[element] = []
    }

    for (let index = 0;index < data["builds"].length;index++) {
      const build = data["builds"][index];
      if (details["stages"].includes(build.stage)) {
        let buildItem = {
          name: data["builds"][index]["name"],
          status: data["builds"][index]["status"],
          when: data["builds"][index]["when"],
          allow_failure: data["builds"][index]["allow_failure"],
          artifacts_file: data["builds"][index]["artifacts_file"]["filename"],
          finished_at: (data["builds"][index]["status"] === 'pending') ? data["builds"][index]["created_at"] : data["builds"][index]["finished_at"]
        }
        builds[data["builds"][index]["stage"]].push(buildItem)
      }
    }
    details["builds"] = builds

    let message = this._pipelineMessage(details)
    await this._message(slackWebhookPath, message)
  }

}

exports.SlackMessage = new SlackMessage()