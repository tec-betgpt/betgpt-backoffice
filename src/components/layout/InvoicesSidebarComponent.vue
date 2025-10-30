<template>
  <SidebarGroup class="group-data-[collapsible=icon]:hidden">
    <SidebarGroupLabel>Cobranças e Custos</SidebarGroupLabel>
    <SidebarMenu>
      <SidebarMenuItem v-for="item in projects" :key="item.name">
        <SidebarMenuButton as-child>
          <a :href="item.url">
            <component :is="item.icon" />
            <span>{{ item.name }}</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarGroup>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { useSidebar } from '@/components/ui/sidebar'
import { ChartArea, FileTextIcon } from "lucide-vue-next"

const { isMobile } = useSidebar()

const projects = ref([
  {
    name: "Faturas",
    url: "#",
    icon: FileTextIcon,
  },
  {
    name: "Consumo",
    url: "#",
    icon: ChartArea,
  }
])
</script>
