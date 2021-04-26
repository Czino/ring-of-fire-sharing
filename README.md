# Share Channel Data with your peers in the Ring of Fire

## Setup

### Dependencies

`sudo apt-get install jq`

### Configurations 
Execute the configuration script. It will guide you through the configurations.

`./config.sh`

## Manual execution

Make sure you have access to `lncli` or `lightning-cli`

Execute the command as follows

`./sendRingStats.sh`

## Run script as a service

Use the following command to install the script as a service (you'll need root access)

`./install.sh`

or directly with root privileges

`sudo bash ./install.sh`

The script will now keep running 24/7 and automatically start when your node reboots


## Check if it works

The following log should show no error:

`sudo journalctl -f -u ring-of-fire-sharing.service`