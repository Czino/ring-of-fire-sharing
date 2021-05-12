var request = require('request-promise')
const fs = require('fs')
const path = require('path')
const express = require('express')
const http = require('http')
const config = require('./config.js')

class LND {
  constructor(options) {
    this.macaroon = fs.readFileSync(path.join(__dirname, options.macaroon)).toString('hex')
    this.url = options.url
  }
  getInfo = async () => {
    const data = await request({
      url: `${this.url}/v1/getinfo`,
      headers: {
        'Grpc-Metadata-macaroon': this.macaroon,
        'Content-Type': 'application/json'
      },
      rejectUnauthorized: false,
      json: true,
      method: 'GET'
    })
    return JSON.stringify(data);
  }
  getNodeInfo = async nodeId => {
    const data = await request({
      url: `${this.url}/v1/graph/node/${nodeId}`,
      headers: {
        'Grpc-Metadata-macaroon': this.macaroon,
        'Content-Type': 'application/json'
      },
      rejectUnauthorized: false,
      json: true,
      method: 'GET'
    })
    return JSON.stringify(data);
  }
  listChannels = async peer => {
    let url = `${this.url}/v1/channels`
    if (peer) {
      peer = Buffer.from(peer, 'hex').toString('base64')
      url += `?peer=${encodeURIComponent(peer)}`
    }
    const data = await request({
      url,
      headers: {
        'Grpc-Metadata-macaroon': this.macaroon,
        'Content-Type': 'application/json'
      },
      rejectUnauthorized: false,
      json: true,
      method: 'GET'
    })
    return JSON.stringify(data);
  }
}

const lnd = new LND({
  macaroon: config.lnd.macaroon,
  url: config.lnd.url
})

const app = express()

app.use(express.json())

app.use(express.static(
  __dirname,
  { dotfiles: 'allow' }
))

app.use(express.static(
  path.join(__dirname, './dist/')
))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './dist/index.html'))
})

let ringConfig = {}
app.get('/getConfig', async (req, res) => {
  fs.readFile(path.join(__dirname, `../rings/${config.ring}.json`), { encoding: 'utf8'}, (err, data) => {
    ringConfig = data
    res.setHeader('Content-Type', 'application/json')
    res.send(ringConfig)
  })
})

app.get('/getInfo', async (req, res) => {
  const info = await lnd.getInfo()
  res.setHeader('Content-Type', 'application/json')
  res.send(info)
})
app.get('/getNodeInfo', async (req, res) => {
  const nodeId = req.query.nodeId
  const info = await lnd.getNodeInfo(nodeId)
  res.setHeader('Content-Type', 'application/json')
  res.send(info)
})

app.get('/listChannels', async (req, res) => {
  const peer = req.query.peer
  res.setHeader('Content-Type', 'application/json')
  try {
    const channel = await lnd.listChannels(peer)
    res.send(channel)
  } catch (e) {
    res.send(e.error)
  }
})

http.createServer(app).listen(process.env.PORT || 80)
console.info('Created http server with port', process.env.PORT || 80)