<template>
  <Button variant="ghost" size="icon" v-if="isMobile()" @click="open()">
    <CircleQuestionMark />
  </Button>

  <Tooltip v-else :delay-duration="0">
    <TooltipTrigger as-child>
      <Button variant="ghost" size="icon">
        <CircleQuestionMark />
      </Button>
    </TooltipTrigger>
    <TooltipContent class="w-auto">
      <span>{{ description }}</span>
    </TooltipContent>
  </Tooltip>
</template>
<script>
import { CircleQuestionMark } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast/use-toast'

export default {
  components: {
    CircleQuestionMark
  },

  data: () => ({
    isOpen: false
  }),

  methods: {
    isMobile() {
      return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)
    },

    open() {
      const { toast } = useToast()

      toast({
        description: this.description
      })
    }
  },

  props: {
    description: {
      type: String,
      default: ''
    }
  }
}
</script>
