# Share Channel Data with your peers in the Ring of Fire

## Setup

### Dependencies

`sudo apt-get install jq`

### Configurations 
Execute the configuration script. It will guide you through the configurations.

`./config.sh`
`./install.sh`

## Execution

Make sure you have access to `lncli` or `lightning-cli`

Execute the command as follows


`./sendRingStats.sh`

## Run script as a service

Create and write following service file:

`sudo nano /etc/systemd/system/ring-of-fire-sharing.service`

```
[Unit]
Description=Send your node status periodically to the ring server

[Service]
ExecStart=/path/to/ring-of-fire-sharing/sendRingStats.sh
Restart=on-failure
User=[USER]

# Hardening measures
####################
# Provide a private /tmp and /var/tmp.
PrivateTmp=true
# Mount /usr, /boot/ and /etc read-only for the process.
ProtectSystem=full
# Disallow the process and all of its children to gain
# new privileges through execve().
NoNewPrivileges=true
# Use a new /dev namespace only populated with API pseudo devices
# such as /dev/null, /dev/zero and /dev/random.
PrivateDevices=true
# Deny the creation of writable and executable memory mappings.
MemoryDenyWriteExecute=true

[Install]
WantedBy=multi-user.target
```

*Note* [USER] needs to be replaced with the user in your system that can run lncli/lightning-cli.
*Note* /path/to/ needs to be replaced with the location where your sharing script is lying

*Start and enable the newly created service*

`sudo systemctl start ring-of-fire-sharing.service`

`sudo systemctl enable ring-of-fire-sharing.service`

The script will now keep running 24/7 and automatically start when your node reboots
