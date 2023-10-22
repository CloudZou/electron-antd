// const puppeteer = require('puppeteer-extra');
import puppeteer from 'puppeteer-extra'
import { Browser } from 'puppeteer'
import axios from 'axios'
const fsPromise = require('fs/promises')
import { logger } from './logger'

export class TBrowser {
  public host: string
  public ws_puppeteer: string
  constructor() {
    this.host = 'http://localhost:50325'
    this.ws_puppeteer = ''
  }

  async start_browserv2(user_id: string, size: Size, position: Point): Promise<string> {
    const launchArgs =
      '["--window-position=' +
      position.x +
      ',' +
      position.y +
      '","--blink-settings=imagesEnabled=true","--window-size=' +
      size.width +
      ',' +
      size.height +
      '","--disable-notifications"]'
    console.log(
      this.host + '/api/v1/browser/start?user_id=' + user_id + '&' + 'launch_args=' + launchArgs + '&ip_tab=1'
    )
    const res = await axios.get<AdsPowerResponse>(
      this.host + '/api/v1/browser/start?user_id=' + user_id + '&' + 'launch_args=' + launchArgs + '&ip_tab=1'
    )
    const response = res.data

    console.log(JSON.stringify(response))
    return response.data['debug_port']
  }
  async start_browser(user_id: string, size: Size, position: Point): Promise<Browser> {
    const launchArgs =
      '["--window-position=' +
      position.x +
      ',' +
      position.y +
      '","--blink-settings=imagesEnabled=true","--window-size=' +
      size.width +
      ',' +
      size.height +
      '","--disable-notifications"]'
    console.log(
      this.host + '/api/v1/browser/start?user_id=' + user_id + '&' + 'launch_args=' + launchArgs + '&ip_tab=1'
    )
    const res = await axios.get<AdsPowerResponse>(
      this.host + '/api/v1/browser/start?user_id=' + user_id + '&' + 'launch_args=' + launchArgs + '&ip_tab=1'
    )
    const response = res.data

    console.log(JSON.stringify(response))
    logger.info(response.data['ws'])
    logger.info(response.data['ws']['puppeteer'])
    logger.info(response['code'])
    if (response['code'] == 0 && response.data['ws'] && response.data['ws']['puppeteer']) {
      this.ws_puppeteer = response.data['ws']['puppeteer']
      return await puppeteer.connect({
        browserWSEndpoint: response.data['ws']['puppeteer'],
        defaultViewport: null,
      })
    }
    return Promise.reject(new Error('启动失败'))
  }
  async stop_browser(user_id: string): Promise<void> {
    try {
      const res = await axios.get<AdsPowerResponse>(this.host + '/api/v1/browser/stop?user_id=' + user_id)
      logger.info(res.data)
    } catch (e) {
      logger.error(e)
    }
  }

  async create_profile(
    country: string,
    fingerprint_config: AnyObj,
    proxy_config: AnyObj
  ): Promise<AdsPowerResponse> {
    const payload = {
      name: 'test',
      group_id: '0',
      repeat_config: ['0'],
      country: country,
      fingerprint_config: fingerprint_config,
      user_proxy_config: proxy_config,
    }
    const res = await axios.post<AdsPowerResponse>(this.host + '/api/v1/user/create', payload, {
      headers: { 'Content-Type': 'application/json' },
    })
    return res.data
  }
  random_fingerprint(language: string, windowSize: string): AnyObj {
    return {
      language: ['en-US', 'en'],
      flash: 'block',
      scan_port_type: '1',
      // screen_resolution: windowSize,
      allow_scan_ports: ['4000', '4001'],
      fonts: ['all'],
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
      location_switch: '1',
      location: 'block',
      longitude: '181',
      latitude: '92',
      webrtc: 'disabled',
      do_not_track: 'true',
      hardware_concurrency: 'default',
      device_memory: 'default',
      random_ua: { ua_browser: ['chrome'], ua_version: ['116'], ua_system_version: ['Windows 10'] },
      browser_kernel_config: { version: '116', type: 'chrome' },
    }
  }
}
