import { app } from 'hyperapp'
import { Navigation } from './view/header/Navigation'
import { Dashboard } from './view/Dashboard'
import { MyNode } from './view/MyNode'
import { Ring } from './view/Ring'

const baseUrl = window.location.origin

;(async () => {
  let myNode = await fetch(baseUrl + '/getInfo')
  myNode = await myNode.json()
  let rings = await fetch(baseUrl + '/getRings')
  rings = await rings.json()

  app({
    init: {
      myNode,
      rings,
      baseUrl,
      view: 'dashboard',
      newRing: {
        name: '',
        hops: ['']
      },
      createInvoice: {
        amt: 0
      }
    },
    view: state => (
      <div class="p-8">
        <h1 class="text-3xl text-center">Rings of Fire 🔥</h1>
        <Navigation classname="my-6" state={state}/>
        {state.view === 'dashboard'
          ? <Dashboard state={state}/>
          : state.view === 'myNode'
          ? <MyNode state={state}/>
          : state.view === 'ring'
          ? <Ring state={state}/>
          : ''
        }
      </div>
    ),
    node: document.getElementById('app')
  })
})()


