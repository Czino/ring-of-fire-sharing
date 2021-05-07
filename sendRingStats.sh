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
user=$(echo "$config" | jq -r '.auth.user' | tr -d '"')
password=$(echo "$config" | jq -r '.auth.password' | tr -d '"')
url=$(echo "$config" | jq -r '.url' | tr -d '"')

while true
do
  ringStats=$(./getRingStats.sh --config "$config_file" | jq -r -c '.')
  echo "$(date)Send ring status: $ringStats"
  curl -u "$user":"$password"  -X POST -H "Content-Type: application/json" -d "$ringStats"  "$url"
  sleep 600
done
