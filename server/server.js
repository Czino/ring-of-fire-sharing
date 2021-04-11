const fs = require('fs')
const path = require('path')
const express = require('express')
const http = require('http')
const https = require('https')
const config = require('./config.json')
const auth = require('basic-auth')
const bcrypt = require('bcrypt')

const sslExists = fs.existsSync(config.cert)
const app = express()

const ringStats = {}

if (sslExists) {
  app.all('*', (req, res, next) => {
    if (req.secure) return next()
    console.log('redirect')
    res.redirect(302, 'https://' + req.hostname + req.url)
  })
}

app.use((req, res, next) => {
  let user = auth(req)

  if (req.path.indexOf('.well-known') >= 0) {
    return next()
  }
  if (user === undefined || user.name !== config.auth.user || !bcrypt.compareSync(user.pass, config.auth.secret)) {
    res.statusCode = 401
    res.setHeader('WWW-Authenticate', 'Basic realm="Node"')
    res.end('Unauthorized')
  } else {
    next()
  }
})


app.use(express.json())

app.use(express.static(
  __dirname,
  { dotfiles: 'allow' }
))

app.use(express.static(
  path.join(__dirname, './dist/')
))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './dist/index.html'));
})

app.get('/getStatus', (req, res) => {
  res.send(ringStats)
})

app.post('/updateStatus', (req, res) => {
  ringStats[req.body.nodeId] = req.body
  res.send('OK')
})

http.createServer(app).listen(process.env.PORT || 80)
console.info('Created http server with port', process.env.PORT || 80)

if (sslExists) {
  console.info('SSL Certificate exists, start HTTPS server')
  const options = {
    key: fs.readFileSync(config.key, 'utf8'),
    cert: fs.readFileSync(config.cert, 'utf8'),
    ca: fs.readFileSync(config.chain, 'utf8')
  }
  https.createServer(options, app).listen(process.env.SSLPORT || 443)
  console.info('Created https server with port', process.env.SSLPORT || 443)
} else {
  console.info('SSL Certificate does not exist')
}