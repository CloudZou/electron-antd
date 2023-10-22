import { SignupCDP } from './signup/signup-cdp'
import * as $tools from './signup/utils'

export function startAutoRegister(
  email: string,
  password: string,
  country: string,
  windowSize: Size,
  windowPosition: Point
) {
  ;(async (email: string, password: string, country: string, windowSize: Size, windowPosition: Point) => {
    const signup = new SignupCDP(country)

    $tools.notifyMessage({
      email: email,
      content: '打开浏览器中...',
    })
    await signup.preStart(windowSize.width + '_' + windowSize.height, windowSize, windowPosition)
    $tools.notifyMessage({
      email: email,
      content: '打开浏览器成功',
    })
    console.log('email:' + email)
    console.log('password:' + password)
    await signup.start(email, password, 'Pa$$word123456')
    // await signup.stop()
  })(email, password, country, windowSize, windowPosition)
}
