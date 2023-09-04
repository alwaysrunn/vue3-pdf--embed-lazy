<script setup lang="ts">

import { fileDownload } from '@/api/doc'
import { Empty } from 'ant-design-vue'
import { useRoute } from 'vue-router'
import { queryFileByreportId, saveOrUpdateOpinion, downloadUrlContent } from '@/api/doc'
import { useOpinionStore } from '@/stores/opinion'
import type { BasicItem, UrlContentParam } from '@/api/types/doc'
import { FileTypeEnum } from '@/utils/enums/type'
import { message } from 'ant-design-vue'
import IconDelete from '@/components/icons/IconDelete.vue'
import VDrag from '@/components/VDrag.vue';
import IconWarning from './icons/IconWarning.vue'

import PdfIndex from '@/views/Model/PdfIndex.vue';
import UrlIndex from '@/views/Model/UrlIndex.vue';

// const PdfIndex = () => import('@/views/Model/PdfIndex.vue')
// const UrlIndex = () => import('@/views/Model/UrlIndex.vue')

const opinionStore = useOpinionStore()
const props = defineProps({
  list: {
    type: Array,
    default: () => []
  },
  // 段子id
  id: {
    type: Number
  }
})

const route = useRoute()
const curIdx = ref(0)
const curFileType = ref(-1)
const pdfMark = ref(null)
const state = reactive({
  simpleImage: Empty.PRESENTED_IMAGE_SIMPLE,
  draftList: [],
  basicIdx: 0,
  fileName: '',
  isLoading: false,
})
const basicWidth = ref<number>(350);

const pdfInfo = reactive({
  stream: null,
  fileName: null,
  fileCode: null
})

const urlContent = ref("")
const tipMsg = ref('如需手动添加依据，可从右侧底稿中选取相关段落')

const fileCompMap = computed(() => (key: FileTypeEnum) => {
  if (key == 1) {
    return {
      comp: PdfIndex,
      flag: pdfInfo.stream,
      info: pdfInfo,
      other: pdfMark.value
    }
  }
  if (key == 2) {
    return {
      comp: UrlIndex,
      flag: urlContent.value,
      info: urlContent.value,
      other: null
    }
  }
})


function onClick(it: BasicItem, idx: number) {
  console.log('it', it)
  if (!it) return
  curIdx.value = idx;
  curFileType.value = it.type;

  baseTypeRenderFile(it);
}


function baseTypeRenderFile(it: BasicItem) {
  opinionStore.setCurFileAttr({
    fileCode: it.fileCode,
    fileName: it.fileName,
    type: it.type,
  })
  if (it.type == FileTypeEnum.PDF) {
    pdfMark.value = it
    pdfInfo.fileName = it.fileName
    pdfInfo.fileCode = it.fileCode
    getPdfStream(it.fileCode)
  }

  if (it.type == FileTypeEnum.URL) {
    getUrlContent(it)
  }
}


function getUrlContent(it: BasicItem) {
  state.isLoading = true;
  downloadUrlContent({
    id: it.fileCode,
    htmlPositions: it.htmlPositions
  }).then(res => {
    res && (urlContent.value = res)
  }).finally(() => {
    state.isLoading = false;
  })
}

function getPdfStream(code: number) {
  if (!code) {
    pdfInfo.stream = null
    return
  }
  state.isLoading = true;
  fileDownload({ id: code }).then((res) => {
    pdfInfo.stream = res
  }).finally(() => {
    state.isLoading = false;
  })
}

function getBasicList() {
  const params = {
    reportId: route.params.id
  }
  queryFileByreportId(params).then((res) => {
    state.draftList = res
  })
}

function tabClick(it: BasicItem, idx: number) {
  console.log('it', it)
  state.basicIdx = idx
  curFileType.value = it.type;
  it.fileCode = it.id;

  baseTypeRenderFile(it);

}

function delBasic(it: BasicItem, idx: number) {
  opinionStore.delBasic(it)
  saveOrUpdateOpinion(opinionStore.curOpinion).then((res) => {
    if (res) {
      message.success('删除依据成功')
      let finalIndex = idx >= opinionStore.sourceList.length ? (idx - 1) : idx;
      onClick(opinionStore.sourceList[finalIndex], finalIndex)
    } else {
      message.error('删除依据失败')
    }
  })
}

function widthChange(v) {
  basicWidth.value -= v;
  if (basicWidth.value < 240) {
    basicWidth.value = 240;
  }
  if (basicWidth.value > 800) {
    basicWidth.value = 800;
  }
}

watch(
  () => props.list,
  (val) => {
    val && onClick(val[0], 0)
  },
  {
    immediate: true,
    deep: true
  }
)

onMounted(() => {
  getBasicList()
})
</script>

<template>
  <main class="w-full h-full flex">
    <div class="w-[350px] h-full flex flex-col line relative" :style="{ width: basicWidth + 'px' }">
      <div class="flex items-center px-[24px] mt-[20px]">
        <div class="bar-vertical">依据</div>
        <a-tooltip>
          <template #title>
            <span>{{ tipMsg }}</span>
          </template>
          <div class="icon">
            <IconWarning />
          </div>
        </a-tooltip>
        <div class="text-[14px] ml-auto">该句子依据如下</div>
      </div>
      <div v-if="opinionStore.sourceList && opinionStore.sourceList.length"
        class="flex-1 overflow-auto mt-[18px] pb-[16px]">
        <div v-for="(it, idx) in opinionStore.sourceList" :key="it.id" :class="['basic', { active: curIdx == idx }]"
          @click="onClick(it, idx)">
          <div class="bar-vertical sm truncate text-gray-5 mb-[12px]" :class="`file${it.type}`">{{ it.fileName }}</div>
          <div>
            <span class="break-all">{{ it.content }}</span>
            <a-popconfirm title="是否删除该依据" @confirm="delBasic(it, idx)">
              <span class="del-icon">
                <IconDelete />
              </span>
            </a-popconfirm>

          </div>
        </div>
      </div>
      <div v-else class="mt-[48px]">
        <a-empty :image="state.simpleImage">
          <template #description>
            <span>该观点未找到依据</span><br>
            <span>{{ tipMsg }}</span>
          </template>
        </a-empty>
      </div>
      <VDrag @widthChange="widthChange" class="absolute top-0 right-0" />
    </div>
    <div class="flex-1 overflow-auto flex flex-col">
      <div class="flex items-center px-[24px] mt-[20px]">
        <div class="bar-vertical">底稿</div>
        <div class="flex-1 text-[14px] ml-[10px] flex bg-gray-6">
          <div v-for="(it, idx) in state.draftList" :key="it.id"
            class="w-[92px] truncate cursor-pointer px-[6px] py-[4px]"
            :class="[{ active: opinionStore.curFileAttr.fileName == it.fileName }]" @click="tabClick(it, idx)">
            <span :class="['bar-vertical', 'sm', `file${it.type}`]">{{ it.fileName }}</span>
          </div>
        </div>
      </div>
      <div class="flex-1 overflow-auto w-full h-full mt-[18px]">
        <div v-if="state.isLoading" class="w-full h-[200px] flex justify-center items-center">
          <a-spin size="large" />
        </div>
        <component v-else-if="fileCompMap(curFileType)?.flag" :is="fileCompMap(curFileType)?.comp"
          :info="fileCompMap(curFileType)?.info" :other="fileCompMap(curFileType)?.other"></component>

        <div v-else class="mt-[48px]">
          <a-empty :image="state.simpleImage" description="暂无数据" />
        </div>
      </div>
    </div>
  </main>
</template>
<style lang="less" scoped>
@import '@/assets/common.less';


.basic {
  border-radius: 4px;
  margin: 0 24px;
  padding: 14px;
  background: #f7f8fc;
  cursor: pointer;

  &:not(:nth-of-type(1)) {
    margin-top: 10px;
  }

  &:hover {
    .del-icon {
      display: inline-block;
    }
  }

  &.active {
    color: @color-primary-1;
  }

  &-item {
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .del-icon {
    display: none;
    margin-left: 10px;
  }
}

.line {
  border-left: 1px solid @color-gray-2;
  border-right: 1px solid @color-gray-2;
}

.icon {
  width: 18px;
  height: 18px;
  margin-left: 4px;
  cursor: pointer;
  color: rgb(128, 128, 128);

  &:hover,
  &.active {
    color: @color-primary-1;
  }
}

.active {
  color: @color-primary-1;
  // background: rgba(203, 208, 250, 0.3);
  background: rgba(233, 235, 254, 0.3);
}
</style>
