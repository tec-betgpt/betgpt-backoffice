<template>
  <div v-if="readonly" class="star-rating" :class="{ 'readonly-mode': readonly }">
    <div
        v-for="star in maxStars"
        :key="star"
        class="star-container"
    >
      <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          class="star-icon"
          :class="{ 'active': star <= modelValue }"
      >
        <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/>
      </svg>
    </div>
  </div>
  <Popover v-else>
    <PopoverTrigger as-child>
      <div class="star-rating">
        <div
            v-for="star in maxStars"
            :key="star"
            class="star-container"
            @click="setRating(star)"
            @mouseenter="()=>{
              if(readonly)hoverRating = star}"
            @mouseleave="hoverRating = 0"
        >
          <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              class="star-icon"
              :class="{ 'active': star <= (hoverRating || modelValue) }"
          >
            <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/>
          </svg>
        </div>
      </div>
    </PopoverTrigger>
    <PopoverContent align="start"  class="w-80">
      <slot/>
    </PopoverContent>
  </Popover>


</template>

<script setup>
import { ref } from 'vue';
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {Textarea} from "@/components/ui/textarea/index.ts";
// Definição das Props e Emits
const props = defineProps({
  modelValue: {
    type: Number,
    default: 0
  },
  maxStars: {
    type: Number,
    default: 5
  },
  readonly: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);

const hoverRating = ref(0);

const setRating = (star) => {
  if (props.readonly) return;
  emit('update:modelValue', star);
};
</script>

<style scoped>
.star-rating {
  display: flex;
  gap: 5px; /* Espaço entre as estrelas */
  align-items: center;
}

.star-container {
  cursor: pointer;
  transition: transform 0.1s ease-in-out;
}

/* Efeito de leve aumento ao passar o mouse */
.star-container:hover {
  transform: scale(1.1);
}

.star-icon {
  width: 16px; /* Tamanho da estrela */
  height: 16px;
  fill: #e4e5e9; /* Cor da estrela vazia (cinza claro) */
  transition: fill 0.2s;
}

/* Cor da estrela preenchida (Amarelo/Dourado) */
.star-icon.active {
  fill: #ffc107;
}

.readonly-mode .star-container {
  cursor: default;
}

.readonly-mode .star-container:hover {
  transform: none;
}
</style>