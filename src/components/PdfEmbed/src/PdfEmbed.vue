<template>
  <div :id="id" class="vue-pdf-embed" ref="vuePdfRef">
    <div v-for="pageNum in pageNums" :key="pageNum" :id="id && `${id}-${pageNum}`" ref="elementRefs" :style="getStyle">
      <canvas></canvas>

      <div v-if="!disableTextLayer" class="textLayer"></div>

      <div v-if="!disableAnnotationLayer" class="annotationLayer"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import * as pdf from '/public/pdfjs-dist/build/pdf.js';
import PdfWorker from '/public/pdfjs-dist/build/pdf.worker.js?worker&inline';
// import PdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.js';
// import { PDFLinkService } from 'pdfjs-dist/legacy/web/pdf_viewer.js';
import {
  addPrintStyles,
  createPrintIframe,
  emptyElement,
  releaseChildCanvases,
} from './util.js';
import { useIntersectionObserver } from '@vueuse/core';

pdf.GlobalWorkerOptions.workerPort = new PdfWorker();

const props = defineProps({
  /**
   * Whether the annotation layer should be disabled.
   * @values Boolean
   */
  disableAnnotationLayer: Boolean,
  /**
   * Whether the text layer should be disabled.
   * @values Boolean
   */
  disableTextLayer: Boolean,
  /**
   * Desired page height.
   * @values Number, String
   */
  height: [Number, String],
  /**
   * Component identifier (inherited by page containers with page number
   * postfixes).
   * @values String
   */
  id: String,
  /**
   * Path for annotation icons, including trailing slash.
   * @values String
   */
  imageResourcesPath: String,
  /**
   * Number of the page to display.
   * @values Number
   */
  page: Number,
  /**
   * Desired page rotation angle.
   * @values Number, String
   */
  rotation: {
    type: [Number, String],
    default: 0,
    validator(value) {
      if (value % 90 !== 0) {
        throw new Error('Rotation must be 0 or a multiple of 90.')
      }
      return true
    },
  },
  /**
   * Desired ratio of canvas size to doc size.
   * @values Number
   */
  scale: Number,
  /**
   * Source of the doc to display.
   * @values Object, String, URL, TypedArray
   */
  source: {
    type: [Object, String, URL, Uint8Array],
    required: true,
  },
  /**
   * Desired page width.
   * @values Number, String
   */
  width: [Number, String],


})

const emit = defineEmits([
  'loaded',
  'loading-failed',
  'password-requested',
  'progress',
  'printing-failed',
  'rendered',
  'rendering-failed',
  'internal-link-clicked',
])

const doc = ref(null);
const pageCount = ref(null);
const pageNums = ref([]);
const elementRefs = ref([]);
const vuePdfRef = ref(null);
const pageWidth = ref('0');
const pageHeight = ref('1000');


const linkService = computed(() => {
  if (!doc.value || props.disableAnnotationLayer) {
    return null
  }

  // const service = new PDFLinkService()
  // service.setDocument(doc.value)
  // service.setViewer({
  //   scrollPageIntoView: ({ pageNumber }) => {
  //     emit('internal-link-clicked', pageNumber)
  //   },
  // })
  // return service
})

const getStyle = computed(() => {
  return {
    width: `${pageWidth.value}px`,
    height: `${pageHeight.value}px`,
  }
})

watch(() => [
  props.source,
  props.disableAnnotationLayer,
  props.disableTextLayer,
  props.height,
  props.page,
  props.rotation,
  props.width
], async ([newSource], [oldSource]) => {
  if (newSource !== oldSource) {
    releaseChildCanvases(vuePdfRef.value)
    await load();
  }
  renderCanvas()
})

onMounted(async () => {
  await load()
  renderCanvas()

  nextTick(() => {
    Array.from(elementRefs.value).forEach((child, idx) => {
      IntersectionObserverComponent(child)
    })
  })

})

onUnmounted(() => {
  releaseChildCanvases(vuePdfRef.value)
  doc.value?.destroy()
})



/**
 * Returns an array of the actual page width and height based on props and
 * asect ratio.
 * @param {number} ratio - Page aspect ratio.
 */
function getPageDimensions(ratio) {
  let width, height

  if (props.height && !props.width) {
    height = props.height
    width = height / ratio
  } else {
    width = props.width || vuePdfRef.value.clientWidth
    height = width * ratio
  }

  return [width, height]
}
/**
 * Loads a PDF doc. Defines a password callback for protected
 * docs.
 *
 * NOTE: Ignored if source property is not provided.
 */
async function load() {
  console.log('loaded start', props.source, !props.source)
  if (!props.source) {
    return
  }
  try {
    debugger;
    if (props.source._pdfInfo) {
      doc.value = props.source
    } else {
      const docLoadingTask = pdf.getDocument(props.source)
      // docLoadingTask.onProgress = (progressParams) => {
      //   emit('progress', progressParams)
      // }
      // docLoadingTask.onPassword = (callback, reason) => {
      //   const retry = reason === pdf.PasswordResponses.INCORRECT_PASSWORD
      //   emit('password-requested', callback, retry)
      // }
      doc.value = await docLoadingTask.promise
      console.log('tttt', docLoadingTask, docLoadingTask.promise)
      docLoadingTask.promise.then(res => {
        console.log('a', res)
        doc.value = res;

        pageCount.value = doc.value.numPages
        emit('loaded', doc.value)
      }).catch(e => {
        console.log('e', e)
      })
    }
    console.log('loaded')
    // pageCount.value = doc.value.numPages
    // emit('loaded', doc.value)
  } catch (e) {
    doc.value = null;
    pageCount.value = null;
    pageNums.value = [];
    console.log('loading-failed', e)
    emit('loading-failed', e)
  }
}
/**
 * Prints a PDF doc via the browser interface.
 *
 * NOTE: Ignored if the doc is not loaded.
 *
 * @param {number} dpi - Print resolution.
 * @param {string} filename - Predefined filename to save.
 * @param {boolean} allPages - Ignore page prop to print all pages.
 */
async function print(dpi = 300, filename = '', allPages = false) {
  if (!doc.value) {
    return
  }

  const printUnits = dpi / 72
  const styleUnits = 96 / 72
  let container, iframe, title

  try {
    container = document.createElement('div')
    container.style.display = 'none'
    window.document.body.appendChild(container)
    iframe = await createPrintIframe(container)

    const pageNums =
      props.page && !allPages
        ? [props.page]
        : [...Array(doc.value.numPages + 1).keys()].slice(1)

    await Promise.all(
      pageNums.map(async (pageNum, i) => {
        const page = await doc.value.getPage(pageNum)
        const viewport = page.getViewport({
          scale: 1,
          rotation: 0,
        })

        if (i === 0) {
          const sizeX = (viewport.width * printUnits) / styleUnits
          const sizeY = (viewport.height * printUnits) / styleUnits
          addPrintStyles(iframe, sizeX, sizeY)
        }

        const canvas = document.createElement('canvas')
        canvas.width = viewport.width * printUnits
        canvas.height = viewport.height * printUnits
        container.appendChild(canvas)
        const canvasClone = canvas.cloneNode()
        iframe.contentWindow.document.body.appendChild(canvasClone)

        await page.render({
          canvasContext: canvas.getContext('2d'),
          intent: 'print',
          transform: [printUnits, 0, 0, printUnits, 0, 0],
          viewport,
        }).promise

        canvasClone.getContext('2d').drawImage(canvas, 0, 0)
      })
    )

    if (filename) {
      title = window.document.title
      window.document.title = filename
    }

    iframe.contentWindow.focus()
    iframe.contentWindow.print()
  } catch (e) {
    emit('printing-failed', e)
  } finally {
    if (title) {
      window.document.title = title
    }

    releaseChildCanvases(container)
    container.parentNode?.removeChild(container)
  }
}
/**
 * Renders the PDF doc as SVG element(s) and additional layers.
 *
 * NOTE: Ignored if the doc is not loaded.
 */
async function render() {
  if (!doc.value) {
    return
  }
  try {
    pageNums.value = props.page
      ? [props.page]
      : [...Array(doc.value.numPages + 1).keys()].slice(1)

    await Promise.all(
      pageNums.value.map(async (pageNum, i) => {
        const page = await doc.value.getPage(pageNum)
        const pageRotation = props.rotation + page.rotate

        const [canvas, div1, div2] = elementRefs.value[i].children;
        const [actualWidth, actualHeight] = getPageDimensions(
          (pageRotation / 90) % 2
            ? page.view[2] / page.view[3]
            : page.view[3] / page.view[2]
        )

        canvas.style.width = `${Math.floor(actualWidth)}px`
        canvas.style.height = `${Math.floor(actualHeight)}px`

        await renderPage(page, canvas, actualWidth, pageRotation)

        if (!props.disableTextLayer) {
          await renderPageTextLayer(
            page,
            div1,
            actualWidth,
            pageRotation
          )
        }

        if (!props.disableAnnotationLayer) {
          await renderPageAnnotationLayer(
            page,
            div2 || div1,
            actualWidth,
            pageRotation
          )
        }
      })
    )

    emit('rendered')
  } catch (e) {
    doc.value = null
    pageCount.value = null
    pageNums.value = []
    emit('rendering-failed', e)
  }
}

//渲染单页
async function renderCanvas() {
  if (!doc.value) {
    return
  }
  pageNums.value = props.page
    ? [props.page]
    : [...Array(doc.value.numPages + 1).keys()].slice(1)
  console.log('aaaaaaaaaaaaaa', pageNums.value)
  await renderStep(1);
}

async function renderStep(v: number) {
  try {
    await Promise.all(
      [v].map(async (pageNum, i) => {
        const page = await doc.value.getPage(pageNum)
        const pageRotation = props.rotation + page.rotate

        let loaded = elementRefs.value[pageNum - 1].getAttribute('data-load');
        console.log('renderStep', pageNum, i, loaded, elementRefs.value[pageNum - 1])
        if (loaded) {
          return;
        } else {
          elementRefs.value[pageNum - 1].setAttribute('data-load', true);
        }

        const [canvas, div1, div2] = elementRefs.value[pageNum - 1].children;
        const [actualWidth, actualHeight] = getPageDimensions(
          (pageRotation / 90) % 2
            ? page.view[2] / page.view[3]
            : page.view[3] / page.view[2]
        )

        canvas.style.width = `${Math.floor(actualWidth)}px`
        canvas.style.height = `${Math.floor(actualHeight)}px`

        //保证滚动的时候，滚动的位置正确
        pageWidth.value = `${Math.floor(actualWidth)}`;
        pageHeight.value = `${Math.floor(actualHeight)}`;

        await renderPage(page, canvas, actualWidth, pageRotation)

        if (!props.disableTextLayer) {
          await renderPageTextLayer(
            page,
            div1,
            actualWidth,
            pageRotation
          )
        }

        if (!props.disableAnnotationLayer) {
          await renderPageAnnotationLayer(
            page,
            div2 || div1,
            actualWidth,
            pageRotation
          )
        }
      })
    )
    emit('rendered')
  } catch (e) {
    doc.value = null
    pageCount.value = null
    pageNums.value = []
    emit('rendering-failed', e)

  }
}

function IntersectionObserverComponent(child) {
  const { stop } = useIntersectionObserver(
    child,
    async ([{ isIntersecting }], observerElement) => {
      if (isIntersecting == true) {
        if (!child.getAttribute('data-load')) {
          let index = parseInt(child.id.slice(9));
          await renderStep(index);
        }
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
/**
 * Renders the page content.
 * @param {PDFPageProxy} page - Page proxy.
 * @param {HTMLCanvasElement} canvas - HTML canvas.
 * @param {number} width - Actual page width.
 * @param {number} rotation - Total page rotation.
 */
async function renderPage(page, canvas, width, rotation) {
  const pageWidth = (rotation / 90) % 2 ? page.view[3] : page.view[2]
  const viewport = page.getViewport({
    scale: props.scale ?? Math.ceil(width / pageWidth) + 1,
    rotation,
  })

  canvas.width = viewport.width
  canvas.height = viewport.height

  await page.render({
    canvasContext: canvas.getContext('2d'),
    viewport,
  }).promise
}
/**
 * Renders the annotation layer for the specified page.
 * @param {PDFPageProxy} page - Page proxy.
 * @param {HTMLElement} container - HTML container.
 * @param {number} width - Actual page width.
 * @param {number} rotation - Total page rotation.
 */
async function renderPageAnnotationLayer(page, container, width, rotation) {
  emptyElement(container)
  const pageWidth = (rotation / 90) % 2 ? page.view[3] : page.view[2]
  // pdf.AnnotationLayer.render({
  //   annotations: await page.getAnnotations(),
  //   div: container,
  //   linkService: linkService.value,
  //   page,
  //   renderInteractiveForms: false,
  //   viewport: page
  //     .getViewport({
  //       scale: width / pageWidth,
  //       rotation,
  //     })
  //     .clone({
  //       dontFlip: true,
  //     }),
  //   imageResourcesPath: props.imageResourcesPath,
  // })
}
/**
 * Renders the text layer for the specified page.
 * @param {PDFPageProxy} page - Page proxy.
 * @param {HTMLElement} container - HTML container.
 * @param {number} width - Actual page width.
 * @param {number} rotation - Total page rotation.
 */
async function renderPageTextLayer(page, container, width, rotation) {
  emptyElement(container)
  const pageWidth = (rotation / 90) % 2 ? page.view[3] : page.view[2]
  await pdf.renderTextLayer({
    container,
    textContent: await page.getTextContent(),
    viewport: page.getViewport({
      scale: width / pageWidth,
      rotation,
    }),
  }).promise
}


</script>

<style lang="less">
@import 'styles/text-layer';
@import 'styles/annotation-layer';

.vue-pdf-embed {
  &>div {
    position: relative;
  }

  canvas {
    display: block;
  }
}
</style>