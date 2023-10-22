import { ipcMain, dialog, BrowserWindow, screen, Point } from 'electron'
import { ChildProcess, spawn } from 'child_process'
import WebSocket from 'ws'
import { calcBrowserSizeAndPosition, startTiktokWorker } from './tiktok/tiktok-main'

let mySpawn: ChildProcess[] = []
ipcMain.on('open-child-now', (e, msg) => {
  console.log('打开进程-->mainProcessGet:', msg)
  const childProcess: ChildProcess = spawn(msg)
  mySpawn[mySpawn.length] = childProcess
  e.sender.send('cs-reply', '打开进程:' + msg)
})
ipcMain.on('kill-child-now', (e, msg) => {
  console.log('结束进程-->mainProcessGet:', msg)
  e.sender.send('cs-reply', '结束进程:' + msg)
  mySpawn.forEach((item) => {
    item.kill()
  })
  mySpawn = []
})

ipcMain.on('open-directory-dialog', async (e, msg) => {
  // dialog.showOpenDialog()
  const win = BrowserWindow.getFocusedWindow()
  if (win) {
    const result = await dialog.showOpenDialog(win, { properties: ['openFile'] })
    console.log(result.filePaths[0])
    const accounts = await $tools.getAccountsFromExcel(result.filePaths[0])
    console.log(accounts)
    e.sender.send('select-excel-done', accounts)
  }
})

const wss = new WebSocket.Server({ port: 8080 })
ipcMain.on('start-batch-login', async (e: AnyObj, globalData: DataType[]) => {
  const win = BrowserWindow.getFocusedWindow()
  for (let i = 0; i < 9; i++) {
    $tools.log.info(globalData[i])
    await $tools.delay(5000)
    const email = globalData[i].email
    const password = globalData[i].password
    const country = 'gb'
    const windowSizeAndPosition = calcBrowserSizeAndPosition()

    if (windowSizeAndPosition && win) {
      const windowSize = windowSizeAndPosition[0]
      const windowPosition = windowSizeAndPosition[1]
      startTiktokWorker(win, email, password, country, windowSize, windowPosition)
    }
  }
})

ipcMain.on('start-single-login', async (e: AnyObj, globalData: DataType) => {
  const win = BrowserWindow.getFocusedWindow()
  $tools.log.info(globalData)
  const email = globalData.email
  const password = globalData.password
  const country = 'ph'
  const windowSizeAndPosition = calcBrowserSizeAndPosition()
  console.log(windowSizeAndPosition)
  if (windowSizeAndPosition && win) {
    const windowSize = windowSizeAndPosition[0]
    const windowPosition = windowSizeAndPosition[1]
    startTiktokWorker(win, email, password, country, windowSize, windowPosition)
  }
})
function randomString(length: number) {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = ''
  for (let i = length; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

// function startWebsocketServer() {
//   wss.on('connection', (ws: WebSocket) => {
//     console.log('New client connected')

//     ws.on('message', (message: string) => {
//       console.log(`Received message: ${message}`)
//       // ws.send(`Server received your message: ${message}`)
//     })

//     ws.on('close', () => {
//       console.log('Client disconnected')
//     })
//   })
//   console.log('webscoket启动')
//   return wss
// }
