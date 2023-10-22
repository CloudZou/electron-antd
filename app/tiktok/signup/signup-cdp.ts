import axios from 'axios'
import { TBrowser } from './browser'
import { EmailAccountInfoError } from './errors'
import * as $tools from './utils'
import { PageInterception } from './page-interception'
import * as $cdp from 'taiko'
const assert = require('assert').strict
import { EventEmitter } from 'events'
import { Captcha } from './catpcha'

export class SignupCDP {
  public apiHost = 'http://localhost:5000'
  public browser: TBrowser
  public country: string
  public ws_puppeteer: string
  public pageInterception: PageInterception
  public user_id: string
  public eventEmitter: EventEmitter
  public retryCount: number
  public submitRetryCount: number
  MaxRetryCount = 5
  constructor(country: string) {
    this.eventEmitter = new EventEmitter()
    this.browser = new TBrowser()
    this.country = country
    this.pageInterception = new PageInterception(this.eventEmitter, country)
    this.ws_puppeteer = ''
    this.user_id = ''
    this.retryCount = 0
    this.submitRetryCount = 0
  }

  async preStart(windowSize: string, size: Size, position: Point): Promise<void> {
    // const country = 'us'
    this.user_id = await this.create_user(windowSize)
    if (this.user_id == '') {
      return Promise.reject(new Error('创建用户失败'))
    }
    const debugPort = (await this.browser.start_browserv2(this.user_id, size, position)) as unknown as number
    try {
      // connect to endpoint
      await $cdp.openBrowser({
        host: '127.0.0.1',
        port: debugPort,
      })

      // extract domains
      const { Network, Page } = $cdp.client()

      await this.pageInterception.startInterception($cdp.client())

      $cdp.setConfig({
        navigationTimeout: 60000,
      })

      await $cdp.goto('https://www.tiktok.com/signup/phone-or-email/email', {
        waitForEvents: ['DOMContentLoaded'],
      })
      // await $tools.delay(10000)
      await $cdp.evaluate($cdp.$('tiktok-cookie-banner'), (banner) => {
        // const banner = document.querySelector('tiktok-cookie-banner') || null
        if (banner) {
          const sroot = banner.shadowRoot
          const element = sroot?.querySelector('.button-wrapper > button:nth-child(2)') as HTMLElement
          element.click()
        }
      })

      await this.selectBirthday()
    } catch (err) {
      console.error(err)
    } finally {
    }
  }
  async start(email: string, password: string, tkpassword: string): Promise<void> {
    $tools.notifyMessage({
      email: email,
      content: '开始输入账号密码',
    })
    await this.typeEmailAndPassword(email, tkpassword)
    // eslint-disable-next-line quotes
    await $cdp.focus($cdp.$("button[data-e2e='send-code-button']"))
    // eslint-disable-next-line quotes
    await $cdp.click($cdp.$("button[data-e2e='send-code-button']"))

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this
    this.eventEmitter.on('captcha', async function (subtype: string, country) {
      $tools.notifyMessage({
        email: email,
        content: '自动打码中',
      })
      const captchaInstance = new Captcha(subtype, country)
      await captchaInstance.autoStart()
      _this.retryCount = 0
    })
    this.eventEmitter.on('maxmium-count', async function () {
      if (_this.retryCount < _this.MaxRetryCount) {
        $tools.notifyMessage({
          email: email,
          content: '出现风控，第' + (_this.retryCount + 1) + '次自动重试',
        })
        await $tools.delay(2000)
        // eslint-disable-next-line quotes
        await $cdp.focus($cdp.$("button[data-e2e='send-code-button']"))
        // eslint-disable-next-line quotes
        await $cdp.click($cdp.$("button[data-e2e='send-code-button']"))
        _this.retryCount++
      } else {
        $tools.notifyMessage({
          email: email,
          content: '注册失败',
        })
        console.log('连续点击五次后，还是出现最大次数，则退出')
      }
    })
    this.eventEmitter.on('submit-maxmium-count', async function () {
      if (_this.submitRetryCount < _this.MaxRetryCount) {
        $tools.notifyMessage({
          email: email,
          content: '出现风控，第' + (_this.retryCount + 1) + '次提交注册自动重试',
        })
        await $tools.delay(2000)
        // eslint-disable-next-line quotes
        await $cdp.focus($cdp.$("button[type='submit']"))
        await $tools.delay(1000)
        // eslint-disable-next-line quotes
        await $cdp.click($cdp.$("button[type='submit']"))
        _this.submitRetryCount++
      } else {
        console.log('连续点击五次提交后，还是出现最大次数，则退出')
      }
    })

    this.eventEmitter.on('send-code-success', async function () {
      $tools.notifyMessage({
        email: email,
        content: '获取邮箱验证码中...',
      })
      const code = await _this.get_email_code(email, password)
      $tools.notifyMessage({
        email: email,
        content: '获取验证码成功',
      })
      await _this.typeEmailCode(code)
      await $tools.delay(2000)
      // eslint-disable-next-line quotes
      await $cdp.focus($cdp.$("button[type='submit']"))
      await $tools.delay(1000)
      // eslint-disable-next-line quotes
      await $cdp.click($cdp.$("button[type='submit']"))
    })

    this.eventEmitter.on('verify-success', async function () {
      console.log('开始获取cookie')
      const cookies = await $cdp.getCookies()
      $tools.notifyMessage({
        email: email,
        content: '获取cookie成功',
        success: true,
        cookies: JSON.stringify(cookies),
      })
      console.log(cookies)
    })
  }

  async typeEmailCode(code: string): Promise<void> {
    // eslint-disable-next-line quotes
    await $cdp.focus($cdp.$(".code-input>input[type='text']"))
    for (const i of code) {
      await $cdp.press(i)
      await $tools.delay(5)
    }
  }

  async typeEmailAndPassword(email: string, password: string): Promise<void> {
    // eslint-disable-next-line quotes
    await $cdp.focus($cdp.$("input[name='email']"))
    for (const i of email) {
      await $cdp.press(i)
      await $tools.delay(10)
    }

    await $tools.delay(2000)

    // eslint-disable-next-line quotes
    await $cdp.focus($cdp.$("input[type='password']"))
    for (const i of password) {
      await $cdp.press(i)
      await $tools.delay(10)
    }
    await $tools.delay(2000)
  }

  async clickElementByDomJS(selector: string) {
    return await $cdp.evaluate($cdp.$(selector), (element) => {
      element.click()
    })
  }
  async clickElementByNative(selector: string) {
    await $cdp.focus($cdp.$(selector))
    await $tools.delay(500)
    await $cdp.click($cdp.$(selector))
    await $tools.delay(1000)
  }

  async get_email_code(email: string, password: string): Promise<string> {
    let count = 10
    while (count > 0) {
      console.log('获取验证码中')
      try {
        const res = await axios.get<string>(this.apiHost + '/ecode/' + email + '/' + password)
        const code = res.data
        console.log('验证码:' + JSON.stringify(code))
        const c = parseInt(code['code'])
        if (!isNaN(c)) {
          if (c == -1) {
            console.log('该邮箱账密错误，停止注册退出')
            return Promise.reject(new EmailAccountInfoError('账密错误'))
          }
          console.log('获取到验证码:' + code['code'])
          return Promise.resolve(code['code'])
        } else {
          await $tools.delay(3000)
          count = count - 1
        }
      } catch (e) {
        console.log('获取验证码错误，重试中...')
        count = count - 1
      }
    }
    return Promise.reject(new EmailAccountInfoError('获取邮箱验证码失败'))
  }

  async selectBirthday(): Promise<void> {
    // eslint-disable-next-line quotes
    await this.clickElementByNative("#loginContainer div[data-e2e='select-container']:nth-child(1)")
    await this.clickElementByNative('#Month-options-item-3')

    // await $cdp
    // eslint-disable-next-line quotes
    await this.clickElementByNative("#loginContainer div[data-e2e='select-container']:nth-child(2)")
    await this.clickElementByNative('#Day-options-item-3')

    // eslint-disable-next-line quotes
    await this.clickElementByNative("#loginContainer div[data-e2e='select-container']:nth-child(3)")
    await this.clickElementByNative('#Year-options-item-25')
  }
  async stop(): Promise<void> {
    await this.browser.stop_browser(this.user_id)
  }

  async create_user(windowSize: string): Promise<string> {
    const proxyInfo = await this.getLunaProxyIp(this.country)
    const user_proxy_config: AnyObj = {
      proxy_soft: 'other',
      proxy_type: 'http',
      // "proxy_host": "proxysg.rola.vip",
      proxy_host: proxyInfo['ip'],
      proxy_port: proxyInfo['port'],
      proxy_user: '',
      proxy_password: '',
    }
    const profileData = await this.browser.create_profile(
      this.country,
      this.browser.random_fingerprint('en-US', windowSize),
      user_proxy_config
    )
    console.log(profileData)
    // let user_id ="jarkvum"
    let user_id = ''
    if (profileData.code == 0 && profileData.data['id']) {
      user_id = profileData.data['id']
    }
    return Promise.resolve(user_id)
  }

  async getLunaProxyIp(country: string): Promise<AnyObj> {
    const res = await axios.get<LunaProxyResponse>(
      'https://tq.lunaproxy.com/getflowip?neek=1112243&num=1&type=2&sep=1&regions=' +
        country +
        '&ip_si=1&level=1&sb='
    )
    // console.log(res)
    if (res.data.code == 0) {
      return Promise.resolve(res.data.data[0])
    } else {
      console.log(res.data)
      return Promise.reject(new Error('获取Luna代理失败'))
    }
  }
}
