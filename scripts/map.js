/**
 * @file util to generate map tiles based on ui map textures
 */

const fs = require('fs-extra')
const Canvas = require('canvas')
const path = require('path')

const BASE_FOLDER = './build/map/'
const mapArea = ['Teyvat', 'Enkanomiya']

const mapId = /-?\d+_-?\d+/

const mTileSz = 2048
const mTileCnt = 15

async function getJoinedCanvas (tileList) {
  const imgs = Canvas.createCanvas(mTileSz * mTileCnt, mTileSz * mTileCnt)

  const center = mTileCnt >> 1

  const ctx = imgs.getContext('2d')
  for (const k of tileList) {
    const tile = await Canvas.loadImage(k.path)
    const [ax, ay] = [center - k.x, center - k.y]
    const [sw, sh] = [tile.width, tile.height]
    const [dx, dy] = [ax * mTileSz, ay * mTileSz]
    console.log(tile, 0, 0, sw, sh, dx, dy, mTileSz, mTileSz)
    console.timeLog('canvas build image')
    ctx.drawImage(tile, 0, 0, sw, sh, dx, dy, mTileSz, mTileSz)
  }

  // await fs.writeFile('./build/output.png', imgs.toBuffer('image/png'))
  return imgs
}

const clipSz = 256
async function genClips (src, scale, level, folder) {
  for (let tileX = 0, xOffset = 0; xOffset < src.width; tileX++, xOffset += clipSz * scale) {
    for (let tileY = 0, yOffset = 0; yOffset < src.height; tileY++, yOffset += clipSz * scale) {
      const imgs = Canvas.createCanvas(clipSz, clipSz)
      const ctx = imgs.getContext('2d', { alpha: false })
      ctx.fillStyle = 'black'
      ctx.fill()
      ctx.drawImage(src, xOffset, yOffset, clipSz * scale, clipSz * scale, 0, 0, clipSz, clipSz)

      const p = path.join(folder, `${level}`, `${tileX}_${tileY}.jpg`)
      await fs.mkdir(path.dirname(p), { recursive: true })
      await fs.writeFile(p, imgs.toBuffer('image/jpeg', { quality: 0.9 }))
    }
  }
}

function getImageList (mapArea) {
  const dirpath = path.join(BASE_FOLDER, mapArea)
  const dir = fs.opendirSync(dirpath)
  const ret = []
  let ent
  while ((ent = dir.readSync()) != null) {
    // invaild input throw & terminate immediately
    const [y, x] = mapId.exec(ent.name)[0].split('_')
    ret.push({
      x: parseInt(x),
      y: parseInt(y),
      path: path.join(dirpath, ent.name)
    })
  }
  dir.closeSync()
  return ret
}

(async () => {
  console.time('scan images')
  const list = getImageList('Teyvat')
  console.timeEnd('scan images')

  console.time('canvas build image')
  const canvas = await getJoinedCanvas(list)
  console.timeEnd('canvas build image')

  console.time('gen clips')
  const maxZoomLevel = Math.ceil(Math.log(canvas.height) / Math.LN2)
  const minZoomLevel = 8
  for (let zoomLevel = maxZoomLevel, zoomValue = 1; zoomLevel >= minZoomLevel; zoomLevel--, zoomValue *= 2) {
    await genClips(canvas, zoomValue, zoomLevel, './build/tile/teyvat')
    console.timeLog('gen clips', `zoomValue=${zoomValue}`, `zoomLevel=${zoomLevel}`)
  }
  console.timeEnd('gen clips')
})()
