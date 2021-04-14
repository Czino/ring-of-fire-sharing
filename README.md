# Share Channel Data with your peers in the Ring of Fire

## Setup

Copy `ringOfFireConfig.dist.json` and name it `ringOfFireConfig.json`

Replace placeholders with real values

```
{
  "auth": {
    "user": "USERNAME",
    "password": "PASSWORD"
  },
  "url": "URL_TO_SERVER",
  "peers": [
    "PUBLIC_KEY_OF_PEER_1",
    "PUBLIC_KEY_OF_PEER_2"
  ]
}
```
- USERNAME: your username you received from the coordinator
- PASSWORD: your password you received from the coordinator
- URL_TO_SERVER: url of the server used for data sharing
- PUBLIC_KEY_OF_PEER_1: Public key of your 1st peer in the ring
- PUBLIC_KEY_OF_PEER_2: Public key of your 2nd peer in the ring

## Execution

Make sure you have access to `lncli`

Execute the command as follows

`./sendRingStats.sh`
