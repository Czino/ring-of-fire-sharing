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
if [[ "$config_file" == *"Error"* ]] || [ ! -n "$config_file" ] || [ ! -f "$config_file" ]; then
  echo "$config_file does not exists."
  return
fi

config=$(jq -c '.' "$config_file")
ring=$(echo "$config_file" | sed 's/rings\///' | sed 's/.json//')

ringStats=$(./getRingStats.sh --config "$config_file" | jq -r '.')

mkdir -p data/"$ring"

echo "$(date)Save ring status: $ringStats"
echo "$ringStats" > data/"$ring"/ringStats.json
