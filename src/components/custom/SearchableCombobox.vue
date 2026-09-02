<script lang="ts">
export type SearchableComboboxOption = {
  value: string | number;
  label: string;
  color?: string;
};
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null;
    options?: SearchableComboboxOption[];
    loadOptions?: (search: string) => Promise<SearchableComboboxOption[]>;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    disabled?: boolean;
    contentClass?: string;
  }>(),
  {
    modelValue: null,
    options: () => [],
    loadOptions: undefined,
    placeholder: 'Selecione',
    searchPlaceholder: 'Buscar...',
    emptyText: 'Nenhum resultado encontrado.',
    disabled: false,
    contentClass: 'w-[300px]',
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | null): void;
}>();

const open = ref(false);
const isSearching = ref(false);
const searchQuery = ref('');
const asyncOptions = ref<SearchableComboboxOption[]>([]);
const selectedOption = ref<SearchableComboboxOption | null>(null);
let searchTimeout: any = null;

const isAsync = computed(() => typeof props.loadOptions === 'function');

const items = computed<SearchableComboboxOption[]>(() => {
  if (isAsync.value) return asyncOptions.value;

  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return props.options;

  return props.options.filter((option) =>
    option.label.toLowerCase().includes(query)
  );
});

const selectedLabel = computed(() => {
  if (selectedOption.value && String(selectedOption.value.value) === String(props.modelValue)) {
    return selectedOption.value.label;
  }

  const found = [...props.options, ...asyncOptions.value].find(
    (option) => String(option.value) === String(props.modelValue)
  );

  return found?.label || '';
});

const fetchOptions = async (search = '') => {
  if (!props.loadOptions) return;

  isSearching.value = true;
  try {
    asyncOptions.value = await props.loadOptions(search);
  } catch (error) {
    console.error('Error loading combobox options:', error);
    asyncOptions.value = [];
  } finally {
    isSearching.value = false;
  }
};

const onSearch = (e: any) => {
  const query = typeof e === 'string' ? e : e.target?.value;
  if (query === undefined) return;

  searchQuery.value = query;

  if (!isAsync.value) return;

  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchOptions(query);
  }, 400);
};

const select = (option: SearchableComboboxOption) => {
  selectedOption.value = option;
  emit('update:modelValue', option.value);
  open.value = false;
};

watch(open, (value) => {
  if (value && isAsync.value) fetchOptions(searchQuery.value);
});

watch(
  () => props.modelValue,
  (value) => {
    if (value === null || value === undefined || value === '') {
      selectedOption.value = null;
    }
  }
);
</script>

<template>
  <div v-bind="$attrs">
    <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        role="combobox"
        :aria-expanded="open"
        :disabled="disabled"
        class="w-full justify-between text-left font-normal"
      >
        <span class="flex items-center gap-2 truncate">
          <span
            v-if="selectedOption?.color"
            class="w-2 h-2 rounded-full shrink-0"
            :style="{ backgroundColor: selectedOption.color }"
          ></span>
          <span class="truncate">{{ selectedLabel || placeholder }}</span>
        </span>
        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent :class="['p-0', contentClass]" align="start">
      <Command :filter-results="false">
        <CommandInput :placeholder="searchPlaceholder" @input="onSearch" />
        <div v-if="isSearching" class="flex items-center justify-center p-4">
          <Loader2 class="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
        <template v-else>
          <CommandEmpty v-if="items.length === 0">{{ emptyText }}</CommandEmpty>
          <CommandList v-else>
            <CommandGroup>
              <CommandItem
                v-for="option in items"
                :key="option.value"
                :value="String(option.value)"
                @select="() => select(option)"
              >
                <Check
                  :class="[
                    'mr-2 h-4 w-4 shrink-0',
                    String(modelValue) === String(option.value) ? 'opacity-100' : 'opacity-0',
                  ]"
                />
                <span
                  v-if="option.color"
                  class="w-2 h-2 rounded-full shrink-0 mr-2"
                  :style="{ backgroundColor: option.color }"
                ></span>
                <span class="truncate">{{ option.label }}</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </template>
      </Command>
    </PopoverContent>
    </Popover>
  </div>
</template>
