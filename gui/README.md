# Your personal Ring of Fire Dashboard

## Setup

### Config

If you run the dashboard on an external machine: copy `admin.macaroon` into this folder

If you run it on your lightning node: locate full path to `admin.macaroon`

Copy `config.dist.js` and name it `config.js`

Make sure to change the values accordingly

```
module.exports = {
  lnd: {
    macaroon: './path/to/admin.macaroon', // readonly.macaroon is ok as well for display only
    url: 'https://localhost:8080'
  }
}
```

### Dependencies

`npm install`

`npm run parcel:build`

## Run it manually

`npm run server`

## Run it 24/7

Create new service file

`sudo nano /etc/systemd/system/rof-dashboard.service`


And fill in following data

```
[Unit]
Description=RoF Dashboard

[Service]
ExecStart=/usr/bin/node full/path/of/the/rof-dashboard/folder>/index.js
User=<user>
Restart=always
TimeoutSec=120
RestartSec=30

[Install]
WantedBy=multi-user.target
```

Then execute
```
sudo systemctl enable rof-dashboard.service
sudo systemctl start rof-dashboard.service
```