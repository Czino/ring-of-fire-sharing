import { Http } from '../../effects/http'
import { selectAll } from '../../actions/selectAll'
import drawRing from '../../graph/drawRing.js'

let initialised = false
let peers = []
let ringConfig = {}
let brokenNode = null

const deleteRing = (state, ring) => {
  return [
    {
      ...state,
      deleteRing: true
    },
    Http({
      url: state.baseUrl + '/deleteRing',
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ring
        })
      },
      action(state, response) {
        state.rings = state.rings.filter(ring => ring !== response.id)

        return {
          ...state,
          deleteRing: false,
          view: 'dashboard'
        }
      },
      error(state, error) {
        return {
          ...state,
          deleteRing: false,
          error
        }
      }
    })
  ]
}
const buildRoute = (state, direction, amt) => {
  let hops = ringConfig.hops.filter(hop => hop.pubkey !== state.myNode.identity_pubkey)
  hops = direction === 'clockwise' ? JSON.parse(JSON.stringify(hops)).reverse() : hops
  hops = hops.map(hop => hop.pubkey)
  hops.push(state.myNode.identity_pubkey)
  return [
    {
      ...state,
      route: null,
      direction,
      error: null,
      invoice: null,
      paymentStatus: null,
      buildRoute: true
    },
    Http({
      url: state.baseUrl + '/buildRoute',
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amt,
          hops
        })
      },
      action(state, response) {
        return {
          ...state,
          buildRoute: false,
          route: response.route,
          error: response.error
        }
      },
      error(state, response) {
        return {
          ...state,
          buildRoute: false,
          error: response.error
        }
      }
    })
]
}

const setAmount = (state, event) => ({
  ...state,
  route: null,
  error: null,
  createInvoice: {
    ...state.createInvoice,
    amt: event.target.value
  }
})

const refresh = state => ({ ...state })

const addInvoice = (state, amt, memo, expiry) => {
  return [
    {
      ...state,
      invoice: null,
      paymentStatus: null,
      addInvoice: true
    },
    Http({
      url: state.baseUrl + '/addInvoice',
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amt,
          memo,
          expiry
        })
      },
      action(state, response) {
        return {
          ...state,
          addInvoice: false,
          invoice: response,
          error: response.error
        }
      },
      error(state, error) {
        return {
          ...state,
          addInvoice: false,
          error
        }
      }
    })
]
}

const sendToRoute = state => {
  return [
    {
      ...state,
      paymentStatus: null,
      sendToRoute: true
    },
    Http({
      url: state.baseUrl + '/sendToRoute',
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: state.route,
          paymentAddr: state.invoice.payment_addr,
          paymentHash: state.invoice.r_hash
        })
      },
      action(state, response) {
        if (response.status === 'SUCCEEDED') {
          return {
            ...state,
            sendToRoute: false,
            route: null,
            invoice: null,
            paymentStatus: response
          }
        }
        return {
        ...state,
          sendToRoute: false,
          paymentStatus: response,
          error: response.error
        }
      },
      error(state, error) {
        return {
          ...state,
          sendToRoute: false,
          error
        }
      }
    })
  ]
}
const toggleMembers = state => {
  ringConfig.showMembers = !ringConfig.showMembers
  return { ...state }
}

const editLabel = (state, event, i) => {
  ringConfig.hops[i].label = event.target.value

  peers = peers.map(peer => {
    let hop = ringConfig.hops.find(hop => peer.node.pub_key === hop.pubkey)
    return {
      ...peer,
      node: {
        ...peer.node,
        alias: hop.label || peer.node.alias
      }
    }
  })

  if (ringConfig.hops[i].pubkey === state.myNode.identity_pubkey) return { ...state }

  return [
    {
      ...state,
      editRing: true
    },
    Http({
      url: state.baseUrl + '/editRing',
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ringConfig: {
            ...ringConfig,
            hops: ringConfig.hops.filter(hop => hop.pubkey !== state.myNode.identity_pubkey)
          }
        })
      },
      action(state, response) {
        return {
          ...state,
          editRing: false
        }
      },
      error(state, error) {
        return {
          ...state,
          editRing: false,
          error
        }
      }
    })
  ]
}
const getPeerByPubKey = pubkey => peers.find(peer => peer.node.pub_key === pubkey)

export const Ring = ({ state }) => {
  setTimeout(async () => {
    // TODO check if we can init asynchronously
    let now = new Date()
    if (!state.ringCache || now.getTime() - state.ringCache.getTime() > 60 * 1000) {
      state.ringCache = now
      ringConfig = await fetch(`${state.baseUrl}/getRingConfig?ring=${state.ring}`)
      ringConfig = await ringConfig.json()
      peers = await Promise.all(ringConfig.hops.map(peer => fetch(`${state.baseUrl}/listChannels?peer=${peer.pubkey}`)))
      peers = await Promise.all(peers.map(peer => peer.json()))

      if (!ringConfig.hops.some(hop => hop.pubkey === state.myNode.identity_pubkey)) ringConfig.hops.unshift({pubkey: state.myNode.identity_pubkey, label: state.myNode.label})
      peers = await Promise.all(ringConfig.hops.map(peer => fetch(`${state.baseUrl}/getNodeInfo?nodeId=${peer.pubkey}`)))
      peers = await Promise.all(peers.map(peer => peer.json()))

      ringConfig.hops = ringConfig.hops.map(hop => ({
        ...hop,
        label: hop.label || getPeerByPubKey(hop.pubkey).node.alias || hop.pubkey
      }))

      peers = peers.map(peer => {
        let hop = ringConfig.hops.find(hop => peer.node.pub_key === hop.pubkey)
        return {
          ...peer,
          node: {
            ...peer.node,
            alias: hop.label || peer.node.alias
          }
        }
      })
    }

    if (state.error) {
      let matches = state.error.message.match(/[a-z0-9]{66}/i)
      if (matches.length) {
        let reportingNode = matches[0]
        let index = ringConfig.hops.findIndex(hop => hop.pubkey === reportingNode)
        index += state.direction === 'clockwise' ? -1 : 1
        if (index > ringConfig.hops.length - 1) index = 0
        if (index < 0) index = ringConfig.hops.length - 1
        brokenNode = ringConfig.hops[index]
        console.log(index)
      }
    }
    drawRing(peers, state.myNode.identity_pubkey, brokenNode)

    // workaround to refresh UI
    if (document.activeElement.tagName === 'BODY') {
      document.getElementById('buildRoute-amt').focus()
    }
  })

  if (!initialised) {
    window.addEventListener('resize', () => drawRing(peers, state.myNode.identity_pubkey, brokenNode))
  }
  initialised = true

  return <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
    <h2 class="lg:col-span-4">{state.ring}</h2>
    <div class="lg:col-span-1 space-y-4">
      <div class="cursor-pointer" onclick={toggleMembers}>
        Members {ringConfig.showMembers ? '▾' :'▴'}
      </div>
      {ringConfig.showMembers
        ? <div>
            <div class="grid grid-cols-2 gap-4">
              <div class="font-bold">Label</div>
              <div class="font-bold">Pub key</div>
            </div>
            {
              ringConfig.hops.map((hop, i) => <div class={{'grid grid-cols-2 gap-4': true, 'bg-yellow-100': i % 2 === 0 && brokenNode?.pubkey !== hop.pubkey, 'bg-red-600 text-white': brokenNode?.pubkey === hop.pubkey}}>
                <input class="w-full bg-transparent border-0 p-2 cursor-pointer" onfocus={selectAll} value={hop.label} oninput={(state, event) => editLabel(state, event, i)}/>
                <input class="w-full bg-transparent border-0 p-2 cursor-pointer" onfocus={selectAll} value={hop.pubkey}/>
              </div>
            )}
          </div>
        : ''}
      <h3 class="text-l">Options</h3>
      <button class={{'cursor-pointer bg-yellow-400 text-white px-4 py-2 border-0 hover:bg-yellow-500': true, 'opacity-50': state.delete}} disabled={state.delete} onclick={state => deleteRing(state, state.ring)}>
        Delete
      </button>
      <h3 class="text-l">Build route</h3>
      <div>
        <label for="buildRoute-amt" class="block text-sm">Sats:</label>
        <input id="buildRoute-amt" type="number" value={state.createInvoice.amt || 10} oninput={setAmount} onfocus={refresh} class="w-20 p-2 border border-yellow-400" min="0"/>
      </div>

      <div class="mt-4 flex">
        <button class={{'cursor-pointer bg-yellow-400 text-white px-4 py-2 border-0 hover:bg-yellow-500': true, 'opacity-50': state.buildRoute}} disabled={state.buildRoute} onclick={state => buildRoute(state, 'clockwise', state.createInvoice.amt)}>
          Clockwise
        </button>
        <button class={{'cursor-pointer bg-yellow-400 text-white px-4 py-2 border-0 hover:bg-yellow-500 ml-4': true, 'opacity-50': state.buildRoute}}  disabled={state.buildRoute} onclick={state => buildRoute(state, 'counter-clockwise', state.createInvoice.amt)}>
          Counter-clockwise
        </button>
      </div>
      {state.route
        ? <div>
          <p>Route available for sending {state.createInvoice.amt} sats with fees of {state.route.total_fees} sats!</p>
          { state.invoice
            ? <button class={{'cursor-pointer bg-yellow-400 text-white px-4 py-2 border-0 hover:bg-yellow-500': true, 'opacity-50': state.sendToRoute}}  disabled={state.sendToRoute} onclick={state => sendToRoute(state)}>
                Make round payment
              </button>
            : <button class={{'cursor-pointer bg-yellow-400 text-white px-4 py-2 border-0 hover:bg-yellow-500': true, 'opacity-50': state.addInvoice}}  disabled={state.addInvoice} onclick={state => addInvoice(state, state.createInvoice.amt, state.ring + ' roundpayment')}>
              Create Invoice
            </button>
          }
          {state.sendToRoute
            ? <p>Sit back, this might take a little while</p>
            : ''}
        </div>
        : state.error
          ? <p class="bg-red-600 text-white p-4 break-all">{state.error.message}</p>
          : ''}
      {state.paymentStatus
        ? state.paymentStatus.status === 'SUCCEEDED'
          ? <p class="text-green-600">Roundpayment was successful!</p>
          : <p class="text-red-600">Roundpayment failed {state.paymentStatus.failure.code}</p>
        : ''}


    </div>
    <div class="relative lg:col-span-3">
      <img class="w-full" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" />
      <canvas id="ringGraph" class="absolute w-full h-full left-0 top-0"></canvas>
      <div id="extraInfo" class="absolute top-1/2 left-1/2 w-full lg:w-1/2 p-4 transform -translate-x-1/2 text-center bg-yellow-50 leading-8 hidden border border-yellow-400 overflow-hidden pointer-events-none"></div>
      <input type="text" id="copy-text" class="absolute opacity-0 pointer-events-none" />
    </div>
  </div>
}