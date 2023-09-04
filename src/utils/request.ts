import axios from 'axios';
import { message } from 'ant-design-vue';
import { useUserStore } from '@/stores/user';
import { isNil } from 'lodash';
import router from '@/router/index'
// const userStore = useUserStore()
// const authorization = ref(userStore.authorization)
// console.log('bbbbbbb', pinia, userStore, userStore.authorization.value, authorization.value, '-------')

const pendingMap = new Map()

const LoadingInstance = {
  _target: null,
  _count: 0,
}

function myAxios<T>(axiosConfig: any, customOptions?: any, loadingOptions?: any): Promise<T> {
  const service = axios.create({
    baseURL: '/zjzb', // 设置统一的请求前缀
    timeout: 100000, // 设置统一的超时时长
  })

  // 自定义配置
  const custom_options = Object.assign({
    repeat_request_cancel: true, // 是否开启取消重复请求, 默认为 true
    loading: false, // 是否开启loading层效果, 默认为false
    error_message_show: true, // 是否开启接口错误信息展示,默认为true
    code_message_show: true, // 是否开启code不为0时的信息提示, 默认为false
  }, customOptions)

  // 请求拦截
  service.interceptors.request.use(
    (config) => {
      removePending(config)
      custom_options.repeat_request_cancel && addPending(config)
      // 创建loading实例
      if (custom_options.loading) {
        LoadingInstance._count++
        if (LoadingInstance._count === 1)
          // LoadingInstance._target = ElLoading.service(loadingOptions)
          console.log(1)
      }
      if (config.method?.toLocaleLowerCase() === 'get') {
        config.params = {
          ...config.params,
          _t: new Date().getTime(),
        }
      }

      // 自动携带token
      const authorization = localStorage.getItem('token');
      if (authorization && typeof window !== 'undefined') {
        config.headers.Authorization = authorization;
      }
        
      return config
    },
    (error) => {
      return Promise.reject(error)
    },
  )

  // 响应拦截
  service.interceptors.response.use(
    (response) => {
      // removePending(response.config)
      custom_options.loading && closeLoading(custom_options) // 关闭loading
      //只返回data的特殊情况
      if (response.data && !response.data.code && !response.data.data) {
        return response.data;
      }
      
      if (custom_options.code_message_show && response.data && response.data?.code !== 200) {
        message.error(response.data.message)
        return Promise.reject(response.data) // code不等于0, 页面具体逻辑就不执行了
      }
      // return !isNil(response.data?.data) ?  response.data?.data : response.data
      return typeof response.data === 'object' && response.data.hasOwnProperty('data') ? response.data.data : response.data;

    },
    (error) => {
      error.config && removePending(error.config)
      custom_options.loading && closeLoading(custom_options) // 关闭loading
      custom_options.error_message_show && httpErrorStatusHandle(error) // 处理错误状态码
      return Promise.reject(error) // 错误继续返回给到具体页面
    },
  )

  return service(axiosConfig)
}

export default myAxios

/**
 * 处理异常
 * @param {*} error
 */
function httpErrorStatusHandle(error: any) {
  // 处理被取消的请求
  if (axios.isCancel(error))
    return console.error(`请求的重复请求：${error.message}`)
  let msg = ''
  if (error && error.response) {
    switch (error.response.status) {
      case 302: msg = '接口重定向了！'; break
      case 400: msg = '参数不正确！'; break
      case 401: msg = '您未登录，或者登录已经超时，请先登录！'; break
      case 403:
        msg = '您没有权限操作！';
        localStorage.removeItem('token');
        router.push('/login');
        break
      case 404: msg = `请求地址出错: ${error.response.config.url}`; break // 在正确域名下
      case 408: msg = '请求超时！'; break
      case 409: msg = '系统已存在相同数据！'; break
      case 500: msg = '服务器内部错误！'; break
      case 501: msg = '服务未实现！'; break
      case 502: msg = '网关错误！'; break
      case 503: msg = '服务不可用！'; break
      case 504: msg = '服务暂时无法访问，请稍后再试！'; break
      case 505: msg = 'HTTP版本不受支持！'; break
      default: msg = '异常问题，请联系管理员！'; break
    }
  }
  if (error.message.includes('timeout'))
    msg = '网络请求超时！'
  if (error.message.includes('Network'))
    msg = window.navigator.onLine ? '服务端异常！' : '您断网了！'

  message.error(msg)
}

/**
 * 关闭Loading层实例
 * @param {*} _options
 */
function closeLoading(_options: any) {
  if (_options.loading && LoadingInstance._count > 0)
    LoadingInstance._count--
  if (LoadingInstance._count === 0) {
    // LoadingInstance._target.close()
    LoadingInstance._target = null
  }
}

/**
 * 储存每个请求的唯一cancel回调, 以此为标识
 * @param {*} config
 */
function addPending(config: any) {
  const pendingKey = getPendingKey(config)
  config.cancelToken = config.cancelToken || new axios.CancelToken((cancel) => {
    if (!pendingMap.has(pendingKey))
      pendingMap.set(pendingKey, cancel)
  })
}

/**
 * 删除重复的请求
 * @param {*} config
 */
function removePending(config: any) {
  const pendingKey = getPendingKey(config)
  if (pendingMap.has(pendingKey)) {
    const cancelToken = pendingMap.get(pendingKey)
    // 如你不明白此处为什么需要传递pendingKey可以看文章下方的补丁解释
    cancelToken(pendingKey)
    pendingMap.delete(pendingKey)
  }
}

/**
 * 生成唯一的每个请求的唯一key
 * @param {*} config
 * @returns
 */
function getPendingKey(config: any) {
  let { url, method, params, data } = config
  if (typeof data === 'string' && !data.includes('='))
    data = JSON.parse(data) // response里面返回的config.data是个字符串对象
  return [url, method, JSON.stringify(params), JSON.stringify(data)].join('&')
}
