<script setup lang="ts">
import { getReportPoint, queryReport, saveOrUpdateOpinion } from '@/api/doc'
import { Empty, message } from 'ant-design-vue'
import { getPosition, createDashedLineSvg } from '@/utils/fun'
import { useRoute } from 'vue-router'
import type { ReportParams } from '@/api/types/doc'
import { useOpinionStore } from '@/stores/opinion'
import type { OpinionItem, BasicItem, BasicPositions } from '@/api/types/doc'
import IconConvert from '@/components/icons/IconConvert.vue'
import { useScroll } from '@vueuse/core';


const props = defineProps({
  //是否有观点
  isOpinion: {
    type: Boolean,
    default: false
  },
  // 段子高亮id
  paragraphId: {
    type: Number
  }
})

const emits = defineEmits(['getBasicList', 'getCol'])

const route = useRoute()

const curPage = ref(1)
const opinionInduce_value = ref('')
const pageSize = ref(1)
const total = ref(0)
const opinionList = ref([])

const articleItem = ref({
  content: null
})
const simpleImage = ref(Empty.PRESENTED_IMAGE_SIMPLE)
const reportRef = ref('reportRef')

const opinionStore = useOpinionStore()
const opinionRef = ref<HTMLElement | null>(null)
const { isScrolling } = useScroll(opinionRef)

const statusMap = reactive({
  1: '成立',
  0: '不成立',
})

//获取段子、报告内容
async function getReportContent() {
  let params: ReportParams = {
    id: route.params.id
  }
  let res = await queryReport(params)
  articleItem.value = res.data?.length ? res.data[0] : null
}

// 获取段子、报告观点内容
async function getReportOpinionContent() {
  let params: ReportParams = {
    type: 1,
    id: Number(route.params.id),
    flag: 2
  }
  let res = await getReportPoint(params);
  if (!res || typeof res == 'string') return;
  opinionList.value = res.map((it: OpinionItem) => ({ ...it, expand: false, edit: true }))
  total.value = opinionList.value.length
  setTimeout(() => {
    handleOpinionClick(opinionList.value[0], 0)
  }, 1000)
}

function onChange(val: number) {
  let index = val - 1;
  let opinionItem = opinionList.value[index];
  let id = `opinion-${opinionItem.id}`
  let el = document.getElementById(id);
  el && el.scrollIntoView({ behavior: 'smooth' })
  setTimeout(() => {
    handleOpinionClick(opinionItem, index)
  }, 1500)
}

function edit_opinion(it: OpinionItem) {
  it.edit = false
  opinionInduce_value.value = it.opinionInduce
}

function edit_no(it: OpinionItem) {
  it.edit = true
  it.opinionInduce = opinionInduce_value.value
  opinionInduce_value.value = ''
}

function saveOrUpdate(it: OpinionItem) {
  saveOrUpdateOpinion({ ...it })
    .then((res) => {
      if (res) {
        message.success('修改成功')
        it.edit = true
        opinionInduce_value.value = ''
      } else {
        message.error('修改失败')
        it.edit = true
        it.opinionInduce = opinionInduce_value.value
        opinionInduce_value.value = ''
      }
    })
    .catch(() => {
      message.error('修改失败')
      it.edit = true
      it.opinionInduce = opinionInduce_value.value
      opinionInduce_value.value = ''
    })
}

function handleOpinionClick(it: OpinionItem, idx: number) {
  curPage.value = idx + 1;
  highlight(it.id);
  clearExpand(idx);
  try {
    let obj = JSON.parse(it.opinionJson)
    emits('getBasicList', obj)
    opinionStore.setCurOpinion(it)
  } catch (err) {
    console.log(err)
  }
  drawLine(it)
}

function choose(it: OpinionItem) {
  it.opinionStatus = it.opinionStatus === 1 ? 0 : 1
  opinionStore.setCurOpinion(it)
  saveOrUpdateOpinion({ ...it }).then((res) => {
    res ? message.success('修改成功') : message.error('修改失败')
  })
}

function handlePargraphClick(e) {
  const target = e.target;
  if (target.nodeName.toLowerCase() !== 'span') return;
  const id = target.id;
  if (!props.isOpinion) {
    emits('getCol', id);
    return;
  }

  let index = opinionList.value.findIndex(it => it.id == id);
  if (index > -1) {
    let el = document.getElementById(`opinion-${id}`);
    el && el.scrollIntoView({ behavior: 'smooth' })
    setTimeout(() => {
      handleOpinionClick(opinionList.value[index], index);
    }, 1500)
  }
}

function highlight(id) {
  var articleSours = document.getElementById('articleSours')
  for (var i = 0; i < articleSours.children.length; i++) {
    articleSours.children[i].classList.remove('highlight');
  }
  setTimeout(function () {
    var divElement = document.getElementById(`${id}`)
    divElement?.classList.add('highlight')
  }, 80)
}

function clearExpand(index: number) {
  opinionList.value = opinionList.value.map((it, idx) => {
    if (index && index === idx) {
      it.expand = true
    } else {
      it.expand = false
    }
    return it
  })
}

function drawLine(it: OpinionItem) {
  let points = getPosition({
    parent: 'report',
    left: `${it.id}`,
    middle: 'report',
    right: `opinion-${it.id}`
  })
  createDashedLineSvg(points, 'report')
}

function removeLineSvg() {
  const svgEl = document.getElementById('lineSvg');
  svgEl && document.body.removeChild(svgEl);
}

watch(() => isScrolling.value, (v) => {
  if (v) {
    removeLineSvg();
  }
})
watch(() => props.paragraphId, (v) => {
  if (v) {
    nextTick(() => {
      highlight(v)
    })
  }
})

onMounted(() => {
  opinionStore.setCurOpinion(null);
  getReportContent()
  if (props.isOpinion) {
    getReportOpinionContent()
  }
})

onBeforeUnmount(() => {
  removeLineSvg();
  highlight(-1);
});

</script>

<template>
  <div class="w-full h-full flex pt-[20px] pl-[20px]">
    <div class="flex-1 flex flex-col">
      <slot>
        <div class="bar-vertical pr-[20px]">段子</div>
      </slot>
      <div class="flex-1 overflow-y-auto relative mt-[20px] article-item" :class="{ 'mr-[20px]': isOpinion }"
        ref="reportRef">
        <div class="h-full" id="report">
          <div id="articleSours" v-html="articleItem?.newContent || articleItem?.content" @click="handlePargraphClick">
          </div>
        </div>
      </div>
    </div>
    <div v-if="isOpinion" class="w-[312px] flex flex-col">
      <div class="flex justify-end mb-[20px] pr-[16px]">
        <span>观点</span>
        <a-pagination v-model:current="curPage" v-model:pageSize="pageSize" simple :total="total" @change="onChange"
          @current-change="onChange" />
      </div>
      <div v-if="opinionList && opinionList.length" ref="opinionRef" class="flex-1 overflow-auto pr-[16px] pb-[16px]">
        <div v-for="(it, idx) in opinionList" :key="it.id" :class="['opinion', { active: curPage == idx + 1 }]"
          :id="`opinion-${it.id}`">
          <div :class="['opinion-item', { error: it.opinionStatus === 0 }]" @click="handleOpinionClick(it, idx)">
            <img v-if="it.opinionStatus === 1" class="icon" src="@/assets/img/record/duidui.svg" />
            <img v-else class="icon" src="@/assets/img/record/chacha.svg" />
            <div v-if="it.opinionStatus === 1" class="succ_status">观点成立</div>
            <div v-else class="error_status">观点不成立</div>
            <!-- <div :class="`status-${it.opinionStatus}`">观点{{ statusMap[it.opinionStatus] }}</div> -->
            <div class="ml-[6px]" @click.stop="choose(it)">
              <a-tooltip placement="top">
                <template #title>切换为{{ statusMap[it.opinionStatus == 1 ? 0 : 1] }}</template>
                <IconConvert />
              </a-tooltip>

            </div>
            <img v-if="it.expand" class="ml-auto rotate" src="@/assets/img/record/xiaxia.svg"
              @click.stop="it.expand = !it.expand" />
            <img v-else class="ml-auto" src="@/assets/img/record/xiaxia.svg" @click.stop="it.expand = !it.expand" />
          </div>
          <div class="margin_top" v-if="it.expand">
            <div class="flex items-center px-[10px] py-[14px] bg-gray-100 radius-[10px]">
              <div class="text-[12px]" style="width: 100%">
                <a-textarea v-model:value="it.opinionInduce" placeholder="请您输入补充观点" :disabled="it.edit"
                  :auto-size="{ minRows: 2 }" allowClear />
              </div>
              <img @click="edit_opinion(it)" v-if="it.edit" class="ml-auto cursor-pointer"
                src="@/assets/img/record/edit.svg" />
            </div>
            <div v-if="!it.edit" class="flex mt-[10px]">
              <div>{{ it.createTime }}</div>
              <div class="ml-auto">
                <a-button @click="edit_no(it)" size="small" class="mr-[6px]">取消</a-button>
                <a-button size="small" @click="saveOrUpdate(it)" type="primary">确定</a-button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="mt-[48px]">
        <a-empty :image="simpleImage" description="暂无数据" />
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
@import '@/assets/common.less';

.article-item {
  padding: 20px;
  box-shadow: 0px 0px 6px 0px rgba(199, 215, 251, 0.7);
  box-sizing: border-box;
  overflow: auto;
  // margin-top: 20px;
}

#article-canvas {
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
}

.opinion {
  box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.07);
  border: 1px solid @color-gray-2;
  border-radius: 4px;
  padding: 0 14px;

  &:not(:nth-of-type(1)) {
    margin-top: 16px;
  }

  &-item {
    display: flex;
    align-items: center;
    color: @color-primary-1;
    padding: 14px 0;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;

    &.error {
      color: @color-danger-1;

      .icon {
        width: 16px;
        height: 16px;
        margin-right: 6px;
      }
    }

    .icon {
      width: 16px;
      height: 16px;
      margin-right: 6px;
    }
  }
}


.error_status {
  font-size: 14px;
  font-weight: 500;
  color: #e34d59;
  line-height: 20px;
}

.succ_status {
  font-size: 14px;
  font-weight: 500;
  color: #0051fe;
  line-height: 20px;
}

.margin_top {
  margin-top: 6px;
  padding-bottom: 14px;

  ::v-deep(.ant-input) {
    border: 0px solid #d9d9d9;
  }
}

.rotate {
  transform: rotate(180deg);
}
</style>
<style lang="less">
@color-primary-1: #0051fe;

#articleSours {
  white-space: pre-wrap;

  span:hover {
    cursor: pointer;
    background: rgba(227, 77, 89, 0.3);
  }

  .highlight {
    background: rgba(227, 77, 89, 0.3);
  }
}
</style>
