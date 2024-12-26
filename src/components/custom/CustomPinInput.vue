<script setup lang="ts">

import {PinInputInput} from "radix-vue";
import {PinInput, PinInputGroup} from "@/components/ui/pin-input";
import {ref} from "vue";
import { Button } from '@/components/ui/button'
import { Loader2 as LucideSpinner} from "lucide-vue-next";

import ClipboardButton from "@/components/custom/ClipboardButton.vue";
const props = defineProps({code:Array,finish: {
    type: Function,
    required: true,
  }
  ,loading:{
    required:false
  }
})


const code = ref<string[]>([])
const clip = async (value:string)=>{
  code.value = value.split('')
}
</script>

<template >
  <div class="w-full flex flex-col justify-center align-middle gap-4">
    <PinInput v-model="code" placeholder="0" >
      <PinInputGroup class="gap-2 w-full flex justify-center align-middle">
        <ClipboardButton variant="Icon" type="paste"  :clip="clip" />
        <template v-for="(id, index) in 6" :key="id">
          <PinInputInput
              class="rounded-md border  max-w-7 h-11 text-center"
              :index="index"
          />
        </template>

      </PinInputGroup>
    </PinInput>
    <Button @click="props.finish(code)" :disabled="loading">
      <LucideSpinner
          v-if="loading"
          class="mr-2 h-4 w-4 animate-spin"
      />
      <p v-else>Confirmar</p>
    </Button>
  </div>


</template>

<style scoped>

</style>