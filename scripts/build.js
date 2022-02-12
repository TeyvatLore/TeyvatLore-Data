const fs = require('fs-extra')
const cp = require('child_process')

const { generate } = require('./generate')

const exec = (cmd, options) => {
  const k = cp.spawn(cmd, [], { shell: true, stdio: 'inherit', ...options })
  return new Promise((resolve, reject) => {
    k.on('close', (code) => (code === 0 ? resolve : reject)(code))
  })
}

const jamstackRepo = 'https://github.com/TeyvatLore/TeyvatLore'

async function cloneRepo () {
  await exec(`git clone --depth=1 ${jamstackRepo} ./build/repo`)
  await fs.rm('./build/repo/content', { recursive: true })
}

async function clean () {
  if (fs.existsSync('./build')) {
    await fs.rm('./build', { recursive: true })
  }
  await fs.mkdir('./build/content_generated', { recursive: true })
}

async function build () {
  await exec('yarn install', { cwd: './build/repo' })
  await exec('yarn generate', { cwd: './build/repo' })

  await fs.copy('./build/repo/dist', './dist')
}

async function makeContent () {
  await generate()
  await fs.copy('./content', './build/repo/content')
  await fs.copy('./static', './build/repo/static')
  await fs.copy('./build/content_generated', './build/repo/content')
}

(async () => {
  await clean()
  await cloneRepo()
  await makeContent()
  await build()
})()
