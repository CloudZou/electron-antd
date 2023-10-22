import type { CommonEnvVariables, EnvVariables } from '../build/config/env.config'

declare global {
  const nodeRequire: NodeRequire

  type ReactDivProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>

  /** 获取 Promise 返回值 */
  type PromiseReturnType<T> = T extends Promise<infer U> ? U : never

  /** 获取 Promise 返回值 (递归) */
  type PromiseReturnTypeDeep<T> = T extends Promise<infer U>
    ? U extends Promise<unknown>
      ? PromiseReturnType<U>
      : U
    : never

  /** 使用此类型替代 any object */
  interface AnyObj {
    [key: string]: any
  }

  namespace NodeJS {
    /** 环境变量 */
    interface ProcessEnv extends CommonEnvVariables, EnvVariables {}
  }

  type TKAccount = {
    id: number
    email: string
    password: string
    codeApi: string
  }

  interface DataType {
    key: number
    id: number
    name: string
    email: string
    password: string
    tk_password: string
    cookie: string
    status: string
    remarks: string
    registerTime: string
  }

  type AdsPowerResponse = {
    code: number
    data: AnyObj
    msg: string
  }

  type LunaProxyResponse = {
    code: number
    msg: string
    success: boolean
    data: AnyObj[]
  }

  type CaptchaMessage = {
    id: string
    type: string
    content: string
  }

  type CaptchaRecResponse = {
    code: number
    data: AnyObj
  }

  type Size = {
    height: number
    width: number
  }
  type Point = {
    x: number
    y: number
  }
}
