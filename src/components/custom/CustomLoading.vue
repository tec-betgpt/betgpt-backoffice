<template>

  <!--  <Card class="max-w-[400px] ">-->
  <!--    <CardHeader class="flex items-center justify-between">-->
  <!--      <img src="/logo-elevate-square-black.png"  class="w-[150px] h-fit" alt="">-->
  <!--    </CardHeader>-->
  <!--    <CardContent class=" flex gap-2">-->
  <!--      <img src="/svgviewer-output%20(3).svg" class="w-[18px] h-fit" alt=""/>-->
  <!--      <CardDescription class="text-left font-bold text-xl gap-2 flex flex-col">-->
  <!--        {{message.message}}-->
  <!--        <p class="text-left font-extralight ">{{message.signature}}</p>-->
  <!--      </CardDescription>-->


  <!--    </CardContent>-->
  <!--  </Card>-->
  <div class="flex flex-col justify-center items-center flex-1 ">
    <img src="/logo-elevate-square-black.png" class="w-[100px] h-fit" alt="">
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
