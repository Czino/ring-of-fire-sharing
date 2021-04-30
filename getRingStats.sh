#!/bin/bash

cd "$( dirname "${BASH_SOURCE[0]}" )/."

stop=false
config_file=""

_setArgs(){
  while [ "$1" != "" ]; do
    case $1 in
      "-h" | "--help")
        echo "options:"
        echo "-h, --help         show brief help"
        echo "-c, --config       (optional) define config file to load"
        stop=true
        ;;
      "-c" | "--config")
        shift
        config_file="$1"
        ;;
    esac
    shift
  done
}

_setArgs $*

if "$stop"; then
  return
fi

if [ ! -n "$config_file" ]; then
  config_file=$(./getConfig.sh)
fi
if [[ $config_file == *"Error"* ]] || [ ! -n $config_file ] || [ ! -f "$config_file" ]; then
  echo "$config_file does not exists."
  return
fi

config=$(jq -c '.' "$config_file")
implementation=$(echo "$config" | jq -r '.implementation' | tr -d '"')
method=$(echo "$config" | jq -r '.method' | tr -d '"')
if [[ "$method" == 'rest' ]]; then
  macaroon=$(echo "$config" | jq -r '.macaroon' | tr -d '"')
  MACAROON_HEADER="Grpc-Metadata-macaroon: $(xxd -ps -u -c 1000 $macaroon)"
  rest_url=$(echo "$config" | jq -r '.restUrl' | tr -d '"')
  tlscert=$(echo "$config" | jq -r '.tlscert' | tr -d '"')
else
  cli=$(echo "$config" | jq -r '.cli' | tr -d '"')
fi

if [[ "$implementation" == 'c-lightning' ]]; then
  if [[ "$cli" == 'null' || "$cli" == '' ]]; then
    cli="lightning-cli"
  fi

  node_info=$(${cli} getinfo)
  my_node_id=$(echo "$node_info" | jq -r '.id')
  alias=$(echo "$node_info" | jq -r '.alias')
  color="#$(echo "$node_info" | jq -r '.color')"
  feeReport="[]"
else
  if [[ "$method" == 'rest' ]]; then
    node_info=$(curl -s -X GET --cacert "$tlscert" --header "$MACAROON_HEADER" "$rest_url"/v1/getinfo)
  else
    if [[ "$cli" == 'null' || "$cli" == '' ]]; then
      cli="lncli"
    fi
    node_info=$(${cli} getinfo)
  fi
  my_node_id=$(echo "$node_info" | jq -r '.identity_pubkey')
  alias=$(echo "$node_info" | jq -r '.alias')
  color=$(echo "$node_info" | jq -r '.color')
  feeReport=$(${cli} feereport | jq -r '.')
fi

peers=($(echo "$config" | jq -r '.peers' | tr -d '[],"'))

ringPeers=()
for node_id in "${peers[@]}"; do
  if [[ "$implementation" == 'c-lightning' ]]; then
    peerInfo=$(${cli} listpeers "$node_id" | jq -r '.peers[]' | jq -r '{ channel: .channels[0], active: .connected }' | jq -r --arg node_id "$node_id" '{ nodeId: $node_id, channel_point: (.channel.funding_txid + ":" + (.channel.short_channel_id | split("x"))[2]), local_balance: .channel.spendable_msatoshi, remote_balance: .channel.receivable_msatoshi, active: .active }')
  else
    if [[ "$method" == 'rest' ]]; then
      encoded_node_id=$(echo "$node_id" | xxd -r -p | base64)
      channels=$(curl -G -s --cacert "$tlscert" --header "$MACAROON_HEADER" --data-urlencode "peer=$encoded_node_id" "https://127.0.0.1:8080/v1/channels")
    else
      channels=$(${cli} listchannels --peer "$node_id")
    fi
    peerInfo=$(echo "$channels" | jq -r '.channels[]' | jq -r -c '{ nodeId: .remote_pubkey, channel_point: .channel_point, local_balance: ((.local_balance | tonumber) * 1000), remote_balance: ((.remote_balance | tonumber) * 1000), active: .active }')
  fi

  if [ -n "$peerInfo" ]; then
    ringPeers+=( "$peerInfo" )
  fi
done

echo "${ringPeers[@]}" | jq -s \
  --arg nodeId "$my_node_id" \
  --arg alias "$alias" \
  --arg color "$color" \
  --argjson feeReport "$feeReport" \
  '{ nodeId: $nodeId, alias: $alias, color: $color, feeReport: $feeReport, ringPeers: .}'
