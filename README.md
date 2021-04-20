# Share Channel Data with your peers in the Ring of Fire

## Setup

### Dependencies

`sudo apt-get install jq`

### Configurations 
Execute the configuration script. It will guide you through the configurations.

`./config.sh`

## Execution

Make sure you have access to `lncli` or `lightning-cli`

Execute the command as follows


`./sendRingStats.sh`

## Run script as a service

Use the following command to install the script as a service
`./install.sh`

The script will now keep running 24/7 and automatically start when your node reboots
