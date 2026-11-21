<template>
  <div
    class="inline-block"
    data-campaign-templates
    @mouseenter="openPopover"
    @mouseleave="scheduleClose"
    @focusin="openPopover"
    @focusout="onFocusOut"
  >
    <Popover v-model:open="isPopoverOpen">
      <PopoverTrigger as-child>
        <Button variant="outline" size="sm" :disabled="templates.length === 0">
          <Images class="mr-2 size-4" />
          {{ templates.length }} {{ templates.length === 1 ? "template" : "templates" }}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        data-campaign-templates
        class="w-80 p-2"
        @mouseenter="openPopover"
        @mouseleave="scheduleClose"
        @focusin="openPopover"
        @focusout="onFocusOut"
      >
        <div class="px-2 pb-2 pt-1 text-xs font-medium text-muted-foreground">Templates da campanha</div>
        <div class="max-h-72 space-y-1 overflow-y-auto">
          <button
            v-for="template in templates"
            :key="`${template.channel}-${template.id}`"
            type="button"
            class="flex w-full items-center gap-3 rounded-md p-2 text-left transition hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
            @click="preview(template)"
          >
            <span
              class="flex size-8 shrink-0 items-center justify-center rounded-md border"
              :class="CAMPAIGN_CHANNEL_COLOR_CLASSES[template.channel]"
            >
              <component :is="CAMPAIGN_CHANNEL_ICONS[template.channel]" class="size-4" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium">{{ template.name }}</span>
              <span class="block truncate text-xs text-muted-foreground">{{ template.subject || channelLabel(template.channel) }}</span>
            </span>
            <Eye class="size-4 shrink-0 text-muted-foreground" />
            <span class="sr-only">Pré-visualizar {{ template.name }}</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>

    <MarketingAssetPreviewDialog v-model:open="isPreviewOpen" :asset="selectedTemplate" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import { Eye, Images } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import MarketingAssetPreviewDialog from "@/components/marketing/MarketingAssetPreviewDialog.vue";
import { MARKETING_CHANNEL_LABELS, type MarketingAsset, type MarketingChannel } from "@/contracts/marketingAssets";
import { CAMPAIGN_CHANNEL_COLOR_CLASSES, CAMPAIGN_CHANNEL_ICONS } from "./campaignPresentation";

defineProps<{ templates: MarketingAsset[] }>();

const isPopoverOpen = ref(false);
const isPreviewOpen = ref(false);
const selectedTemplate = ref<MarketingAsset | null>(null);
let closeTimer: number | null = null;

function openPopover() {
  cancelClose();
  isPopoverOpen.value = true;
}

function scheduleClose() {
  cancelClose();
  closeTimer = window.setTimeout(() => {
    isPopoverOpen.value = false;
  }, 150);
}

function onFocusOut(event: FocusEvent) {
  const next = event.relatedTarget as HTMLElement | null;
  if (next?.closest("[data-campaign-templates]")) return;
  scheduleClose();
}

function preview(template: MarketingAsset) {
  selectedTemplate.value = template;
  isPreviewOpen.value = true;
  isPopoverOpen.value = false;
}

function cancelClose() {
  if (closeTimer) window.clearTimeout(closeTimer);
  closeTimer = null;
}

function channelLabel(channel: MarketingChannel) {
  return MARKETING_CHANNEL_LABELS[channel];
}

onBeforeUnmount(cancelClose);
</script>
