# Share Channel Data with your peers in the Ring of Fire

## Setup

### Dependencies

`sudo apt-get install jq`

### Configurations 
Copy `ringOfFireConfig.dist.json` and name it `ringOfFireConfig.json`

Replace placeholders with real values

```
{
  "auth": {
    "user": "USERNAME",
    "password": "PASSWORD"
  },
  "url": "URL_TO_SERVER",
  "implementation": "lnd|c-lightning",
  "cli": "lncli|c-lightning|/path/to/your/cli",
  "method": "rest",
  "restUrl": "https://127.0.0.1:8080",
  "macaroon": "PATH/TO/readonly.macaroon",
  "tlscert": "PATH/TO/tls.cert",
  "peers": [
    "PUBLIC_KEY_OF_RING_PEER1@ADDRESS",
    "PUBLIC_KEY_OF_RING_PEER2@ADDRESS",
    "PUBLIC_KEY_OF_RING_PEER3@ADDRESS",
    "..."
  ]
}


```
- auth
  - user: your username you received from the coordinator
  - password. your password you received from the coordinator
- url: url of the server used for data sharing
- implementation: your lightning implementation (`lnd` or `c-lightning`)
- peers: Address (nodeid@address:port) to all your direct peers of the ring
- implementation: (optional, default: `lnd`) your lightning implementation (currently supported lnd & c-lightning)
- cli: (optional, default lnd or `c-lightning`) specify the command to your cli ([background](https://docs.btcpayserver.org/LightningNetwork/#c-lightning-commands-lightning-cli))
- method: (optional, default: `cli`) can be specified as `rest` to execute commands to the lnd REST API
- restUrl: (if method is `rest`) url to your rest API
- tlscert: (if method is `rest`) the path to the tlscertificate
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
