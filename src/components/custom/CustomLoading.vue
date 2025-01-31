<template>
  <div class="flex flex-col justify-center items-center flex-1 ">

    <DotLottieVue v-if="useColorMode().value == 'dark'" style="height: 300px; width: 300px" autoplay   loop src="/animation_logo_black.lottie" />
    <DotLottieVue v-else style="height: 300px; width: 300px" autoplay   loop src="/animation_logo_white.lottie" />

    <div
        :class="{ 'opacity-0': !message.message, 'opacity-100	': message.message }"
        class="flex flex-col gap-3 transition-opacity duration-1000 ">
          <div  class="flex gap-1">
            <Quote :size="20" :stroke-width="1.75" absoluteStrokeWidth />
            <p class="max-w-[440px]">
              {{ message.message }}
            </p>
          </div>
          <p class="text-left font-serif text-gray-700">{{ message.signature }}</p>
    </div>
  </div>
</template>


<script setup lang="ts">


import api from "@/services/api";
import {ref} from "vue";
import { Quote } from 'lucide-vue-next';
import {useColorMode} from "@vueuse/core";
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'


const mode = useColorMode()

const message = ref({
  id: "",
  message: "",
  signature: ""
})

async function getMessage() {
  const response = await api.get('/message-loading')
  message.value = response.data.data
}

getMessage()
</script>
