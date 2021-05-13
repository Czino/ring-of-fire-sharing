import { Http } from '../../effects/http'
import { changeView } from '../../actions/changeView'
import { toCurrency } from '../../stringUtils'

const errors = {
  'INVALID_FORM': 'Form invalid, please check your inputs.',
  'HOPS_INVALID': 'One or more public keys of the hops are not valid.'
}
const addRing = (state, event) => {
  event.preventDefault()
  return [
    {
      ...state,
      addRing: true
    },
    Http({
      url: state.baseUrl + '/addRing',
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: state.newRing.name,
          hops: state.newRing.hops
        })
      },
      action(state, response) {
        state.rings.push(response.id)
        return {
          ...state,
          addRingStatus: response,
          addRing: false,
          newRing: {
            name: '',
            hops: ['']
          },
          error: response.error
        }
      },
      error(state, error) {
        console.log(error)
        return {
          ...state,
          addRing: false,
          error
        }
      }
    })
]
}

const setRingName = (state, event) => ({
  ...state,
  newRing: {
    ...state.newRing,
    name: event.target.value
  }
})
const setHop = (state, event, i) => {
  event.target.value.split(' ').map((hop, j) => {
    console.log(hop)
    state.newRing.hops[i+j] = hop
  })
  return {...state}
}
const addHop = state => {
  state.newRing.hops.push('')
  setTimeout(() => {
    document.getElementById(`newRing-hop-${state.newRing.hops.length - 1}`).focus()
  })
  return {...state}
}
const removeHop = state => {
  if (state.newRing.hops.length === 1) return state
  state.newRing.hops.pop()
  return {...state}
}

const selectAll = (state, event) => {
  event.target.select()
  return state
}

export const Dashboard = ({ state }) => {
  const localBalance = parseInt(state.myNode.channelBalance.local_balance.sat)
  const remoteBalance = parseInt(state.myNode.channelBalance.remote_balance.sat)
  const totalBalances = localBalance + remoteBalance

  return <div>
    <h2 class="text-xl text-center">Dashboard</h2>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      <div>
        <h3 class="text-l">Rings</h3>
        <ul>
          {state.rings.map(ring =>
            <li class={{ 'p-2 underline': true, 'bg-yellow-400': state.view === 'ring' && state.ring === ring}} onClick={state => changeView(state, 'ring', ring)}>{ring}</li>
          )}
        </ul>
        <h3 class="text-l">Add ring</h3>
        <form onsubmit={addRing} class="w-1/2 grid grid-cols-1 gap-2">
          <input type="text" class="p-2 border border-yellow-400" placeholder="Ring name" oninput={setRingName} autofocus/>
          <p class="text-sm mt-4 mb-0">Hops (Make sure to add hops in ring order)</p>
          {state.newRing.hops.map((hop, i, arr) => 
            <input type="text" id={`newRing-hop-${i}`} value={hop} class="p-2 border border-yellow-400" placeholder={`Hop ${i+1}`} oninput={(state, event) => setHop(state, event, i)} />)
          }
          <div>
            <button type="button" class="w-6 h-6 cursor-pointer text-white border-0 bg-gray-400 hover:bg-yellow-500" onClick={state => removeHop(state)} tabindex="-1">-</button>
            <button type="button" class="w-6 h-6 cursor-pointer text-white border-0 bg-gray-400 hover:bg-yellow-500 ml-2" onfocus={state => addHop(state)} onClick={state => addHop(state)}>+</button>
          </div>
          <button type="submit" class="mt-4 cursor-pointer bg-yellow-400 text-white px-4 py-2 border-0 hover:bg-yellow-500" disabled={state.addRing}>
            Add
          </button>
          {state.error
            ? <p class="bg-red-600 text-white p-4">{errors[state.error.error]}</p>
            : ''}
        </form>
      </div>
      <div class="grid grid-cols-1 gap-4">
        <h2 class="text-l">Info</h2>
        <div class="leading-8">
          <div>
            Alias: <strong>{state.myNode.alias}</strong>
          </div>
          <div class="flex">
            <label class="flex-shrink-0">Pub key:</label> <input class="w-full ml-2 bg-transparent border-0 overflow-hidden overflow-ellipsis" onfocus={selectAll}value={state.myNode.identity_pubkey}/>
          </div>
          {state.myNode.uris.map((uri, i) =>
            <div class="flex ">
              <label class="flex-shrink-0">Address {i+1}:</label> <input class="w-full ml-2 bg-transparent border-0 overflow-hidden overflow-ellipsis" onfocus={selectAll}value={uri}/>
            </div>
          )}
          <div>
            Version: <strong>{state.myNode.version}</strong>
          </div>
          <div>
            Peers: <strong>{state.myNode.num_peers}</strong>
          </div>
          <div>
            Active channels: <strong>{state.myNode.num_active_channels}</strong>
          </div>
          <div>
            Pending channels: <strong>{state.myNode.num_pending_channels}</strong>
          </div>
          <div>
            Synced to chain: <strong>{state.myNode.synced_to_chain ? '✓' : 'no'}</strong>
          </div>
          <div>
            Synced to graph: <strong>{state.myNode.synced_to_graph ? '✓' : 'no'}</strong>
          </div>
        </div>
        <h2 class="text-l">Channels</h2>
        <div class="leading-8">
          <div class="flex">
            <div class="w-1/2 text-center">
              Can send: {toCurrency(localBalance, 'BTC')}
            </div>
            <div class="w-1/2 text-center">
              Can receive: {toCurrency(remoteBalance, 'BTC')}
            </div>
          </div>
          <div class="flex h-6">
            <div class="flex justify-center items-center h-full bg-green-400" style={{
              'width': `${localBalance / (totalBalances) * 100}%`
            }}>{Math.round(localBalance / (totalBalances) * 100)}%</div>
            <div class="flex justify-center items-center h-full bg-yellow-400" style={{
              'width': `${remoteBalance / (totalBalances) * 100}%`
            }}>{Math.round(remoteBalance / (totalBalances) * 100)}%</div>
          </div>
        </div>
      </div>
    </div>
  </div>
}