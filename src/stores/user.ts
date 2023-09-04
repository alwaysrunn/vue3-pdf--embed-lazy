import { acceptHMRUpdate, defineStore } from 'pinia'
import type { MenuItem, UserInfo } from '@/api/types/login'


export const useUserStore = defineStore('user', () => {
  const authorization = ref('')
  const userInfo = ref({} as UserInfo)
  const username = ref('')
  const headTabIdx = ref(0)
  const menuList = ref(<MenuItem[]>[])
  const menuTabId = ref(<number[]>[])

  // 获取一级, 二级菜单id
  const getFirstMenuTabId = computed(() => menuTabId.value[0])
  const getSidebarMenuTabId = computed(() => menuTabId.value[1])

  // 获取侧边栏列表
  const getSidebarList = computed(() => {
    const menu = unref(menuList).find((it: MenuItem) => it.id === menuTabId.value[0])
    return menu ? menu.children : []
  })

  // Authorization
  function setAuthorization(val: string) {
    authorization.value = val
  }
  // 用户名
  function setUsername(val: string) {
    username.value = val
  }
  // 用户信息
  function setUserInfo(val: UserInfo) {
    userInfo.value = val
  }
  // 权限信息
  function setMenuList(val: MenuItem[]) {
    menuList.value = val
  }
  // 头部tab索引
  function setHeadTabIdx(val: number) {
    headTabIdx.value = val
  }
  // 设置一级菜单id
  function setFirstMenuTabId(val: number) {
    menuTabId.value[0] = val
  }
  // 设置二级菜单id
  function setSidebarMenuTabId(val: number) {
    menuTabId.value[1] = val
  }

  return {
    authorization,
    userInfo,
    menuList,
    username,
    headTabIdx,
    menuTabId,

    getFirstMenuTabId,
    getSidebarMenuTabId,
    getSidebarList,

    setAuthorization,
    setUserInfo,
    setMenuList,
    setUsername,
    setHeadTabIdx,
    setFirstMenuTabId,
    setSidebarMenuTabId,
  }
}, {
  persist: {
    enabled: true,
  },
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot))
