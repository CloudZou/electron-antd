const fsPromise = require('fs/promises')
import * as fs from 'fs'
const path = require('path')
import * as $tools from './utils'
import url from 'url'
import { Md5 } from 'ts-md5'
import { EventEmitter } from 'events'

export class PageInterception {
  public country: string
  public filePath: string
  public captchaPath: string
  public requestIdScriptMap: Map<string, string>
  public requestIdXhrMap: Map<string, string>
  public requestIdImageMap: Map<string, string>
  public eventEmitter: EventEmitter
  public subtype = 'whirl'
  public imagePromiseCount = 0

  constructor(eventEmitter: EventEmitter, country: string) {
    this.eventEmitter = eventEmitter
    this.country = country
    const rootPath = path.join(__dirname, '../')
    this.filePath = rootPath + 'tkjs/' + country + '/'
    this.captchaPath = rootPath + 'tkjs/captcha' + '/'
    this.requestIdScriptMap = new Map()
    this.requestIdXhrMap = new Map()
    this.requestIdImageMap = new Map()
    $tools.mkdirsSync(this.filePath)
    $tools.mkdirsSync(this.captchaPath)
  }

  jsFileMatch(requestUrl: string) {
    const { pathname } = url.parse(requestUrl)
    // return pathname.match(/\.(css|png|svg)$/);
    return pathname?.match(/\.(js)$/)
  }
  captchaFileMath(requestId: string, requestUrl: string) {
    const ret = requestUrl.endsWith('~tplv-obj.image') || requestUrl.indexOf('tplv') > 0
    if (ret) {
      this.requestIdImageMap.set(requestId, requestUrl)
      console.log(requestUrl)
    }
    return ret
  }
  emailSendCodeMatch(requestUrl: string) {
    if (requestUrl.indexOf('passport/web/email/send_code') > 0) {
      return true
    }
    return false
  }
  emailRegisterVerify(requestUrl: string) {
    if (requestUrl.indexOf('web/email/register_verify_login') > 0) {
      return true
    }
    return false
  }

  async startInterception(client: any): Promise<void> {
    const { Network } = client
    await Network.setRequestInterception({
      patterns: [{ urlPattern: '*', interceptionStage: 'Request' }],
    })

    // catch request
    Network.requestIntercepted(async ({ interceptionId, request, requestId, resourceType }: any) => {
      // perform a test against the intercepted request
      const filename = Md5.hashStr(request.url)
      const requestIdString = requestId as string
      const resourceTypeString = resourceType as string
      let body = ''
      switch (resourceTypeString) {
        case 'XHR':
          if (this.emailSendCodeMatch(request.url) || this.emailRegisterVerify(request.url)) {
            this.requestIdXhrMap.set(requestIdString, request.url)
          }
          Network.continueInterceptedRequest({
            interceptionId,
          })
          break
        case 'Image':
          console.log(request.url)
          if (this.captchaFileMath(requestIdString, request.url)) {
            this.requestIdImageMap.set(requestIdString, request.url)
          }
          Network.continueInterceptedRequest({
            interceptionId,
          })
          break
        case 'Script':
          const isExist = fs.existsSync(this.filePath + filename)
          if (isExist) {
            body = fs.readFileSync(this.filePath + filename, { encoding: 'utf8', flag: 'r' })
            const headers = [
              'Access-Control-Allow-Credentials:true',
              'Access-Control-Allow-Headers: X-Mssdk-Info, X-Tt-Passport-Csrf-Token, X-Tt-Passport-Ttwid-Ticket',
              'Access-Control-Allow-Methods: POST',
              'Access-Control-Allow-Origin: https://www.tiktok.com',
              'Access-Control-Max-Age: 86400',
            ]
            const rawStr = 'HTTP/1.1 200 OK\r\n' + headers.join('\r\n') + '\r\n\r\n' + body
            Network.continueInterceptedRequest({
              interceptionId,
              rawResponse: Buffer.from(rawStr).toString('base64'),
            })
          } else {
            Network.continueInterceptedRequest({
              interceptionId,
            })
          }
          this.requestIdScriptMap.set(requestIdString, filename)
          break
        default:
          Network.continueInterceptedRequest({
            interceptionId,
          })
          break
      }
    })

    Network.loadingFailed(async ({ requestId, errorText }: any) => {
      if (this.requestIdXhrMap.has(requestId as string)) {
        console.log(requestId as string)
        console.log(errorText)
      }
    })

    Network.loadingFinished(async ({ requestId }: any) => {
      try {
        const requestIdString = requestId as string
        if (this.requestIdScriptMap.has(requestIdString)) {
          const filename = this.requestIdScriptMap.get(requestIdString)
          const isExist = fs.existsSync(this.filePath + filename)
          if (filename && !isExist) {
            const { body, base64Encoded } = await Network.getResponseBody({ requestId })
            if (base64Encoded) {
              const decodeBody = Buffer.from(body, 'base64').toString('utf-8')
              await fsPromise.writeFile(this.filePath + filename, decodeBody)
            } else {
              console.log('normal:' + filename)
              await fsPromise.writeFile(this.filePath + filename, body)
            }
          }
        }
        if (this.requestIdImageMap.has(requestIdString)) {
          const requestUrl = this.requestIdImageMap.get(requestIdString) || ''
          console.log('loading')
          console.log(requestUrl)
          const filename = Md5.hashStr(requestUrl)
          const { body, base64Encoded } = await Network.getResponseBody({ requestId })
          if (base64Encoded) {
            console.log('图片地址:' + this.requestIdImageMap.get(requestIdString))
            const decodeBody = Buffer.from(body, 'base64')
            await fsPromise.writeFile(this.filePath + filename, decodeBody)
          } else {
            await fsPromise.writeFile(this.filePath + filename, body)
          }

          switch (this.subtype) {
            case 'whirl':
              this.imagePromiseCount++
              if (this.imagePromiseCount == 2) {
                this.eventEmitter.emit('captcha', this.subtype, this.country)
                this.imagePromiseCount = 0
              }
              break
            case '3d':
              this.eventEmitter.emit('captcha', this.subtype, this.country)
              break
            case 'slide':
              this.eventEmitter.emit('captcha', this.subtype, this.country)
              break
            default:
              break
          }
        }

        // 处理发送验证码接口
        if (this.requestIdXhrMap.has(requestIdString)) {
          let decodeBody = ''
          try {
            const { body, base64Encoded } = await Network.getResponseBody({ requestId })
            if (base64Encoded) {
              decodeBody = Buffer.from(body, 'base64').toString('utf-8')
            } else {
              decodeBody = body
            }
          } catch (e) {
            // console.log(e)
            return
          }
          const requestUrl = this.requestIdXhrMap.get(requestIdString) || ''
          if (requestUrl.indexOf('passport/web/email/send_code') > 0) {
            this.handleEmailSendCode(decodeBody)
          }
          if (requestUrl.indexOf('web/email/register_verify_login') > 0) {
            this.handleEmailVerify(decodeBody)
          }
        }
      } catch (err) {
        console.log(err)
      }
    })
  }

  async handleEmailSendCode(decodeBody: string) {
    console.log(decodeBody)
    const ret = JSON.parse(decodeBody)
    if (ret.message == 'error') {
      if (ret.data.error_code == 7) {
        console.log('超过最大次数')
        this.eventEmitter.emit('maxmium-count')
        return
      } else if (ret.data.error_code == 1023) {
        console.log('账号已经注册成功')
      } else {
        console.log('发生验证码事件')
        console.log(decodeBody)
        const verifyData = JSON.parse(ret.data.verify_center_decision_conf)
        console.log(ret.data.verify_center_decision_conf)
        this.subtype = verifyData.subtype as string
      }
    }
    if (ret.message == 'success') {
      // 处理成功
      this.eventEmitter.emit('send-code-success')
    }
  }

  async handleEmailVerify(decodeBody: string) {
    const ret = JSON.parse(decodeBody)
    // console.log(decodeBody)
    if (ret.message == 'error') {
      if (ret.data.error_code == 7) {
        console.log('提交超过最大次数')
        this.eventEmitter.emit('submit-maxmium-count')
        return
      }
      if (ret.data.error_code == 1108) {
        console.log('提交发生验证码事件')
        console.log(decodeBody)
        const verifyData = JSON.parse(ret.data.verify_center_decision_conf)
        console.log(ret.data.verify_center_decision_conf)
        this.subtype = verifyData.subtype as string
      }
    }
    if (ret.message == 'success') {
      // 处理成功
      this.eventEmitter.emit('verify-success')
    }
  }
}
