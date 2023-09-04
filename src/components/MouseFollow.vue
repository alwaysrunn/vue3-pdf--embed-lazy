<script setup lang="ts">
import { useMouse } from '@vueuse/core';

const props = defineProps({
    visible: {
        type: Boolean,
        default: true
    },
})

const emits = defineEmits(['update:visible'])

const { x, y } = useMouse();

const _visible = ref(props.visible);
const menuPosition = ref({ x: 0, y: 0 });

const getStyle = computed( () =>{
    return {
        left: `${unref(menuPosition.value.x)}px`,
        top: `${unref(menuPosition.value.y)}px`,
    }
})

watch(() => props.visible, (v) => {
    _visible.value = v;
    menuPosition.value = { x: unref(x), y: unref(y) };
    emits('update:visible', v);
})

</script>

<template>
   <div v-if="_visible" class="fixed" :style="getStyle">
    <slot></slot>
   </div>
</template>

<style lang="less" scoped>

</style>
