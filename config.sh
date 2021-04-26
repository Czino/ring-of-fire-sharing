#!/bin/bash

config_file=ringOfFireConfig.json
if [ -f "$config_file" ]; then
  read -p "$config_file already exists, overwrite [Y/N]? " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    return
  fi
fi

read -p 'Username: ' user
read -s -p 'Password: ' password
echo
read -p 'Server url: ' url

PS3='Lightning Implementation (type the corresponding number):'
options=("LND" "c-lightning")
select opt in "${options[@]}"
do
  case $opt in
    "LND")
      implementation="lnd"
      break
      ;;
    "c-lightning")
      implementation="c-lightning"
      break
      ;;
    "Quit")
      break
      ;;
    *) echo "invalid option $REPLY";;
  esac
done

if [[ "$implementation" == 'lnd' ]]
then
  PS3='cli or REST API? (type the corresponding number):'
  options=("cli" "REST")
  select opt in "${options[@]}"
  do
    case $opt in
      "cli")
        method="cli"
        PS3='lncli, umbrel, btcpayserver or shell script? (type the corresponding number):'
        options=("lncli" "umbrel" "btcpayserver (docker)" "specify path to script")
        select opt in "${options[@]}"
        do
          case $opt in
            "lncli")
              cli="lncli"
              break
              ;;
            "umbrel")
              cli="/home/umbrel/~umbrel/bin"
              break
              ;;
            "btcpayserver (docker)")
              cli="docker exec btcpayserver_lnd_bitcoin lncli --macaroonpath /root/.lnd/admin.macaroon"
              break
              ;;
            "specify path to script")
              read -p 'Path to script: ' cli
              if [[ "$cli" == *".sh"* ]]; then
                cli=". $cli"
              fi
              break
              ;;
            "Quit")
              break
              ;;
            *) echo "invalid option $REPLY";;
          esac
        done
        break
        ;;
      "REST")
        method="rest"
        break
        ;;
      "Quit")
        break
        ;;
      *) echo "invalid option $REPLY";;
    esac
  done
else
  PS3='c-lightning btcpayserver or shell script? (type the corresponding number):'
  options=("c-lightning" "btcpayserver (docker)" "specify path to script")
  select opt in "${options[@]}"
  do
    case $opt in
      "c-lightning")
        cli="c-lightning"
        break
        ;;
      "btcpayserver (docker)")
        cli="docker exec btcpayserver_clightning_bitcoin lightning-cli --rpc-file /root/.lightning/lightning-rpc"
        break
        ;;
      "specify path to script")
        read -p 'Path to script: ' cli
        if [[ "$cli" == *".sh"* ]]; then
          cli=". $cli"
        fi
        break
        ;;
      "Quit")
        break
        ;;
      *) echo "invalid option $REPLY";;
    esac
  done
fi

if [[ "$method" == 'rest' ]]
then
  read -p 'rest url (default: https://127.0.0.1:8080): ' rest_url
  if [ -n "$rest_url" ]; then
    rest_url="https://127.0.0.1:8080"
  fi
  read -p 'path to macaroon (default: ./readonly.macaroon): ' macaroon
  if [ -n "$rest_url" ]; then
    rest_url="./readonly.macaroon"
  fi
  read -p 'path to tls.cert (default ./tls.cert): ' tlscert
  if [ -n "$tlscert" ]; then
    tlscert="./tls.cert"
  fi
fi

peers=()
peer=true
while [ -n "$peer" ]; do
  read -p 'Public key of peer you have a channel with (leave empty when done): ' peer
  if [ -n "$peer" ]; then
    peers+=( "\"$peer\"" )
  fi
done

config=$(echo "${peers[@]}" | jq -s \
  --arg user "$user" \
  --arg password "$password" \
  --arg url "$url" \
  --arg implementation "$implementation" \
  --arg cli "$cli" \
  --arg method "$method" \
  --arg rest_url "$rest_url" \
  --arg macaroon "$macaroon" \
  --arg tlscert "$tlscert" \
  '{ peers: ., auth: { user: $user, password: $password }, url: $url, implementation: $implementation, cli: $cli, method: $method, rest_url: $rest_url, macaroon: $macaroon, tlscert: $tlscert }' )
echo "$config" | tee "$config_file" >/dev/null
