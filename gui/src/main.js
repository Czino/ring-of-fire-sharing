import { app } from 'hyperapp'
import { Navigation } from './view/header/Navigation'
import { Dashboard } from './view/Dashboard'
import { MyNode } from './view/MyNode'

const baseUrl = `${window.location.protocol}//${window.location.hostname}`
let myNode = {}
let config = {}

;(async () => {
  myNode = await fetch(baseUrl + '/getInfo')
  myNode = await myNode.json()
  config = await fetch(baseUrl + '/getConfig')
  config = await config.json()

  app({
    init: {
      myNode,
      config,
      baseUrl,
      view: 'dashboard',
    },
    view: state => (
      <div class="p-8">
        <h1 class="text-center">Rings of Fire 🔥</h1>
        <Navigation state={state}/>
        {state.view === 'dashboard'
          ? <Dashboard state={state}/>
          : state.view === 'myNode'
          ? <MyNode state={state}/>
          : ''
        }
      </div>
    ),
    node: document.getElementById('app')
  })
})()


