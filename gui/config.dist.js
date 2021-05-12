module.exports = {
  lnd: {
    macaroon: './path/to/admin.macaroon', // readonly.macaroon is ok as well for display only
    url: 'https://localhost:8080'
  },
  rings: [
    'NAME_OF_RING_1',
    'NAME_OF_RING_2',
    'etc...'
  ]
}