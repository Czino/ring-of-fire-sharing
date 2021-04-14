#!/bin/bash

echo "{"

node_info=$(lncli getinfo)
my_node_id=$(echo "$node_info" | jq -r '.identity_pubkey')
alias=$(echo "$node_info" | jq -r '.alias')
color=$(echo "$node_info" | jq -r '.color')
feeReport=$(lncli feereport | jq -r '.')
peers=$(jq -c '.peers[]' ringOfFireConfig.json)

echo "\"nodeId\":\"${my_node_id}\","
echo "\"alias\":\"${alias}\","
echo "\"color\":\"${color}\","
echo "\"feeReport\":${feeReport},"

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
  peerInfo=$(lncli listchannels --peer "$node_id" | jq -r --arg node_id "$node_id" '{ nodeId: $node_id, chan_id: .channels[].chan_id, local_balance: .channels[].local_balance, remote_balance: .channels[].remote_balance, active: .channels[].active }')
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
