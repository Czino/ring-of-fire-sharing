#!/bin/bash

cd "$( dirname "${BASH_SOURCE[0]}" )/."

config_file=ringOfFireConfig.json
if [ ! -f "$config_file" ]; then
  echo "$config_file does not exists."
  return
fi

read -p 'Node id of new peer: ' peer

entry=$(jq --arg peer "$peer" '.peers[] | select(. == $peer)' "$config_file")
if [ ! -n "$entry" ]; then
  echo "$peer is not in the list"
else
  config=$(jq --arg peer "$peer" 'del(.peers[] | select(. == $peer))' "$config_file")
  echo "$peer has been removed"
  echo "$config" | tee "$config_file" >/dev/null
fi
