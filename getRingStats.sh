echo "{"

implementation=$(jq -c '.implementation' ringOfFireConfig.json)
if [[ implementation == 'c-lightning' ]]
then
  node_info=$(lightning-cli getinfo)
  my_node_id=$(echo "$node_info" | jq -r '.id')
  alias=$(echo "$node_info" | jq -r '.alias')
  color=$(echo "$node_info" | jq -r '.color')
else
  color="#$color"
  node_info=$(lncli getinfo)
  my_node_id=$(echo "$node_info" | jq -r '.identity_pubkey')
  alias=$(echo "$node_info" | jq -r '.alias')
  color=$(echo "$node_info" | jq -r '.color')
  feeReport=$(lncli feereport | jq -r '.')
fi

peers=$(jq -c '.peers[]' ringOfFireConfig.json)

echo "\"nodeId\":\"${my_node_id}\","
echo "\"alias\":\"${alias}\","
echo "\"color\":\"${color}\","
if [ -n "$peerInfo" ]
then
  echo "\"feeReport\":${feeReport},"
fi

last=$(echo "$peers" | tail -1)
echo "\"peers\": ["
echo "$peers" | while read peer; do
  if [ "$last" != "$peer" ]
  then
    echo "$peer,"
  else
    echo "$peer"
  fi
done
echo "],"

echo "\"ringPeers\": ["
echo "$peers" | while read peer; do
  peer=$(echo "$peer" | tr -d '"')
  node_id=$(echo "$peer" | cut -f1 -d@)
  if [[ implementation == 'c-lightning' ]]
  then
    peerInfo=$(lightning-cli listpeers "$node_id" | jq -r '.peers[]' | jq -r '.channels[0]' | jq -r --arg node_id "$node_id" '{ nodeId: $node_id, chan_id: .short_channel_id, local_balance: .spendable_msatoshi, remote_balance: .receivable_msatoshi }')
  else
    peerInfo=$(lncli listchannels --peer "$node_id" | jq -r '.channels[]' | jq -r --arg node_id "$node_id" '{ nodeId: $node_id, chan_id: .chan_id, local_balance: ((.local_balance | tonumber) * 1000), remote_balance: ((.remote_balance | tonumber) * 1000), active: .active }')
  fi

  if [ -n "$peerInfo" ]
  then
    echo "$peerInfo,"
  #else
    #TODO check whether we can ping nodes we are not having a channel with
    #peerInfo=$(lncli connect "$node_id")
    #echo "\"${node_id}\":${peerInfo},"
  fi
done

echo "{}]"
echo "}"
