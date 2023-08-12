import Clerk from '@clerk/clerk-js'

let clerk = null
const publishableKey =
  'pk_test_cmVmaW5lZC10b21jYXQtNTEuY2xlcmsuYWNjb3VudHMuZGV2JA'

const Elements = {
  controls: document.getElementById('signIn'),
  signOut: document.getElementById('signOut'),
  manage: document.getElementById('signIn-manage'),
  deleteMe: document.getElementById('signIn-delete'),
  userName: document.getElementById('signIn-userName'),
  mounted: document.getElementById('signIn-mounted'),
}

const ElementsOk = Object.values(Elements).every((element) => element)
const ElementDisplay = 'inline-block'
const ElementDisplayNone = 'none'

if (!ElementsOk) {
  console.error(`sign-in page layout not as expected!`)
}

const handleSignOut = async () => {
  if (clerk) {
    await clerk.signOut(() => {
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

const openSignIn = () => {
  clerk?.openSignIn()
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
}

function manageChange({ user }) {
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

// mutation observer for cl-modalCloseButton, reload the page

const closeModal = () => window.location.reload()

const watchForCloseModalButton = () => {
  // brute force way to watch for the creation of .cl-modalCloseButton
  const modalClose = document.querySelector('.cl-modalCloseButton')
  modalClose?.removeEventListener('click', closeModal)
  modalClose?.addEventListener('click', closeModal)
}

// Create an observer instance watching for the creation of the button
const observer = new MutationObserver(watchForCloseModalButton)
observer.observe(document.body, { subtree: true, childList: true })
;(async () => {
  await startClerk()
})()
