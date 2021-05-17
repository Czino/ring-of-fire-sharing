import drawChannels, { drawChannelFlow } from '../../graph/drawChannels.js'

let initialised = false
let peers = []
let history = []
let channels = []

const selectOption = (state, event) => ({
  ...state,
  showRouting: event.target.value
})

export const MyNode = ({ state }) => {
  setTimeout(async () => {
    peers = await fetch(state.baseUrl + '/listChannels')
    peers = await peers.json()
    channels = peers.channels

    peers = await Promise.all(channels.map(channel => fetch(`${state.baseUrl}/getNodeInfo?nodeId=${channel.remote_pubkey}`)))
    peers = await Promise.all(peers.map(peer => peer.json()))

    channels = channels.map(channel => {
      let peer = peers.find(peer => peer.node.pub_key === channel.remote_pubkey)
      channel.peer = peer
      return channel
    })
    drawChannels(channels, state.myNode)

    if (state.showRouting) {
      history = await fetch(state.baseUrl + '/fwdinghistory', {
        'method': 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startTime: Math.round((new Date()).getTime() / 1000 - state.showRouting),
          endTime: Math.round((new Date()).getTime() / 1000)
        })
      })
      history = await history.json()

      let channelFlow = {}
      history.forwarding_events.forEach(event => {
        if (!channelFlow[event.chan_id_in]) channelFlow[event.chan_id_in] = {
          in: 0,
          out: 0
        }
        if (!channelFlow[event.chan_id_out]) channelFlow[event.chan_id_out] = {
          in: 0,
          out: 0
        }

        channelFlow[event.chan_id_in].in += parseInt(event.amt_in_msat)
        channelFlow[event.chan_id_out].out +=  parseInt(event.amt_out_msat)
      })

      drawChannelFlow(channelFlow)
    }
  })

  if (!initialised) {
    window.addEventListener('resize', () => drawChannels(channels, state.myNode))
  }
  initialised = true

  return <div>
    <h2 class="text-xl text-center">My node</h2>
    <select class="p-2 border border-yellow-400" value={state.showRouting} oninput={selectOption}>
      <option>Show routing...</option>
      <option value={24 * 60 * 60}>1 day</option>
      <option value={7 * 24 * 60 * 60}>1 week</option>
      <option value={30 * 24 * 60 * 60}>1 month</option>
      <option value={3 * 30 * 24 * 60 * 60}>3 months</option>
    </select>
    <div class="relative w-full">
      <img class="w-full" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" />
      <canvas id="graph" class="absolute w-full h-full left-0 top-0"></canvas>
      <canvas id="channelFlow" class="absolute w-full h-full left-0 top-0 pointer-events-none"></canvas>
      <div id="extraInfo" class="absolute top-1/2 left-1/2 w-full lg:w-1/2 p-4 transform -translate-x-1/2 text-center bg-yellow-50 leading-8 hidden border border-yellow-400 overflow-hidden pointer-events-none"></div>
      <input type="text" id="copy-text" class="absolute opacity-0 pointer-events-none" />
    </div>
  </div>
}