import { Worker, isMainThread, parentPort, workerData } from 'worker_threads'
import { logger } from './signup/logger'
import * as signup from './signup/index'
import { startAutoRegister } from './tiktok-worker'
// @ts-ignore
global.__$log = logger

const email = workerData.email
const password = workerData.password
const country = workerData.country
const size = {
  width: workerData.width,
  height: workerData.height,
}
const position = {
  x: workerData.x,
  y: workerData.y,
}

startAutoRegister(email, password, country, size, position)
