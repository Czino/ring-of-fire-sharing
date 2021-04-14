#!/bin/bash


user=$(jq -c '.auth.user' ringOfFireConfig.json | tr -d '"')
password=$(jq -c '.auth.password' ringOfFireConfig.json | tr -d '"')
url=$(jq -c '.url' ringOfFireConfig.json | tr -d '"')

while true
do
  ringStats=$(./getRingStats.sh | jq -r -c '.')
  echo "$(date)Send ring status: $ringStats"
  curl -u "$user":"$password"  -X POST -H "Content-Type: application/json" -d "$ringStats"  "$url"
  sleep 600
done
