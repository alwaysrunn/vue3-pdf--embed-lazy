import { ref, computed } from 'vue'
import { defineStore, acceptHMRUpdate } from 'pinia'
import type { OpinionItem, BasicItem, BasicPositions, PdfInfoParam } from '@/api/types/doc';

export const useOpinionStore = defineStore('opinion', () => {
  const count = ref(123)
  const curOpinion = ref({} as OpinionItem);
  const basicList = ref({})
  const curFileAttr = ref({} as PdfInfoParam);

  const sourceList = computed(() => basicList.value.sourceList)


  // const 

  //当前观点
  function setCurOpinion(val: any) {
    curOpinion.value = val;
    basicList.value = val?.opinionJson ? JSON.parse(val.opinionJson) : {};
  }

  // 添加依据
  function addBasic(val: BasicItem) {
    basicList.value.sourceList.push(val)
    curOpinion.value.opinionJson = JSON.stringify(basicList.value);
  }

  // 删除依据
  function delBasic(val: BasicItem) {
    const idx = basicList.value.sourceList.findIndex(it => it.content === val.content);
    idx > -1 ? basicList.value.sourceList.splice(idx, 1) : null;
    curOpinion.value.opinionJson = JSON.stringify(basicList.value);
  }

  //当前文件属性
  function setCurFileAttr(val: PdfInfoParam) {
    // curFileAttr.value = val;
    Object.assign(curFileAttr.value, val);
  }

  // const doubleCount = computed(() => count.value * 2)
  // function increment() {
  //   count.value++
  // }

  return {
    count,
    curOpinion,
    basicList,
    sourceList,
    curFileAttr,
    setCurOpinion,
    addBasic,
    delBasic,
    setCurFileAttr,
  }

},
{
  persist: {
    enabled: true,
  },
}
)

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useOpinionStore, import.meta.hot))
}


