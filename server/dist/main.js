const $ring = document.getElementById('ring')
const graph = new Graph('ring')
const $extraInfo = document.getElementById('extraInfo')
let radius = Math.min($ring.clientWidth, $ring.clientHeight) / 3
let nodeSize = radius / 10
graph.canvas.width = $ring.clientWidth
graph.canvas.height = $ring.clientHeight
graph.editable = false
const nodes = {}
const channelIds = []

fetch('./getStatus')
  .then(res => res.json())
  .then(drawGraph)

function drawGraph(json) {
  const allNodes = Object.keys(json)
    .map(key => json[key])
    .map(node => {
      node.ringPeers = node.ringPeers.filter(peer => peer && peer.nodeId)
      return node
    })
    .filter(node => node)
    .sort((a, b) => a.nodeId > b.nodeId ? 1 : -1) // sort alphabetically

  sortedNodes = allNodes[0].peers.map(address => allNodes.find(node => node.nodeId === address.split('@').shift()))
  sortedNodes
    .filter(node => node)
    .map((node, index, allNodes) => {
      const x =  Math.sin(index / allNodes.length * Math.PI * 2) * radius + $ring.clientWidth / 2
      const y = Math.cos(index / allNodes.length * Math.PI * 2) * radius + $ring.clientHeight / 2
      nodes[node.nodeId] = graph.node(x, y, nodeSize, node.alias, 3)
      nodes[node.nodeId].color = node.color
      nodes[node.nodeId].custom = node

      nodes[node.nodeId].onMouseEnter = node => {
        if (node.isActive) return
        $extraInfo.innerHTML = `
          <h1 class="text-xl">Fee Report</h1>
          <p>Day: ${node.custom.feeReport.day_fee_sum}sats</p>
          <p>Week: ${node.custom.feeReport.week_fee_sum}sats</p>
          <p>Month: ${node.custom.feeReport.month_fee_sum}sats</p>
          `
        node.isActive = true
      }
      nodes[node.nodeId].onMouseLeave = node => {
        $extraInfo.innerHTML = ''
        node.isActive = false
      }
      return node
    })
    .map((node, index, allNodes) => {
      let x =  Math.sin(index / allNodes.length * Math.PI * 2) * radius + $ring.clientWidth / 2
      let y = Math.cos(index / allNodes.length * Math.PI * 2) * radius + $ring.clientHeight / 2
      nodes[node.nodeId].x = x
      nodes[node.nodeId].y = y

      node.ringPeers
        .filter(peer => nodes[peer.nodeId])
        .forEach(peer => {
          const alreadyConnected = nodes[node.nodeId].children.some(child => nodes[peer.nodeId].children.indexOf(child) >= 0)
          if (alreadyConnected) return
          if (channelIds.indexOf(peer.chan_id) >= 0) return
          channelIds.push(peer.chan_id)
          const capacity = parseInt(peer.local_balance) + parseInt(peer.remote_balance)
          const localScore = Math.round(parseInt(peer.local_balance) / capacity * 100)
          const remoteScore = Math.round(parseInt(peer.remote_balance) / capacity * 100)
          const rel = Math.min(.88, Math.max(.12, localScore / 100))
          let { x, y } = getPointInLine(nodes[node.nodeId], nodes[peer.nodeId], rel)

          let middle = graph.node(x, y, 1, '', 5)
          middle.custom = { chan_id: peer.chan_id}

          nodes[node.nodeId].connect(middle, '', null, 5)
          middle.connect(nodes[peer.nodeId], '', null, 5)
          Object.keys(middle.edges)
            .map(edge => graph.edges[edge])
            .forEach((connection, i) => {
              connection.color = i === 0 ? node.color : nodes[peer.nodeId].color
              connection.setWeight(i === 0 ? localScore : remoteScore)
              connection.onMouseEnter = line => {
                if (line.isActive) return
                $extraInfo.innerHTML = `
                  <h1 class="text-xl">Balance</h1>
                  <p>${node.alias}: ${peer.local_balance}sats</p>
                  <p>${json[peer.nodeId].alias}: ${peer.remote_balance}sats</p>
                `
                line.isActive = true
              }
              connection.onMouseLeave = line => {
                $extraInfo.innerHTML = ''
                line.isActive = false
              }
            })
        })
      return node
    })
  graph.update()
}

function getPointInLine(start, end, rel) {
  return {
    x: start.x + rel * (end.x - start.x),
    y: start.y + rel * (end.y - start.y)
  }
}
