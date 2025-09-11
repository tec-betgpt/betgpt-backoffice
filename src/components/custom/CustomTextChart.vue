<template>
  <div class="typing-container">
    <div ref="content" class="typing-content"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';

const props = defineProps({
  html: { type: String, default: '' },
  speed: { type: Number, default: 20 },
  start: { type: Boolean, default: true },
  skip: { type: Boolean, default: false },
});

// Adicionamos o novo evento 'tick' para notificar o pai a cada caractere
const emit = defineEmits(['done', 'tick']);

const content = ref<HTMLElement | null>(null);
let animationFrameId: number | null = null;
let isTyping = false;

function prefersReducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  catch { return false; }
}

function stopTyping() {
  if (animationFrameId !== null) {
    clearTimeout(animationFrameId);
    animationFrameId = null;
  }
  isTyping = false;
}

async function startTyping() {
  if (!content.value || isTyping) return;
  stopTyping();
  isTyping = true;
  content.value.innerHTML = '';

  if (props.skip || prefersReducedMotion()) {
    content.value.innerHTML = props.html;
    await nextTick(); // Espera o DOM atualizar
    emit('tick'); // Notifica o pai para rolar uma última vez
    isTyping = false;
    emit('done');
    return;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<!DOCTYPE html><body>${props.html}</body>`, 'text/html');
  const sourceNodes = Array.from(doc.body.childNodes);
  const queue: { parent: Node; node: Node }[] = sourceNodes.map(node => ({ parent: content.value!, node }));

  await processQueue(queue);

  isTyping = false;
  emit('done');
}

async function processQueue(queue: { parent: Node; node: Node }[]) {
  for (const item of queue) {
    const { parent, node } = item;

    if (node.nodeType === Node.TEXT_NODE && node.textContent) {
      const textNode = document.createTextNode('');
      parent.appendChild(textNode);
      await typeText(textNode, node.textContent);
    }
    else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const newElement = document.createElement(element.nodeName);

      for (const attr of Array.from(element.attributes)) {
        newElement.setAttribute(attr.name, attr.value);
      }

      parent.appendChild(newElement);
      const children = Array.from(element.childNodes).map(childNode => ({ parent: newElement, node: childNode }));
      await processQueue(children);
    }
  }
}

function typeText(textNode: Text, text: string): Promise<void> {
  return new Promise(resolve => {
    let index = 0;
    const type = () => {
      if (index < text.length) {
        textNode.textContent += text[index];
        index++;
        emit('tick'); // <<< A CADA CARACTERE, EMITE O EVENTO PARA O PAI
        animationFrameId = window.setTimeout(type, props.speed);
      } else {
        resolve();
      }
    };
    type();
  });
}

// Watchers e Hooks permanecem majoritariamente os mesmos, mas sem chamadas de scroll
watch(() => props.start, (isStarting) => {
  if (isStarting) startTyping();
  else stopTyping();
}, { immediate: true });

watch(() => props.html, () => {
  if (props.start) startTyping();
  else if (content.value) content.value.innerHTML = props.html;
});

watch(() => props.skip, async (shouldSkip) => {
  if (shouldSkip && content.value) {
    stopTyping();
    content.value.innerHTML = props.html;
    await nextTick();
    emit('tick');
    if (!isTyping) emit('done');
  }
});

onMounted(() => {
  if (props.start) startTyping();
  else if (content.value) content.value.innerHTML = props.html;
});

onBeforeUnmount(() => stopTyping());
</script>

<style>
.typing-container {
  font-size: 12px;
  line-height: 1.25;
  white-space: wrap;
  word-wrap: break-word;
  overflow-wrap: anywhere;
  color: inherit;


}

.typing-content {
}

.typing-container h1 { font-size: 1.2rem; font-weight: bold; margin:  .6rem 0; }
.typing-container h2 { font-size: 1.1rem; font-weight: bold; margin:  .6rem 0; }
.typing-container h3 { font-size: 1rem; font-weight: 600; margin: .6rem 0; }
.typing-container p { margin: 0.15rem 0; }
.typing-container pre,
.typing-container code {
  font-family: monospace;
  padding: 0.15rem 0.3rem;
  border-radius: 4px;
  white-space: pre-wrap !important;
  word-wrap: break-word !important;
  overflow-wrap: anywhere !important;
  margin: 0.2rem 0;
}
.typing-container strong { font-weight: 600; }
.typing-container em { font-style: italic; }
.typing-container ul {
  margin: .6rem 0;
  height: fit-content;
  padding-top:0;
  padding-left: 20px;
}
.typing-container li{
  margin: 0.2rem 0;
}
</style>