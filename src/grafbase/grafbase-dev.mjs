import { argv } from 'process'
import { execSync, spawn } from 'child_process'
import { kill } from 'process'
import find from 'find-process'

export async function process() {
  let pid = 0
  try {
    const p = await find('port', 4000)
    if (p) {
      pid = p[0].pid
      return +pid
    }
  } catch (error) {
    console.error('grafbase process failed!', error.message)
  }
  return +pid
}

export async function stop() {
  try {
    execSync('kill-port 4000')
    // console.log('grafbase stop did not stop anything!')
  } catch (error) {
    // console.log('grafbase stop failed!', error.message)
  }
}

export async function reset() {
  try {
    execSync('grafbase reset')
    // console.log('grafbase reset')
  } catch (error) {
    // ignore it, it will fail on empty database
    // console.error('grafbase reset failed!', error.message)
  }
}

export async function start() {
  try {
    const subprocess = spawn('grafbase', ['dev'], {
      detached: true,
      stdio: 'ignore',
    })

    // console.log('grafbase dev subprocess', subprocess)

    subprocess.unref()

    // wait till it is up and running before returning.
    let up = null
    while (!up) {
      const p = await find('port', 4000)
      if (p && p.length > 0) up = p[0].pid
    }
    // console.log('grafbase dev')
  } catch (error) {
    // console.error('grafbase dev failed!', error.message)
  }
}

export function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function clean() {
  await stop()
  await reset()
  await start()
}

async function run() {
  if (argv[2] === '--process') await process()
  if (argv[2] === '--stop') await stop()
  if (argv[2] === '--reset') await reset()
  if (argv[2] === '--start') await start()
  if (argv[2] === '--wait') await wait(argv[3] ? +argv[3] : 0)
  if (argv[2] === '--clean') await clean()
}

run()
