#!/bin/bash

cd "$( dirname "${BASH_SOURCE[0]}" )/."

config_file=ringOfFireConfig.json

if [ ! -f "$config_file" ]; then
  echo "$config_file does not exists."
  return
fi

config=$(jq -c '.' "$config_file")
user=$(echo "$config" | jq -r '.auth.user' | tr -d '"')
password=$(echo "$config" | jq -r '.auth.password' | tr -d '"')
url=$(echo "$config" | jq -r '.url' | tr -d '"')

while true
do
  ringStats=$(. getRingStats.sh | jq -r -c '.')
  echo "$(date)Send ring status: $ringStats"
  curl -u "$user":"$password"  -X POST -H "Content-Type: application/json" -d "$ringStats"  "$url"
  sleep 600
done
