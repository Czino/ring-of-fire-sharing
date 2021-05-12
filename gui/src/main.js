import drawChannels from './graph/drawChannels.js'

let myNode = {}
let config = {}
let peers = []
let channels = []
let all = true

;(async () => {
  myNode = await fetch('./getInfo')
  myNode = await myNode.json()
  config = await fetch('./getConfig')
  config = await config.json()
  if (all) {
    peers = await fetch('./listChannels')
    peers = await peers.json()
    channels = peers.channels
  } else {
    peers = await Promise.all(config.peers.map(peer => fetch(`./listChannels?peer=${peer}`)))
    peers = await Promise.all(peers.map(peer => peer.json()))

    channels = peers
    .map(peer => peer.channels)
    .reduce((arr, channels) => {
      return arr.concat(channels)
    }, [])
  }

  peers = await Promise.all(channels.map(channel => fetch(`./getNodeInfo?nodeId=${channel.remote_pubkey}`)))
  peers = await Promise.all(peers.map(peer => peer.json()))

  channels = channels.map(channel => {
    let peer = peers.find(peer => peer.node.pub_key === channel.remote_pubkey)
    channel.peer = peer
    return channel
  })

  drawChannels(channels, myNode)

  window.addEventListener('resize', () => drawChannels(channels, myNode))
})()
