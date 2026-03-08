<script setup lang="ts">
import type { ListboxRootEmits, ListboxRootProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { ListboxRoot, useFilter, useForwardPropsEmits } from "reka-ui"
import { reactive, ref, watch, toRef } from "vue"
import { cn } from "@/lib/utils"
import { provideCommandContext } from "."

const props = withDefaults(defineProps<ListboxRootProps & { class?: HTMLAttributes["class"], filterResults?: boolean }>(), {
  modelValue: "",
  filterResults: true,
})

const emits = defineEmits<ListboxRootEmits>()

const delegatedProps = reactiveOmit(props, "class", "filterResults")

const forwarded = useForwardPropsEmits(delegatedProps, emits)

const allItems = ref<Map<string, string>>(new Map())
const allGroups = ref<Map<string, Set<string>>>(new Map())

const { contains } = useFilter({ sensitivity: "base" })
const filterState = reactive({
  search: "",
  filtered: {
    /** The count of all visible items. */
    count: 0,
    /** Map from visible item id to its search score. */
    items: new Map() as Map<string, number>,
    /** Set of groups with at least one visible item. */
    groups: new Set() as Set<string>,
  },
})

function filterItems() {
  const search = filterState.search
  const filterEnabled = props.filterResults

  if (!search || !filterEnabled) {
    filterState.filtered.count = allItems.value.size
    filterState.filtered.items.clear()
    for (const [id] of allItems.value) {
      filterState.filtered.items.set(id, 1)
    }
    filterState.filtered.groups = new Set(allGroups.value.keys())
    return
  }

  // Reset the groups
  filterState.filtered.groups = new Set()
  let itemCount = 0

  // Check which items should be included
  for (const [id, value] of allItems.value) {
    const score = contains(value, search)
    filterState.filtered.items.set(id, score ? 1 : 0)
    if (score)
      itemCount++
  }

  // Check which groups have at least 1 item shown
  for (const [groupId, group] of allGroups.value) {
    for (const itemId of group) {
      if (filterState.filtered.items.get(itemId)! > 0) {
        filterState.filtered.groups.add(groupId)
        break
      }
    }
  }

  filterState.filtered.count = itemCount
}

watch(() => [filterState.search, props.filterResults], () => {
  filterItems()
})

provideCommandContext({
  allItems,
  allGroups,
  filterState,
  filterResults: toRef(props, "filterResults"),
  registerItem: (id: string, value: string) => {
    allItems.value.set(id, value)
    filterItems()
  },
  unregisterItem: (id: string) => {
    allItems.value.delete(id)
    filterItems()
  },
  registerGroup: (id: string) => {
    if (!allGroups.value.has(id)) {
      allGroups.value.set(id, new Set())
      filterItems()
    }
  },
  unregisterGroup: (id: string) => {
    allGroups.value.delete(id)
    filterItems()
  },
})
</script>

<template>
  <ListboxRoot
    v-bind="forwarded"
    :class="cn('flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground', props.class)"
  >
    <slot />
  </ListboxRoot>
</template>
