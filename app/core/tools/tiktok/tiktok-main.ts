import { Worker } from 'worker_threads'
import { BrowserWindow, screen } from 'electron'

const StartAutoCaptcha = 'StartAutoCaptcha'
const StopAutoCaptcha = 'StopAutoCaptcha'
const windowTotalCount = 9
const windowTotalRow = 3
const windowTotalColumn = 3
const windowPositionMap: Map<number, Worker> = new Map()

export function startTiktokWorker(
  currentWin: BrowserWindow,
  email: string,
  password: string,
  country: string,
  windowSize: Size,
  windowPosition: Point
) {
  $tools.log.info('width:' + windowSize.width)
  $tools.log.info('position:' + windowPosition.y)
  const worker = new Worker('./dist/tiktok/main.js', {
    workerData: {
      email: email,
      password: password,
      country: country,
      width: windowSize.width,
      height: windowSize.height,
      x: windowPosition.x,
      y: windowPosition.y,
    },
  })

  worker.on('message', (result) => {
    try {
      console.log('收到内容:' + result)
      // const msgObj = JSON.parse(result)
      // const win = BrowserWindow.getFocusedWindow()
      if (currentWin) {
        console.log('发送信息')
        currentWin.webContents.send('status-update', result)
      }
    } catch (e) {
      console.log(e)
    }
    // console.log(result)
  })

  worker.on('error', (error) => {
    console.log(error)
  })

  worker.on('exit', (exitCode) => {
    console.log(`It exited with code ${exitCode}`)
  })
  return worker
}

export function calcBrowserSizeAndPosition(): [Size, Point] | undefined {
  let positionIndex = 0
  while (positionIndex < windowTotalCount) {
    if (windowPositionMap.has(positionIndex)) {
      positionIndex++
    } else {
      break
    }
  }
  if (positionIndex == windowTotalCount) {
    return undefined
  }
  const windowSize = calcBrowserSize()
  const windowPosition = calcBrowserPosition(positionIndex)
  return [windowSize, windowPosition]
}

export function calcBrowserPosition(positionIndex: number): Point {
  const windowSize = calcBrowserSize()
  console.log(windowSize)
  const totalColumn = calcActuaScreenHeight() / windowSize.height
  console.log('positionIndex:' + positionIndex)
  console.log('totalColumn:' + totalColumn)
  const x: number = windowSize.width * (positionIndex % totalColumn)
  const y: number = windowSize.height * Math.floor(positionIndex / totalColumn)
  console.log('x:' + x + ';y:' + y)
  return { x: x, y: y }
}

export function calcBrowserSize(): Size {
  const mainScreen = screen.getPrimaryDisplay()
  const dimensins = mainScreen.size
  const scalaFactor = mainScreen.scaleFactor
  console.log('窗体大小')
  console.log(dimensins)
  console.log('scalFactor:' + scalaFactor)
  return {
    height: Math.round(dimensins.height / windowTotalRow),
    width: Math.round(dimensins.width / windowTotalColumn),
  }
}

export function calcActuaScreenHeight(): number {
  const mainScreen = screen.getPrimaryDisplay()
  const dimensins = mainScreen.size
  // const scalaFactor = mainScreen.scaleFactor
  return dimensins.height
}
