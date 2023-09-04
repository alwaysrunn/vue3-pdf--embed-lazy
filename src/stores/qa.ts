import { ref, computed } from 'vue'
import { defineStore, acceptHMRUpdate } from 'pinia'
import type { ReferenceItem, BasicItem, BasicPositions, PdfInfoParam, QaRecordItem, FileTableItem } from '@/api/types/doc';

export const useQaStore = defineStore('qa', () => {
  const selectedDocList = ref<FileTableItem[]>([])
  const curReference = ref({} as ReferenceItem);
  const qaRecordList = ref<QaRecordItem[]>([])
  const curFileAttr = ref({} as PdfInfoParam);

  const docIds = computed(() => selectedDocList.value.map(it => it.id))

  //选中的文档
  function setSelectedDocList(val: any) {
    selectedDocList.value = val;
  }

  function delSelectedDoc(val: number) {
    const idx = selectedDocList.value.findIndex((it: FileTableItem) => it.id == val)
    idx > -1 ? selectedDocList.value.splice(idx, 1) : null;
  }

  //问答参考文档
  function setCurReference(val: ReferenceItem) {
    curReference.value = val;
  }

  //当前文件属性
  function setCurFileAttr(val: PdfInfoParam) {
    Object.assign(curFileAttr.value, val);
  }

  //问答记录列表
  function setQaRecordList(val: QaRecordItem[]) {
    qaRecordList.value = val;
  }

  return {
    selectedDocList,
    curReference,
    qaRecordList,
    docIds,
    curFileAttr,
    setSelectedDocList,
    setCurReference,
    setCurFileAttr,
    setQaRecordList,
    delSelectedDoc,
  }

},
{
  persist: {
    enabled: true,
  },
}
)

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useQaStore, import.meta.hot))
}


