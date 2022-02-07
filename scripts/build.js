const fs = require('fs-extra')
const path = require('path')
const cp = require('child_process')
const exec = (cmd, options) => {
  const k = cp.spawn(cmd, [], { shell: true, stdio: 'inherit', ...options })
  return new Promise((resolve, reject) => {
    k.on('close', (code) => (code === 0 ? resolve : reject)(code))
  })
}

const jamstackRepo = 'https://github.com/TeyvatLore/TeyvatLore'

async function cloneRepo () {
  await exec(`git clone --depth=1 ${jamstackRepo} ./repo`)
  await fs.rm('./repo/content', { recursive: true })
  await fs.symlink(path.resolve('./content/'), path.resolve('./repo/content/'))
}

async function clean () {
  if (fs.existsSync('./dist')) {
    await fs.rm('./dist', { recursive: true })
    await fs.mkdir('./dist')
  }
  if (fs.existsSync('./repo')) {
    await fs.rm('./repo', { recursive: true })
  }
}

async function build () {
  await exec('yarn install', { cwd: './repo' })
  await exec('yarn generate', { cwd: './repo' })

  await fs.copy('./repo/dist', './dist')
}

(async () => {
  await clean()
  await cloneRepo()
  await build()
})()
