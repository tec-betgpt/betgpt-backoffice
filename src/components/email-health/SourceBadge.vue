<template>
  <Badge variant="outline" class="text-[10px] uppercase tracking-wide font-semibold">
    {{ label }}
  </Badge>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Badge } from "@/components/ui/badge";
import type { PostmasterSourceVersion } from "@/contracts/emailHealth";

const props = defineProps<{ source: PostmasterSourceVersion }>();

const { t } = useI18n();

const label = computed(() => t(`email_health.source.${props.source}`));
</script>
