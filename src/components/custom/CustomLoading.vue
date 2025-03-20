<template>
  <div class="container">
    <div
      class="items-center justify-center align-middle flex min-h-screen sm:w-full"
    >
      <div class="flex flex-col justify-center items-center flex-1 sm:w-full">
        <DotLottieVue
          :style="{ height: '300px', width: '300px' }"
          :src="loadingAnimation"
          autoplay
          loop
        />
        <div
          :class="{
            'opacity-0': !message.message,
            'opacity-100	': message.message,
          }"
          class="flex flex-col gap-3 transition-opacity duration-1000 sm:max-w-[440px] w-full"
        >
          <div class="flex gap-1">
            <Quote :size="20" :stroke-width="1.75" absoluteStrokeWidth />
            <p class="sm:text-lg text-sm font-sans m-0 p-0">
              {{ message.message }}
            </p>
          </div>
          <p class="text-left font-serif text-gray-700">
            {{ message.signature }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useConfigStore } from "@/stores/config";
import { DotLottieVue } from "@lottiefiles/dotlottie-vue";
import { Quote } from "lucide-vue-next";
import { useColorMode } from "@vueuse/core";
const configStore = useConfigStore();
const message = computed(() => configStore.message);
const colorMode = useColorMode();
const loadingAnimation = computed(() =>
  colorMode.value === "dark"
    ? "/animation_logo_black.lottie"
    : "/animation_logo_white.lottie"
);
</script>
