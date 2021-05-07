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
if [[ "$config_file" == *"Error"* ]] || [ ! -n "$config_file" ] || [ ! -f "$config_file" ]; then
  echo "$config_file does not exists."
  return
fi

hops=()
hop=true
while [ -n "$hop" ]; do
  read -p 'Public key of hop (leave empty when done): ' hop
  if [ -n "$hop" ]; then
    hops+=( "\"$hop\"" )
  fi
done
config=$(jq '.' "$config_file")
config=$(echo "${hops[@]}" | jq -s --argjson config "$config" '$config + {"hops": .}')
echo "$config" | tee "$config_file" >/dev/null
echo "Hops configured"
