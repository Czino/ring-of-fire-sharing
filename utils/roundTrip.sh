#!/bin/bash

cd "$( dirname "${BASH_SOURCE[0]}" )/."

config_file=../ringOfFireConfig.json
if [ ! -f "$config_file" ]; then
  echo "$config_file does not exists."
  return
fi

amt=1
memo=""
direction="right"
stop=false

_setArgs(){
  while [ "$1" != "" ]; do
    case $1 in
      "-h" | "--help")
        echo "options:"
        echo "-h, --help         show brief help"
        echo "--amt,             (optional, default: 1) amount in sats to route"
        echo "--memo,             (optional) memo of invoice"
        echo "-d, --direction    (optional, default: right) route to the left or right"
        stop=true
        ;;
      "--amt")
        shift
        amt="$1"
        ;;
      "--memo")
        shift
        memo="$1"
        ;;
      "-d" | "--direction")
        shift
        direction="$1"
        ;;
    esac
    shift
  done
}

_setArgs $*

if "$stop"; then
  return
fi

amt_msats=$(expr $amt \* 1000)

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

  #node_info=$(${cli} getinfo)
  #my_node_id=$(echo "$node_info" | jq -r '.id')
  echo "Sorry, c-lightning is not yet supported"
else
  if [[ "$method" == 'rest' ]]; then
    node_info=$(curl -s -X GET --cacert "$tlscert" --header "$MACAROON_HEADER" "$rest_url"/v1/getinfo)
  else
    if [[ "$cli" == 'null' || "$cli" == '' ]]; then
      cli="lncli"
    fi
    node_info=$(${cli} getinfo)
  fi

  if [[ "$direction" == 'right' ]]; then
   hops=$(echo "$config" | jq -r '(.hops | join(","))' | tr -d '"')
  else
   hops=$(echo "$config" | jq -r '(.hops | reverse | join(","))' | tr -d '"')
  fi

  if [[ $hops == "" ]]; then
    echo "No hops yet defined. use configureHops.sh to add your hops!"
    return
  fi

  route=$("$cli" buildroute --amt "$amt" --hops "$hops")
  if [[ $route == *"error"* ]] || [ -n $route ]; then
    echo "Route could not be built!"
  else
    echo "The route is available!"
    invoice=$("$cli" addinvoice --amt "$amt" --memo "$memo")
    payment_hash=$(echo "$invoice" | jq -r '.r_hash')
    payment_addr=$(echo "$invoice" | jq -r '.payment_addr')

    payment_result=$(echo "$route" | jq -r --arg amt_msats "$amt_msats" --arg payment_addr "$payment_addr" '(.route.hops[-1] | .mpp_record) |= {payment_addr:$payment_addr, total_amt_msat: $amt_msats}' | "$cli" sendtoroute --payment_hash="$payment_hash" -)
    echo "$payment_result"
  fi
fi

