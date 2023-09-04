<script lang="ts" setup>
import VuePdfEmbed from '@/components/vue-pdf-embed/src/index.js';
import pdf from '/public/aa.pdf';

import { useIntersectionObserver } from '@vueuse/core';


const pageSize = ref(1);

const total = ref(1)

const source = ref(pdf)
const pageNo = ref(1);


function scrollToPage(v) {
  let id = `pdfembed-${v}`;
  let el = document.getElementById(id);
  el?.scrollIntoView({ behavior: 'auto' })
}

function onLoaded(pdf) {
  total.value = pdf.numPages;
  setTimeout(() => {
    let parentElement = document.getElementById('pdfembed');
    Array.from(parentElement.children).forEach((child, idx) => {
      IntersectionObserverComponent(child)
    })

  }, 300)
}

//监听滚动的可视元素
function IntersectionObserverComponent(child) {
  const { stop } = useIntersectionObserver(
    child,
    ([{ isIntersecting }], observerElement) => {
      if (isIntersecting == true) {
        pageNo.value = parseInt(child.id.slice(9));
      }
    },
    {
      threshold: 0.4
    }
  )
  return () => {
    stop()
  }
}

</script>

<template>
  <div class="w-full h-full flex flex-col" ref="targetRef">
    <div class="flex-1 relative overflow-y-auto overflow-x-hidden">
      <vue-pdf-embed :source="source" @loaded="onLoaded" :disableTextLayer="false" :disableAnnotationLayer="true"
        ref="pdfRef" id="pdfembed" />
    </div>
  </div>
</template>

<style lang="less" scoped>
@import '@/assets/common.less';

.icon {
  width: 16px;
  height: 16px;
  display: inline-block;
  margin-right: 4px;
  background: url('@/assets/img/add2.svg') no-repeat center /contain;

  &.reduce {
    background-image: url("@/assets/img/reduce.svg");
  }

  &.file {
    background-image: url('@/assets/img/file/pdf.svg');
    position: relative;
    top: 3px;
  }
}

.title {
  box-shadow: 0px 2px 10px 0px rgba(78, 89, 105, 0.06);
  border-bottom: 1px solid #E5E6EB;

  ::selection {
    color: #fff !important;
  }
}

::v-deep(::selection) {
  color: transparent !important;
}

::v-deep(.ant-pagination.mini .ant-pagination-simple-pager) {
  height: 20px;
  line-height: 20px;
  vertical-align: middle;
}

::v-deep(.ant-pagination.mini .ant-pagination-next) {
  height: 20px;
  line-height: 20px;
}

::v-deep(.ant-pagination-simple .ant-pagination-next .ant-pagination-item-link) {
  height: 26px;
}
</style>
