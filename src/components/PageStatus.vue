
<script setup lang="ts">
import { Empty } from 'ant-design-vue';

const props = defineProps({
    isLoading: {
        type: Boolean,
        default: false,
    },
    isEmpty: {
        type: Boolean,
        default: false,
    }
})

const simpleImage = ref(Empty.PRESENTED_IMAGE_SIMPLE);
</script>

<template>
    <div v-if="props.isLoading" class="w-full h-full flex justify-center items-center">
        <a-spin size="large" />
    </div>
    <div v-else-if="props.isEmpty" class="h-full flex items-center justify-center">
        <a-empty :image="simpleImage" description="暂无数据" />
    </div>
    <slot v-else></slot>
</template>