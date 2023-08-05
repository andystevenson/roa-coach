import Clerk from '@clerk/clerk-js'

let clerk = null
const publishableKey =
  'pk_test_cmVmaW5lZC10b21jYXQtNTEuY2xlcmsuYWNjb3VudHMuZGV2JA'

const Elements = {
  controls: document.getElementById('controls'),
  signOut: document.getElementById('signOut'),
  manage: document.getElementById('manage'),
  deleteMe: document.getElementById('delete'),
  userName: document.getElementById('userName'),
  mounted: document.getElementById('mounted'),
}

const ElementsOk = Object.values(Elements).every((element) => element)
const ElementDisplay = 'inline-block'
const ElementDisplayNone = 'none'

if (!ElementsOk) {
  console.error(`login page layout not as expected!`)
}

const handleSignOut = async () => {
  if (clerk) {
    await clerk.signOut(() => {
      console.log('handleSignOut', clerk, clerk?.user)
      window.location.reload()
    })
  }
}

const handleManage = () => {
  const { mounted } = Elements
  const trigger = mounted?.querySelector('.cl-userButtonTrigger')
  if (trigger) trigger.click()
}
const handleDelete = () => {
  clerk?.user?.delete()
  window.location.reload()
}

const enableControls = (user) => {
  const { controls, signOut, manage, deleteMe, userName, mounted } = Elements
  controls.style.display = 'grid'

  signOut.style.display = ElementDisplay
  signOut.addEventListener('click', handleSignOut)

  manage.style.display = ElementDisplay
  manage.addEventListener('click', handleManage)

  // only enable 'delete' if the user is allowed to do it!

  if (user.deleteSelfEnabled) {
    deleteMe.style.display = ElementDisplay
    deleteMe.addEventListener('click', handleDelete)
  }

  userName.style.display = ElementDisplay
  userName.textContent = user.firstName
  mounted.style.display = ElementDisplay
  clerk.mountUserButton(mounted)
}

let CloseModalTimeout = null

const handleCloseModal = () => {
  clearTimeout(CloseModalTimeout)
  const modalClose = document.querySelector('.cl-modalCloseButton')
  console.log('handleCloseModal', { modalClose })
  modalClose?.addEventListener('click', () => {
    window.location.reload()
  })
}

const openSignIn = () => {
  clerk?.openSignIn()
  CloseModalTimeout = setTimeout(handleCloseModal, 500)
}

const disableControls = () => {
  const { controls, signOut, manage, deleteMe, userName, mounted } = Elements
  controls.style.display = ElementDisplayNone

  signOut.style.display = ElementDisplayNone
  signOut.removeEventListener('click', handleSignOut)

  manage.style.display = ElementDisplayNone
  manage.removeEventListener('click', handleManage)

  deleteMe.style.display = ElementDisplayNone
  deleteMe.removeEventListener('click', handleDelete)

  userName.style.display = ElementDisplayNone
  mounted.style.display = ElementDisplayNone

  console.log('hasChildNodes', mounted.hasChildNodes())
}

function manageChange({ user }) {
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
  openSignIn()

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

;(async () => {
  await startClerk()
})()

addEventListener('pageshow', (e) => console.log({ e }))
