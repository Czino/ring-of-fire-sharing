var request = require('request-promise')
const fs = require('fs')
const path = require('path')
const express = require('express')
const http = require('http')
const config = require('./config.js')
const cache = {}

const getCache = (type, id, ttl, callback) => {
  if (!cache[type]) cache[type] = {}

  if (!cache[type][id] || (new Date()).getTime() - cache[type][id].date.getTime() > ttl) {
    cache[type][id] = {
      date: new Date(),
      data: callback()
    }
  }
  return cache[type][id].data
}
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
  buildRoute = async ({ hops, channelId, amt}) => {
    let url = `${this.url}/v2/router/route`
      let requestBody = { 
        amt_msat: String((parseInt(amt) || 1) * 1000),
        outgoing_chan_id: channelId,
        hop_pubkeys: hops.map(hop => Buffer.from(hop, 'hex').toString('base64')),
    }
    const data = await request({
      url,
      headers: {
        'Grpc-Metadata-macaroon': this.macaroon,
        'Content-Type': 'application/json'
      },
      rejectUnauthorized: false,
      json: true,
      method: 'POST',
      form: JSON.stringify(requestBody),
    })
    return JSON.stringify(data);
  }
  addInvoice = async ({ amt, memo, expiry }) => {
    let url = `${this.url}/v1/invoices`
      let requestBody = {
        value: amt,
        memo,
        expiry: expiry || 3600
    }
    const data = await request({
      url,
      headers: {
        'Grpc-Metadata-macaroon': this.macaroon,
        'Content-Type': 'application/json'
      },
      rejectUnauthorized: false,
      json: true,
      method: 'POST',
      form: JSON.stringify(requestBody),
    })
    return JSON.stringify(data);
  }
  sendToRoute = async ({ route, paymentHash}) => {
    let url = `${this.url}/v2/router/route/send`
      let requestBody = { 
        route,
        paymentHash
    }
    const data = await request({
      url,
      headers: {
        'Grpc-Metadata-macaroon': this.macaroon,
        'Content-Type': 'application/json'
      },
      rejectUnauthorized: false,
      json: true,
      method: 'POST',
      form: JSON.stringify(requestBody),
    })
    return JSON.stringify(data);
  }
}

const getRingConfig = ring => fs.readFileSync(path.join(__dirname, `../rings/${ring}.json`), { encoding: 'utf8'})

const lnd = new LND({
  macaroon: config.lnd.macaroon,
  url: config.lnd.url
})

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }));

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

app.get('/getRings', async (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  let rings = fs.readdirSync('../rings')
    .filter(file => /json/.test(file))
    .map(file => file.replace('.json', ''))
  res.send(rings)
})

app.post('/addRing', async (req, res) => {
  const name = req.body.name
  const ring = name.replace(/[^a-zA-Z0-9]/g, '')
  const hops = req.body.hops
  const json = {
    name,
    hops
  }
  fs.writeFile(path.join(__dirname, `../rings/${ring}.json`), JSON.stringify(json), (err, data) => {
    res.setHeader('Content-Type', 'application/json')
    json.id = ring
    res.send(json)
  })
})

app.get('/getRingConfig', async (req, res) => {
  const ring = req.query.ring
  fs.readFile(path.join(__dirname, `../rings/${ring}.json`), { encoding: 'utf8'}, (err, data) => {
    data.id = ring
    res.setHeader('Content-Type', 'application/json')
    res.send(data)
  })
})

app.get('/getInfo', async (req, res) => {
  const info = await getCache('info', 'own', 30 * 60 * 1000, async () => {
    return await lnd.getInfo()
  })

  res.setHeader('Content-Type', 'application/json')
  res.send(info)
})


app.get('/getNodeInfo', async (req, res) => {
  const nodeId = req.query.nodeId
  const nodeInfo = await getCache('nodeInfo', nodeId, 30 * 60 * 1000, async () => {
    const info = await lnd.getNodeInfo(nodeId)
    return info
  })
  res.setHeader('Content-Type', 'application/json')
  res.send(nodeInfo)
})

app.get('/listChannels', async (req, res) => {
  const peer = req.query.peer
  res.setHeader('Content-Type', 'application/json')
  try {
    const channels = await getCache('listChannels', peer || 'all', 10 * 60 * 1000, async () => {
      return await lnd.listChannels(peer)
    })
    res.send(channels)
  } catch (e) {
    res.send(e.error)
  }
})

app.post('/buildRoute', async (req, res) => {
  const hops = req.body.hops
  const amt = req.body.amt || 10

  res.setHeader('Content-Type', 'application/json')
  try {
    const route = await getCache('buildRoute', JSON.stringify(hops) + amt, 1 * 60 * 1000, async () => {
      return await lnd.buildRoute({
        hops,
        amt
      })
    })
    res.send(route)
  } catch (e) {
    res.send(e)
  }
})

app.post('/addInvoice', async (req, res) => {
  const amt = req.body.amt
  const memo = req.body.memo

  res.setHeader('Content-Type', 'application/json')
  try {
    const invoice = await lnd.addInvoice({
      amt,
      memo
    })
    res.send(invoice)
  } catch (e) {
    res.send(e)
  }
})

app.post('/sendToRoute', async (req, res) => {
  const route = req.body.route
  const paymentHash = req.body.paymentHash

  res.setHeader('Content-Type', 'application/json')
  try {
    const status = await lnd.sendToRoute({
      route,
      paymentHash
    })
    res.send(status)
  } catch (e) {
    res.send(e)
  }
})

http.createServer(app).listen(process.env.PORT || 80)
console.info('Created http server with port', process.env.PORT || 80)