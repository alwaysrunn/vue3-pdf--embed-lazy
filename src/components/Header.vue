<script setup lang="ts">
import { UserOutlined, BellFilled } from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'
import { logout } from '@/api/login'
import type { MenuItem } from '@/api/types/login'
import { useUserStore } from '@/stores/user'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const menuList = ref([
  { permName: '文档库', path: '/doc-library' },
  { permName: '知识问答', path: '/qa' }
])
const curMenuIdx = ref(0);
const userInfo = computed(() => userStore.userInfo)

const handleTab = (it: MenuItem, idx: number) => {
  curMenuIdx.value = idx;
  router.push(it.path)
}
const handleLogout = () => {
  Modal.confirm({
    title: '温馨提醒',
    content: '是否确认退出系统?',
    centered: true,
    okText: '确定',
    cancelText: '取消',
    onCancel() { },
    onOk() {
      logout().then(async (res) => {
        if (res) {
          await router.push('/login')
          userStore.setAuthorization('')
          userStore.setUserInfo({})
          localStorage.removeItem('token')
        }
      })
    }
  })
}

watch(() => route.path, (v) => {
  let index = menuList.value.findIndex(it => v.includes(it.path));
  index > -1 && (curMenuIdx.value = index);
}, {
  immediate: true
})

</script>

<template>
  <main class="w-full h-[56px] bg-white flex items-center flex-shrink-0 header-box">
    <div class="w-[300px] pl-[28px]">
      <img src="@/assets/img/login/logo.png" alt="" class="h-[24px]" />
    </div>
    <ul class="flex-1 flex mb-0">
      <li v-for="(it, idx) in menuList" :key="it.permName" class="menu-item" :class="[{ active: idx === curMenuIdx }]"
        @click="handleTab(it, idx)">
        {{ it.permName }}
      </li>
    </ul>
    <div class="pr-[16px]">
      <a-dropdown placement="bottomRight">
        <div class="avatar">
          <UserOutlined />
        </div>
        <template #overlay>
          <a-menu>
            <a-menu-item>
              <div class="flex items-center px-[20px] py-[20px]">
                <div class="avatar">
                  <UserOutlined />
                </div>
                <span class="ml-[8px]">{{ userInfo.personName }}</span>
              </div>
            </a-menu-item>
            <a-menu-divider />
            <a-menu-item>
              <div class="link text-center py-[6px]">修改密码</div>
            </a-menu-item>
            <a-menu-item>
              <div class="link text-center py-[6px]" @click="handleLogout">退出登录</div>
            </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
  </main>
</template>

<style lang="less" scoped>
@import '@/assets/common.less';

.header-box {
  border-bottom: 1px solid rgb(230, 230, 230);
}

.info {
  width: 32px;
  height: 32px;
  font-size: 22px;
  color: #d3d3d3;
  text-align: center;
  line-height: 32px;
}

.avatar {
  width: 32px;
  height: 32px;
  background: #0052d9;
  border-radius: 50%;
  font-size: 20px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-item {

  line-height: 52px;
  padding: 0 36px;
  font-size: 16px;
  font-weight: 400;

  &:not(:nth-last-of-type(1)) {
    margin-right: 20px;
  }

  &:hover,
  &.active {
    cursor: pointer;
    color: @color-info-1;
    border-bottom: 4px solid @color-primary-1;
    font-weight: 600;
  }
}
</style>
