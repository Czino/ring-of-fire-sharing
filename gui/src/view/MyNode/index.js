import drawChannels from '../../graph/drawChannels.js'

let initialised = false
let peers = []
let channels = []

export const MyNode = ({ state }) => {
  setTimeout(async () => {
    if (true) {
      peers = await fetch(state.baseUrl + '/listChannels')
      peers = await peers.json()
      channels = peers.channels
    }

    peers = await Promise.all(channels.map(channel => fetch(`./getNodeInfo?nodeId=${channel.remote_pubkey}`)))
    peers = await Promise.all(peers.map(peer => peer.json()))

    channels = channels.map(channel => {
      let peer = peers.find(peer => peer.node.pub_key === channel.remote_pubkey)
      channel.peer = peer
      return channel
    })
    drawChannels(channels, state.myNode)
  })

  if (!initialised) {
    window.addEventListener('resize', () => drawChannels(channels, state.myNode))
  }
  initialised = true

  return <div class="relative w-full">
    <img class="w-full" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" />
    <canvas id="graph" class="absolute w-full h-full left-0 top-0"></canvas>
    <div id="extraInfo" class="absolute top-1/2 left-1/2 w-full lg:w-1/2 p-4 transform -translate-x-1/2 text-center bg-yellow-50 leading-8 hidden border border-yellow-400 overflow-hidden pointer-events-none"></div>
    <input type="text" id="copy-text" class="absolute opacity-0 pointer-events-none" />
  </div>
}