import { changeView } from '../../actions/changeView'

export const Navigation = ({ state }) => <nav class="flex justify-center">
  <div class={{ 'p-2': true, 'bg-yellow-400': state.view === 'dashboard'}} onClick={state => changeView(state, 'dashboard')}>Dashboard</div>
  <div class={{ 'p-2': true, 'bg-yellow-400': state.view === 'myNode'}} onClick={state => changeView(state, 'myNode')}>My node</div>
  {state.rings.map(ring =>
    <div class={{ 'p-2': true, 'bg-yellow-400': state.view === 'ring' && state.ring === ring}} onClick={state => changeView(state, 'ring', ring)}>{ring}</div>
  )}
</nav>
