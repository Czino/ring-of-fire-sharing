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


# Tools

## Add/Remove direct peers
To avoid editing the JSON configuration or running the `config.sh` script again. You can use the following scripts to add/remove peers:

`./addPeer.sh PUBLIC_KEY`

`./removePeer.sh PUBLIC_KEY`


# Upgrade from v0.0.1

Run this script which will prompt you to name your old config

`./getConfig.sh`

Run the install script again

`./install.sh`

and remove old service files

```
sudo systemctl stop ring-of-fire-sharing.service
sudo systemctl disable ring-of-fire-sharing.service
sudo rm /etc/systemd/system/ring-of-fire-sharing.service
```