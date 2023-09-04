<script setup lang="ts">
import { useMouse } from '@vueuse/core';

const emits = defineEmits(['widthChange']);

const lastX = ref<number>();


function mouseDown(e) {
    document.addEventListener("mousemove", mouseMove);
    lastX.value = e.screenX;
}

function mouseMove(event) {
    emits("widthChange", lastX.value - event.screenX);
    lastX.value = event.screenX;
}
function mouseUp() {
    lastX.value = "";
    document.removeEventListener("mousemove", mouseMove);
}

onBeforeMount(() => {
    document.addEventListener("mouseup", mouseUp);
})

onBeforeUnmount(() => {
    document.removeEventListener("mouseup", mouseUp);
})


</script>

<template>
 <div class="x-handle" @mousedown="mouseDown"></div>
</template>

<style lang="less" scoped>
.x-handle {
  width: 8px;
  height: 100%;
  cursor: ew-resize;
  z-index: 10;
  background: transparent;
//   background: #ccc;
}
</style>
