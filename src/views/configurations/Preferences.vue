<template>
  <div class="space-y-6">
    <SettingsHeader
      title="Preferências"
      description="Aparência e idioma da plataforma."
    />

    <section class="space-y-3">
      <div>
        <h4 class="font-medium">Tema</h4>
        <p class="text-sm text-muted-foreground">Salvo neste navegador.</p>
      </div>
      <div class="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Tema">
        <button
          v-for="option in themeOptions"
          :key="option.value"
          type="button"
          role="radio"
          :aria-checked="theme === option.value"
          :class="
            cn(
              'flex items-center gap-3 rounded-lg border p-4 text-left text-sm transition-colors hover:bg-muted/50',
              theme === option.value && 'border-primary bg-muted/50',
            )
          "
          @click="theme = option.value"
        >
          <component :is="option.icon" class="size-5 text-muted-foreground" />
          <span class="font-medium">{{ option.label }}</span>
        </button>
      </div>
    </section>

    <section class="space-y-3">
      <div>
        <h4 class="font-medium">Idioma</h4>
        <p class="text-sm text-muted-foreground">
          Por enquanto a plataforma está disponível só em português.
        </p>
      </div>
      <Select model-value="pt-BR" disabled>
        <SelectTrigger class="sm:max-w-xs" aria-label="Idioma">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
        </SelectContent>
      </Select>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useColorMode } from "@vueuse/core";
import { MonitorIcon, SunIcon, MoonIcon } from "lucide-vue-next";
import { cn } from "@/lib/utils";
import SettingsHeader from "@/views/configurations/components/SettingsHeader.vue";

const themeOptions = [
  { value: "auto", label: "Sistema", icon: MonitorIcon },
  { value: "light", label: "Claro", icon: SunIcon },
  { value: "dark", label: "Escuro", icon: MoonIcon },
] as const;

const mode = useColorMode();
const theme = ref(localStorage.getItem("theme") || "auto");

watch(theme, (value) => {
  localStorage.setItem("theme", value);
  mode.value = value as typeof mode.value;
});
</script>
