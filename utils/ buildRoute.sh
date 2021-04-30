#!/bin/bash
# my first encounter with bash so I am probably wrong in 90%
#copying out most of original roundTrip.sh
cd "$( dirname "${BASH_SOURCE[0]}" )/.."

amt=1
memo=""
direction="right"
stop=false
config_file=""
probe= false

_setArgs(){
  while [ "$1" != "" ]; do
    case $1 in
      "-h" | "--help")
        echo "options:"
        echo "-h, --help         show brief help"
        # needed for call when using for payment
        echo "--amt,             (optional, default: 1) amount in sats to route"
        # makes no sense here
        # echo "--memo,            (optional) memo of invoice"
        echo "-d, --direction    (optional, default: right) route to the left or right"
        echo "-c, --config       (optional) define config file to load"
        # thinking about putting in flag -dry which would echo intermediaries, if not dry would only return route?
        stop=true
        ;;
      "--amt")
        shift
        amt="$1"
        ;;
        # Not needed here
      # "--memo")
      #   shift
      #   memo="$1"
      #   ;;
      "-d" | "--direction")
        shift
        direction="$1"
        ;;
      "-c" | "--config")
        shift
        config_file="$1"
        ;;
      "-p" | "--probe")
        shift
        probe= true
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
if [[ "$config_file" == *"Error"* ]] || [ ! -n "$config_file" ] || [ ! -f "$config_file" ]; then
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
    if $probe; then
      echo "Dry probing! "
      echo "The route is available!"
      echo "with hops :" $hops
      echo " "
      echo "and route as defined as :" $route
    else
    echo $route
    fi
  fi
fi
