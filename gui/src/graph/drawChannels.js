import Graph from './graph.js'
import { addClass, removeClass } from '../htmlUtils'
import { toCurrency } from '../stringUtils'

let graph

export const drawChannels = (channels, myNode) => {
  const $graph = document.getElementById('graph')
  const context = $graph.getContext('2d')
  const $extraInfo = document.getElementById('extraInfo')
  const copyText = document.getElementById('copy-text')

  $graph.width = $graph.clientWidth
  $graph.height = $graph.clientHeight
  context.clearRect(0, 0, $graph.width, $graph.height)

  graph = new Graph('graph')
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

      let edge1 = nodes[channel.chan_id].connect(middle, '', null, 5)
      edge1.custom = {
        chan_id: channel.chan_id,
        capacity
      }
      let edge2 = middle.connect(nodes[myNode.identity_pubkey], '', null, 5)
      edge2.custom = {
        chan_id: channel.chan_id,
        capacity,
        drawFlow: true
      }
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
              <p>Capacity: ${toCurrency(parseInt(channel.capacity) - parseInt(channel.commit_fee), 'BTC')}</p>
              <p>Local: ${toCurrency(channel.local_balance, 'BTC')}</p>
              <p>Remote: ${toCurrency(channel.remote_balance, 'BTC')}</p>
              `
            if (line.custom?.in || line.custom?.out) {
              $extraInfo.innerHTML += `<h3 class="text-l mt-4">Forwarding of last 7 days</h3>`
            }
            if (line.custom?.in) $extraInfo.innerHTML += `<p>Incoming: ${toCurrency(line.custom.in, 'BTC')}</p>`
            if (line.custom?.out) $extraInfo.innerHTML += `<p>Outgoing: ${toCurrency(line.custom.out, 'BTC')}</p>`

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
  return graph
}

const arrowSize = 10
export const drawChannelFlow = channelFlow => {
  const $graph = document.getElementById('channelFlow')
  const context = $graph.getContext('2d')

  $graph.width = $graph.clientWidth
  $graph.height = $graph.clientHeight
  context.clearRect(0, 0, $graph.width, $graph.height)

  let edges = Object.keys(graph.edges)
    .map(key => graph.edges[key])
    .filter(edge => edge.custom)

  edges
    .filter(edge => channelFlow[edge.custom.chan_id])
    .forEach(edge => {
      let start = {
        x: edge.xstart,
        y: edge.ystart
      }
      let end = {
        x: edge.xend,
        y: edge.yend
      }
      let angle = getAngle(start, end) * Math.PI / 180
      let outStrength = Math.abs(channelFlow[edge.custom.chan_id].out / (edge.custom.capacity * 1000)) * 4
      let inStrength = Math.abs(channelFlow[edge.custom.chan_id].in / (edge.custom.capacity * 1000)) * 4

      edge.custom.out = channelFlow[edge.custom.chan_id].out / 1000
      edge.custom.in = channelFlow[edge.custom.chan_id].in / 1000

      if (!edge.custom.drawFlow) return
      drawFlow(start, angle, outStrength, -1)
      drawFlow(start, angle, inStrength, 1)

      function drawFlow(center, angle, strength, direction) {
        context.strokeStyle = direction === 1 ? '#2121AA' : '#FFAA21'
        context.lineWidth = 3
        context.globalAlpha = .4
        context.save()
        context.translate(center.x, center.y)
        context.rotate(angle)
        context.beginPath()
        for (let i = strength + 1; i > 1; i--) {
          let offset = i * 6 * direction
          context.moveTo(-arrowSize * direction - offset, arrowSize)
          context.lineTo(0 - offset, 0)
          context.lineTo(-arrowSize * direction - offset, -arrowSize)
        }
        context.stroke()
        context.restore()
      }
    })

}

function getAngle(start, end) {
  let dy = end.y - start.y
  let dx = end.x - start.x
  let theta = Math.atan2(dy, dx)
  theta *= 180 / Math.PI
  return theta
}

function getPointInLine(start, end, rel) {
  return {
    x: start.x + rel * (end.x - start.x),
    y: start.y + rel * (end.y - start.y)
  }
}

export default drawChannels