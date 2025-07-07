<template>
  <Tooltip :delay-duration="0">
    <TooltipTrigger as-child>
      <Button variant="ghost" size="icon">
        <CircleQuestionMark />
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>{{ description }}</p>
    </TooltipContent>
  </Tooltip>
</template>
<script>
import { CircleQuestionMark } from 'lucide-vue-next'

export default {
  components: {
    CircleQuestionMark
  },

  props: {
    description: {
      type: String,
      default: ''
    }
  }
}
</script>
