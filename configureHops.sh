#!/bin/bash

cd "$( dirname "${BASH_SOURCE[0]}" )/."

config_file=ringOfFireConfig.json
if [ ! -f "$config_file" ]; then
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
