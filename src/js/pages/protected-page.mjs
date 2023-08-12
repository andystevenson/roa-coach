import Clerk from '@clerk/clerk-js'

let clerk = null
const publishableKey =
  'pk_test_cmVmaW5lZC10b21jYXQtNTEuY2xlcmsuYWNjb3VudHMuZGV2JA'

const Elements = {
  controls: document.getElementById('controls'),
  userName: document.getElementById('userName'),
  mounted: document.getElementById('mounted'),
}

const ElementsOk = Object.values(Elements).every((element) => element)

if (!ElementsOk) {
  console.error(`login page layout not as expected!`)
}

const enableControls = (user) => {
  const { controls, userName, mounted } = Elements

  controls.removeAttribute('hidden')
  userName.removeAttribute('hidden')
  mounted.removeAttribute('hidden')

  userName.textContent = user.firstName
  clerk.mountUserButton(mounted)
}

const disableControls = () => {
  const { controls, userName, mounted } = Elements

  controls.setAttribute('hidden', '')
  userName.setAttribute('hidden', '')
  mounted.setAttribute('hidden', '')
}

async function manageChange({ user }) {
  console.log('manageChange >>>', clerk, user, clerk?.isReady(), '<<<')
  if (!clerk) return
  if (!ElementsOk) return
  if (!clerk.isReady()) return

  if (user) {
    enableControls(user)
    return
  }
  // hide elements and remove 'click' listeners
  disableControls()
  await clerk.navigate('/sign-in/')

  return
}

const startClerk = async () => {
  try {
    clerk = new Clerk(publishableKey)
    await clerk.load()

    clerk.addListener(manageChange)
  } catch (error) {
    console.error('Error Starting Clerk: ', error)
  }
}

window.addEventListener('offline', (e) => {
  console.warn(`network offline`)
})

window.addEventListener('online', (e) => {
  console.warn(`network online`)
})
;(async () => {
  await startClerk()
})()
