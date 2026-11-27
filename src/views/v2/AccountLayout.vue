<script setup lang="ts">
import { computed } from "vue";
import { RouterView, useRoute } from "vue-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ACCOUNT_NAV } from "@/navigation/registry";

const route = useRoute();
const activeRoute = computed(() => route.meta.navRoute ?? route.name);
const routeName = (item: (typeof ACCOUNT_NAV)[number]) => (item.to as { name: string }).name;
</script>

<template>
  <div class="mx-auto w-full max-w-5xl pb-10">
    <div class="flex flex-col gap-6 md:flex-row md:gap-10">
      <nav class="md:w-52 md:shrink-0">
        <p class="hidden px-3 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground md:block">
          Minha conta
        </p>
        <div class="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 md:mx-0 md:flex-col md:overflow-visible md:p-0">
          <Button
            v-for="item in ACCOUNT_NAV"
            :key="item.id"
            variant="ghost"
            :class="
              cn(
                'shrink-0 justify-start font-normal md:w-full',
                activeRoute === routeName(item)
                  ? 'bg-muted font-medium text-foreground hover:bg-muted'
                  : 'text-muted-foreground',
              )
            "
            as-child
          >
            <router-link :to="{ name: routeName(item) }">
              <component :is="item.icon" class="size-4" />
              {{ item.label }}
            </router-link>
          </Button>
        </div>
      </nav>

      <div class="min-w-0 flex-1">
        <RouterView />
      </div>
    </div>
  </div>
</template>
