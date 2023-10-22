const fsPromise = require('fs/promises')
import * as fs from 'fs'
const path = require('path')
import * as $tools from './utils'
import url from 'url'
import { Md5 } from 'ts-md5'
import { EventEmitter } from 'events'
import * as $cdp from 'taiko'
import axios, { AxiosError } from 'axios'
import FormData from 'form-data'

export class Captcha {
  public subtype: string
  public filePath: string
  constructor(subtype: string, country: string) {
    this.subtype = subtype
    const rootPath = path.join(__dirname, '../')
    this.filePath = rootPath + 'tkjs/' + country + '/'
  }
  async autoStart(): Promise<void> {
    switch (this.subtype) {
      case 'whirl':
        this.autoWhirl()
        break
      case 'slide':
        this.autoSlide()
        break
      case '3d':
        this.auto3D()
        break
      default:
        console.log('error 验证码')
    }
  }
  async autoSlide(): Promise<void> {}
  async autoWhirl(): Promise<void> {
    let data = {}
    const apiPostUrl = 'http://www.bingtop.com/ocr/upload/'
    const apiUsername = 'cloudzou'
    const apiPassword = 'Pa$$word123456'
    let count = 5
    while (count > 0) {
      try {
        await $cdp.waitFor($cdp.$('#captcha_container img:nth-child(1)'))
        const imageSrc = (await $cdp.evaluate(() => {
          return (document.querySelector('#captcha_container img:nth-child(1)') as HTMLImageElement).src
        })) as string
        const image2Src = (await $cdp.evaluate(() => {
          return (document.querySelector('#captcha_container img:nth-child(3)') as HTMLImageElement).src
        })) as string
        const imageBase64 = await this.getImageBase64FromUrl(imageSrc)
        const image2Base64 = await this.getImageBase64FromUrl(image2Src)
        data = {
          username: apiUsername,
          password: apiPassword,
          captchaData: imageBase64,
          subCaptchaData: image2Base64,
          captchaType: 1122,
        }
        const res = await axios.post<CaptchaRecResponse>(apiPostUrl, data)
        console.log(res.data)
        if (res.data.code == 0) {
          const angle = res.data.data['recognition']
          const distance = ((340 - 64) * angle) / 180
          console.log('距离:' + distance)
          await this.executeMoveTracks(distance)
        }
        break
      } catch (e: unknown) {
        console.log('刷新图片内容')
        count--
        await $cdp.focus($cdp.$('.secsdk_captcha_refresh--text'))
        await $cdp.click($cdp.$('.secsdk_captcha_refresh--text'))
      }
    }
  }

  async executeMoveTracks(distance: number) {
    const sliderInfo = await $cdp.evaluate($cdp.$('.secsdk-captcha-drag-icon'), (element) => {
      return {
        x: element.getBoundingClientRect().x,
        y: element.getBoundingClientRect().y,
      }
    })
    console.log('元素找到了')
    console.log(sliderInfo)
    if (sliderInfo?.x && sliderInfo?.y) {
      const x = sliderInfo?.x + 2
      const y = sliderInfo?.y
      await $cdp.mouseAction('move', { x: x, y: y })
      await $tools.delay(500)
      await $cdp.mouseAction('press', { x: x, y: y })
      await $tools.delay(100)
      const gen = this.moveTracks(distance)
      let actualDistance = 0
      // @ts-ignore
      for (const ret of gen) {
        actualDistance = ret - 0.1
        await $cdp.mouseAction(
          'move',
          { x: sliderInfo.x + ret - 0.1, y: sliderInfo.y },
          {
            waitForNavigation: false,
          }
        )
      }
      await $cdp.mouseAction('release', { x: sliderInfo.x + actualDistance, y: y })
    }
  }

  *moveTracks(dis: number) {
    const trace: number[] = []
    const t0 = 0.2
    let curr = 0
    let step = 0
    const a = 0.8
    while (curr < dis) {
      const t = t0 * ++step
      curr = parseFloat(((1 / 2) * a * t * t).toFixed(2))
      trace.push(curr)
    }
    for (let i = 0; i < trace.length; ++i) {
      yield trace[i]
    }
  }

  async getImageBase64FromUrl(url: string): Promise<string> {
    const filename = Md5.hashStr(url)
    console.log('验证一侧:' + url)
    console.log(filename)
    console.log('读文件')
    const body = fs.readFileSync(this.filePath + filename)
    return body.toString('base64')
  }
  async auto3D(): Promise<void> {
    const data = new FormData()

    let count = 5
    while (count > 0) {
      try {
        await $cdp.waitFor($cdp.$('#captcha_container img:nth-child(1)'))
        const imageSrc = (await $cdp.evaluate(() => {
          return (document.querySelector('#captcha_container img:nth-child(1)') as HTMLImageElement).src
        })) as string
        const imageBase64 = await this.getImageBase64FromUrl(imageSrc)
        console.log('image base64')
        console.log(imageBase64)
        data.append('image', imageBase64)
        await this.getCoordinateAndExecuteMove(data)
        break
      } catch (e: unknown) {
        console.log('刷新图片内容')
        count--
        await $cdp.focus($cdp.$('.secsdk_captcha_refresh--text'))
        await $cdp.click($cdp.$('.secsdk_captcha_refresh--text'))
      }
    }
  }
  async getCoordinateAndExecuteMove(data: FormData) {
    const apiPostUrl = 'http://localhost:5000/3d'
    const res = await axios.post(apiPostUrl, data, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    if (res.data.length == 0) {
      console.log('识别失败')
    } else {
      const first = res.data[0]
      const second = res.data[1]
      const imageRectInfo = await $cdp.evaluate($cdp.$('#captcha-verify-image'), (element) => {
        return {
          x: element.getBoundingClientRect().x,
          y: element.getBoundingClientRect().y,
        }
      })

      console.log(imageRectInfo)
      let offsetX = first[0] * 0.615
      let x = imageRectInfo.x || 0
      console.log(x + offsetX)
      let offsetY = first[1] * 0.616
      let y = imageRectInfo.y || 0
      await $cdp.mouseAction('press', { x: x + offsetX, y: y + offsetY })
      await $tools.delay(1000)

      offsetX = second[0] * 0.615
      x = imageRectInfo?.x || 0
      console.log(x + offsetX)
      offsetY = second[1] * 0.616
      y = imageRectInfo?.y || 0
      await $cdp.mouseAction('press', { x: x + offsetX, y: y + offsetY })
      await $tools.delay(1000)
      await $cdp.focus($cdp.$('.verify-captcha-submit-button'))
      await $tools.delay(1000)
      await $cdp.click($cdp.$('.verify-captcha-submit-button'))
    }
  }
}
