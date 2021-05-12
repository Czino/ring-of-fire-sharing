import { Http } from '../../effects/http'
import { changeView } from '../../actions/changeView'

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
          error: response.error
        }
      },
      error(state, error) {
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
  state.newRing.hops[i] = event.target.value
  return {...state}
}
const addHop = state => {
  state.newRing.hops.push('')
  return {...state}
}

export const Dashboard = ({ state }) => <div>
  <h2 class="text-l text-center">Dashboard</h2>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <div>
      <h3>Rings</h3>
      <ul>
        {state.rings.map(ring =>
          <li class={{ 'p-2 underline': true, 'bg-yellow-400': state.view === 'ring' && state.ring === ring}} onClick={state => changeView(state, 'ring', ring)}>{ring}</li>
        )}
      </ul>
      <h3>Add ring</h3>
      <form onsubmit={addRing} class="w-1/2 grid grid-cols-1 gap-4">
        <input type="text" class="p-2" placeholder="Ring name" oninput={setRingName}/>
        {state.newRing.hops.map((hop, i) => 
          <input type="text" value={hop} class="p-2" placeholder={`Hop ${i+1}`}  oninput={(state, event) => setHop(state, event, i)}/>)
        }
        <div>
          <button type="button" class="w-6 h-6 cursor-pointer bg-gray-400 text-white border-0 hover:bg-yellow-500" onClick={state => addHop(state)}>+</button>
        </div>
        <button type="submit" class="cursor-pointer bg-yellow-400 text-white p-4 border-0 hover:bg-yellow-500" disabled={state.addRing}>
          Add
        </button>
      </form>
    </div>
    <div class="leading-8">
      <div>
        Alias: <strong>{state.myNode.alias}</strong>
      </div>
      <div class="overflow-hidden overflow-ellipsis whitespace-nowrap">
        Pub key: <strong>{state.myNode.identity_pubkey}</strong>
      </div>
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
  </div>
</div>