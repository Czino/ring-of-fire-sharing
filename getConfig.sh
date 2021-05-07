#!/bin/bash
cd "$( dirname "${BASH_SOURCE[0]}" )/."

config_file="ringOfFireConfig.json"
if [ -f "$config_file" ]; then
  new_name=""
  while [ ! -n "$new_name" ]; do
    read -p "Unnamed legacy config file found. How do you want to call it? " new_name
    new_name=$(echo "$new_name" | sed 's/[^a-zA-Z0-9]//g')

    if [ -n "$new_name" ]; then
      mv "$config_file" "rings/${new_name}.json"
    fi
  done
fi

config_files=( rings/* )

if [ "${#config_files[@]}" -eq 1 ]; then
  config_file="${config_files[0]}"
else
  PS3='Choose your ring config (type the corresponding number):'
  select opt in "${config_files[@]}"; do
    config_file=$opt
    break
  done
fi

if [ ! -f "$config_file" ]; then
  echo "Error: $config_file does not exists."
else
  echo "$config_file"
fi
