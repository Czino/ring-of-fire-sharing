#!/bin/bash

cd "$( dirname "${BASH_SOURCE[0]}" )/."

stop=false
config_file=""
peer=""

_setArgs(){
  while [ "$1" != "" ]; do
    case $1 in
      "-h" | "--help")
        echo "options:"
        echo "-h, --help         show brief help"
        echo "-c, --config       (optional) define config file to load"
        echo "-p, --peer         (optional) the peer to remove"
        stop=true
        ;;
      "-c" | "--config")
        shift
        config_file="$1"
        ;;
      "-p" | "--peer")
        shift
        peer="$1"
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

while [ ! -n "$peer" ]; do
  read -p 'Node id of new peer: ' peer
done

entry=$(jq --arg peer "$peer" '.peers[] | select(. == $peer)' "$config_file")
if [ ! -n "$entry" ]; then
  echo "$peer is not in the list"
else
  config=$(jq --arg peer "$peer" 'del(.peers[] | select(. == $peer))' "$config_file")
  echo "$peer has been removed"
  echo "$config" | tee "$config_file" >/dev/null
fi
