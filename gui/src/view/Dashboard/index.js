export const Dashboard = ({ state }) => <div>
  <h2 class="text-l text-center">Dashboard</h2>
  <div class="leading-8">
    <div>
      Alias: <strong>{state.myNode.alias}</strong>
    </div>
    <div>
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