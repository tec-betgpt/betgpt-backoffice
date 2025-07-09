<script setup lang="ts">
import {watch, onMounted, computed, ref} from "vue";
import { useRoute } from "vue-router";
import type { SidebarProps } from ".";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SIDEBAR_WIDTH_MOBILE, useSidebar } from "./utils";

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(defineProps<SidebarProps>(), {
  side: "left",
  variant: "sidebar",
  collapsible: "offcanvas",
  collapsed: false,
});


const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

const emit = defineEmits(["update:modelValue"]);

const handleOpen = () => {
  emit("update:modelValue", true);
};
const handleClose = () => {
  emit("update:modelValue", false);
};

const updateCol = async ()=>{
  if (isMobile) {
    handleClose()
  }
}
</script>

<template>
  <div
    v-if="collapsible === 'none'"
    :class="
      cn(
        'flex h-full flex-col bg-sidebar text-sidebar-foreground',
        side === 'left'
            ? 'w-[--sidebar-width]'
            : 'w-96',
        props.class
      )
    "
    v-bind="$attrs"

  >
    <slot />
  </div>

  <Sheet
    v-else-if="isMobile"
    :open="collapsed"
    v-bind="$attrs"
    @update:open="updateCol"
  >
    <SheetContent
      data-sidebar="sidebar"
      data-mobile="true"
      :side="side"
      class="w-[--sidebar-width] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
      :style="{
        '--sidebar-width': SIDEBAR_WIDTH_MOBILE,
      }"
    >
      <div class="flex h-full w-full flex-col">
        <slot />
      </div>
    </SheetContent>
  </Sheet>

  <div
    v-else
    class="group peer hidden md:block"
    :data-state="state"
    :data-collapsible="!collapsed ? collapsible : ''"
    :data-variant="variant"
    :data-side="side"
  >
    <!-- This is what handles the sidebar gap on desktop  -->
    <div
      :class="
        cn(
          'duration-200 relative h-svh  bg-transparent transition-[width] ease-linear',
          side === 'left'
            ? 'w-[--sidebar-width]'
            : 'w-96',
          'group-data-[collapsible=offcanvas]:w-0',
          'group-data-[side=right]:rotate-180',
          variant === 'floating' || variant === 'inset'
            ? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]'
            : 'group-data-[collapsible=icon]:w-[--sidebar-width-icon]'
        )
      "
    />
    <div
      :class="
        cn(
          'duration-200 fixed inset-y-0 z-10 hidden h-svh  transition-[left,right,width] ease-linear md:flex',
          side === 'right' ? 'w-96' : 'w-[--sidebar-width]',
          side === 'left'
            ? 'left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
            : 'right-0 group-data-[collapsible=offcanvas]:right-[calc(24rem*-1)]',          // Adjust the padding for floating and inset variants.
          variant === 'floating' || variant === 'inset'
            ? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]'
            : 'group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l',
          props.class
        )
      "
      v-bind="$attrs"
    >
      <div
        data-sidebar="sidebar"
        class="flex h-full w-full flex-col text-sidebar-foreground bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow"
      >
        <slot />
      </div>
    </div>
  </div>
</template>
