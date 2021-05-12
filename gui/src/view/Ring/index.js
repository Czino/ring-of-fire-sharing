import { Http } from '../../effects/http'
import drawRing from '../../graph/drawRing.js'

let initialised = false
let peers = []
let ringConfig = {}
let channels = []

const buildRoute = (state, direction) => {
  const amt = 10
  const hops = direction === 'clockwise' ? ringConfig.hops : ringConfig.hops.reverse()
  return [
    {
      ...state,
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
      error(state, error) {
        return {
          ...state,
          buildRoute: false,
          error
        }
      }
    })
]
}

const addInvoice = (state, amt, memo, expiry) => {
  return [
    {
      ...state,
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

const sendToRoute = (state) => {
  return [
    {
      ...state,
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
          paymentHash: state.invoice.r_hash
        })
      },
      action(state, response) {
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

export const Ring = ({ state }) => {
  setTimeout(async () => {
    ringConfig = await fetch(`./getRingConfig?ring=${state.ring}`)
    ringConfig = await ringConfig.json()
    // ring = await fetch(`./getRingInfo?ring=${state.ring.id}`)
    peers = await Promise.all(ringConfig.hops.map(peer => fetch(`./listChannels?peer=${peer}`)))
    peers = await Promise.all(peers.map(peer => peer.json()))

    channels = peers
      .filter(peer => peer.channels.length > 0)
      .map(peer => peer.channels)
      .reduce((arr, channels) => {
        return arr.concat(channels)
      }, [])

    ringConfig.hops.unshift(state.myNode.identity_pubkey)
    peers = await Promise.all(ringConfig.hops.map(peer => fetch(`./getNodeInfo?nodeId=${peer}`)))
    peers = await Promise.all(peers.map(peer => peer.json()))

    drawRing(peers, state.myNode.identity_pubkey)
  })

  if (!initialised) {
    window.addEventListener('resize', () => drawChannels(channels, state.myNode))
  }
  initialised = true

  console.log(state.error)
  return <div>
    <h3>Build route</h3>
    <button disabled={state.buildRoute} onclick={state => buildRoute(state, 'clockwise')}>Clockwise</button>
    <button disabled={state.buildRoute} onclick={state => buildRoute(state, 'counter-clockwise')}>Counter-clockwise</button>
    {state.route
      ? <div>
        <p>Route available for {state.route.total_fees} sats!</p>
        { state.invoice
          ? <button disabled={state.sendToRoute} onclick={state => sendToRoute(state, )}>Make round payment</button>
          : <button disabled={state.addInvoice} onclick={state => addInvoice(state, 10, state.ring + ' roundpayment')}>Create Invoice of 10 sats</button>
        }
        {state.sendToRoute
          ? <p>Sit back, this might take a little while</p>
          : ''}
      </div>
      : state.error
      ? <p>{state.error.message}</p>
      : ''}
    {state.paymentStatus
      ? state.paymentStatus.status === 'SUCCESS'
        ? <p class="text-green-600">Roundpayment was successful!</p>
        : <p class="text-red-600">Roundpayment failed {state.paymentStatus.failure.code}</p>
      : ''}
    <div class="relative w-full">
      <img class="w-full" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" />
      <canvas id="ringGraph" class="absolute w-full h-full left-0 top-0"></canvas>
      <div id="extraInfo" class="absolute top-1/2 left-1/2 w-full lg:w-1/2 p-4 transform -translate-x-1/2 text-center bg-yellow-50 leading-8 hidden border border-yellow-400 overflow-hidden pointer-events-none"></div>
      <input type="text" id="copy-text" class="absolute opacity-0 pointer-events-none" />
    </div>
  </div>
}