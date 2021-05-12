import Graph from './graph.js'
import { addClass, removeClass } from '../htmlUtils'

export const drawRing = (peers, myNode) => {
  const $graph = document.getElementById('ringGraph')
  const context = $graph.getContext('2d')
  const $extraInfo = document.getElementById('extraInfo')
  const copyText = document.getElementById('copy-text')

  $graph.width = $graph.clientWidth
  $graph.height = $graph.clientHeight
  context.clearRect(0, 0, $graph.width, $graph.height);

  let graph = new Graph('ringGraph')
  graph.editable = false
  let radius = Math.min($graph.clientWidth, $graph.clientHeight) / 3
  let nodeSize = radius / 10

  const nodes = {}

  peers
    .map((peer, index, allPeers) => {
      const x =  Math.sin(index / allPeers.length * Math.PI * 2) * radius + $graph.clientWidth / 2
      const y = Math.cos(index / allPeers.length * Math.PI * 2) * radius + $graph.clientHeight / 2
      const size = peer.node.pub_key === myNode ? nodeSize * 2 : nodeSize
      peer.active = true
      nodes[peer.node.pub_key] = graph.node(x, y, size, peer.node.alias, 3)
      nodes[peer.node.pub_key].custom = peer
      nodes[peer.node.pub_key].color = peer.active ? peer.node.color : '#ff9800'
      nodes[peer.node.pub_key].opacity = peer.active ? 1 : .5

      nodes[peer.node.pub_key].onMouseEnter = peer => {
        if (peer.isActive) return

        removeClass($extraInfo, 'hidden')
        $extraInfo.innerHTML = `
          <h1 class="text-xl">${peer.custom.node.alias}</h1>
          <p id="pub_key" class="w-full overflow-ellipsis overflow-hidden">${peer.custom.node.pub_key}</p>
        `
        peer.isActive = true
      }
      nodes[peer.node.pub_key].onClick = peer => {
        const pubKey = document.getElementById('pub_key')
        copyText.value = peer.custom.node.pub_key
        copyText.select()
        document.execCommand('copy', false)
        pubKey.innerText = 'Copied'
        addClass(pubKey, 'text-green-600')
        setTimeout(() => {
          removeClass(pubKey, 'text-green-600')
          pubKey.innerText = peer.custom.node.pub_key
        }, 1000)
      }
      nodes[peer.node.pub_key].onMouseLeave = peer => {
        $extraInfo.innerHTML = ''
        peer.isActive = false
        addClass($extraInfo, 'hidden')
      }

      return peer
    })
    .map((peer, index, allPeers) => {
      const nextPeer = index + 1 < allPeers.length ? allPeers[index + 1] : allPeers[0]
      const capacity = 100 || parseInt(peer.local_balance) + parseInt(peer.remote_balance)
      // TODO get actual balances
      const localScore = 50 || Math.round(parseInt(peer.local_balance) / capacity * 100)
      const remoteScore = 50 || Math.round(parseInt(peer.remote_balance) / capacity * 100)
      const rel = Math.min(.80, Math.max(.20, localScore / 100))
      const { x, y } = getPointInLine(nodes[nextPeer.node.pub_key], nodes[peer.node.pub_key], rel)

      let middle = graph.node(x, y, 1, '', 5)
      middle.custom = { pub_key: peer.node.pub_key}
      middle.color = 'black'

      nodes[peer.node.pub_key].connect(middle, '', null, 5)
      middle.connect(nodes[nextPeer.node.pub_key], '', null, 5)

      Object.keys(middle.edges)
        .map(edge => graph.edges[edge])
        .forEach((connection, i) => {
          connection.color = i === 0 ? nodes[peer.node.pub_key].color : nodes[nextPeer.node.pub_key].color
          connection.opacity = i === 0 ? nodes[peer.node.pub_key].opacity : nodes[nextPeer.node.pub_key].opacity
          connection.setWeight(i === 0 ? localScore : remoteScore)
          connection.onMouseEnter = line => {
            if (line.isActive) return
            $extraInfo.innerHTML = `
              <h1 class="text-xl">Balance</h1>
              <p>Local: ${peer.local_balance} sats</p>
              <p>Remote: ${peer.remote_balance} sats</p>
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
      return peer
    })
  graph.update()
}

function getPointInLine(start, end, rel) {
  return {
    x: start.x + rel * (end.x - start.x),
    y: start.y + rel * (end.y - start.y)
  }
}

export default drawRing