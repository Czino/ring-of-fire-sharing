import Graph from './graph.js'
import { addClass, removeClass } from '../htmlUtils'

export const drawChannels = (channels, myNode) => {
  const $graph = document.getElementById('graph')
  const context = $graph.getContext('2d')
  const $extraInfo = document.getElementById('extraInfo')
  const copyText = document.getElementById('copy-text')

  $graph.width = $graph.clientWidth
  $graph.height = $graph.clientHeight
  context.clearRect(0, 0, $graph.width, $graph.height);

  let graph = new Graph('graph')
  graph.editable = false
  let radius = Math.min($graph.clientWidth, $graph.clientHeight) / 3
  let nodeSize = radius / 10

  const nodes = {}
  const x = $graph.clientWidth / 2
  const y = $graph.clientHeight / 2
  nodes[myNode.identity_pubkey] = graph.node(x, y, nodeSize * 2, myNode.alias, 3)
  nodes[myNode.identity_pubkey].color = myNode.color
  nodes[myNode.identity_pubkey].opacity = 1
  nodes[myNode.identity_pubkey].custom = myNode

  channels
    .map((channel, index, allChannels) => {
      const x =  Math.sin(index / allChannels.length * Math.PI * 2) * radius + $graph.clientWidth / 2
      const y = Math.cos(index / allChannels.length * Math.PI * 2) * radius + $graph.clientHeight / 2
      nodes[channel.chan_id] = graph.node(x, y, nodeSize, channel.peer.node.alias, 3)
      nodes[channel.chan_id].custom = channel
      nodes[channel.chan_id].color = channel.active ? channel.peer.node.color : '#ff9800'
      nodes[channel.chan_id].opacity = channel.active ? 1 : .5

      nodes[channel.chan_id].onMouseEnter = channel => {
        if (channel.isActive) return

        removeClass($extraInfo, 'hidden')
        $extraInfo.innerHTML = `
          <h1 class="text-xl">${channel.custom.peer.node.alias}</h1>
          <p id="pub_key" class="w-full overflow-ellipsis overflow-hidden">${channel.custom.peer.node.pub_key}</p>
        `
        channel.isActive = true
      }
      nodes[channel.chan_id].onClick = channel => {
        const pubKey = document.getElementById('pub_key')
        copyText.value = channel.custom.peer.node.pub_key
        copyText.select()
        document.execCommand('copy', false)
        pubKey.innerText = 'Copied'
        addClass(pubKey, 'text-green-600')
        setTimeout(() => {
          removeClass(pubKey, 'text-green-600')
          pubKey.innerText = channel.custom.peer.node.pub_key
        }, 1000)
      }
      nodes[channel.chan_id].onMouseLeave = channel => {
        $extraInfo.innerHTML = ''
        channel.isActive = false
        addClass($extraInfo, 'hidden')
      }

      return channel
    })
    .map(channel => {
      const capacity = parseInt(channel.local_balance) + parseInt(channel.remote_balance)
      const localScore = Math.round(parseInt(channel.local_balance) / capacity * 100)
      const remoteScore = Math.round(parseInt(channel.remote_balance) / capacity * 100)
      const rel = Math.min(.80, Math.max(.20, localScore / 100))
      const { x, y } = getPointInLine(nodes[myNode.identity_pubkey], nodes[channel.chan_id], rel)

      let middle = graph.node(x, y, 1, '', 5)
      middle.custom = { chan_id: channel.chan_id}
      middle.color = 'black'

      nodes[channel.chan_id].connect(middle, '', null, 5)
      middle.connect(nodes[myNode.identity_pubkey], '', null, 5)
      Object.keys(middle.edges)
        .map(edge => graph.edges[edge])
        .forEach((connection, i) => {
          connection.color = i === 0 ? nodes[channel.chan_id].color : nodes[myNode.identity_pubkey].color
          connection.opacity = i === 0 ? nodes[channel.chan_id].opacity : nodes[myNode.identity_pubkey].opacity
          connection.setWeight(i === 0 ? localScore : remoteScore)
          connection.onMouseEnter = line => {
            if (line.isActive) return
            $extraInfo.innerHTML = `
              <h1 class="text-xl">Balance</h1>
              <p>Local: ${channel.local_balance} sats</p>
              <p>Remote: ${channel.remote_balance} sats</p>
            `
            line.isActive = true
            removeClass($extraInfo, 'hidden')
          }
          connection.onMouseLeave = line => {
            $extraInfo.innerHTML = ''
            line.isActive = false
            addClass($extraInfo, 'hidden')
          }
        })
      return channel
    })
  graph.update()
}

function getPointInLine(start, end, rel) {
  return {
    x: start.x + rel * (end.x - start.x),
    y: start.y + rel * (end.y - start.y)
  }
}

export default drawChannels