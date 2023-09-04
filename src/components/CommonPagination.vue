<!-- eslint-disable vue/no-mutating-props -->
<template>
  <div class="commonPagination_footer">
    <div>共 {{ total >= 10000 ? '10000+' : total }} 项数据</div>
    <div class="footer">
      <div v-if="multipleStatus">已选中 {{ checkTotal }} 个</div>
      <a-pagination @change="onChange" @showSizeChange="onShowSizeChange" v-model:current="current"
        :total="total > 1000 ? 1000 : total" :pageSize="pageSize" :show-size-changer="sizeChanger"
        :page-size-options="pageSizeOptions" show-quick-jumper>
        <!-- <template #buildOptionText="props">
        <span v-if="props.value !== '50'">{{ props.value }}条/页</span>
        <span v-else>全部</span>
      </template> -->
      </a-pagination>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, toRefs, watch, nextTick, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { getFundScaleStats } from '/@/api/Cockpit';

export default defineComponent({
  props: {
    //每页条数
    pageSize: {
      type: Number,
      default: 10,
    },
    //当前页数
    currentPage: {
      type: Number,
      default: 1,
    },
    //总数据量
    total: {
      type: Number,
      default: 0,
    },
    // 选中数量
    checkTotal: {
      type: Number,
      default: 0,
    },
    // 多选个数展示状态
    multipleStatus: {
      type: Boolean,
      default: false,
    },
    // 页数修改的状态
    sizeChanger: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['commonPaginationChange'],
  setup(_props, { emit, attrs }) {
    const state = reactive({
      current: 1,
      pageSize: 10,
      pageSizeOptions: ['5', '10', '20', '30', '40', '50'],
    });

    const onChange = (e) => {
      if (e === 100) {
        message.info('当前仅可查看1000条数据');
      }
      emit('commonPaginationChange', e, state.pageSize);
    };

    const onShowSizeChange = (current: number, pageSize: number) => {
      if (current === 100) {
        message.info('当前仅可查看1000条数据');
      }
      state.pageSize = pageSize;
      emit('commonPaginationChange', current, pageSize);
    };

    watch(
      () => _props.currentPage,
      (newVal: any) => {
        nextTick(() => {
          state.current = newVal;
        });
      },
      { deep: true }
    );
    onMounted(() => {
      //处理
      state.current = _props.currentPage;
      state.pageSize = _props.pageSize;
    });
    return {
      ...toRefs(state),
      onChange,
      onShowSizeChange,
    };
  },
});
</script>

<style lang="less" scoped>
.commonPagination_footer {
  margin: 15px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .footer {
    display: flex;

    div {
      padding: 5px;
      margin-right: 5px;
    }
  }
}
</style>
