#!/bin/bash

cd "$( dirname "${BASH_SOURCE[0]}" )/."

config_file=ringOfFireConfig.json
if [ ! -f "$config_file" ]; then
  echo "$config_file does not exists."
  return
fi

read -p 'Node id of new peer: ' peer

config=$(jq --arg peer "$peer" '.peers += [$peer]' "$config_file")
echo "$config" | tee "$config_file" >/dev/null
echo "$peer has been added"
