<script setup lang="ts">
import { computed, ref } from "vue";
import moment from "moment";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyIcon, TerminalIcon, Trash2Icon, TriangleAlertIcon } from "lucide-vue-next";
import type { WebhookInspectorRequestDetail } from "@/services/webhookInspector";
import { formatBytes, methodClass } from "./format";

const props = defineProps<{ request: WebhookInspectorRequestDetail }>();
const emit = defineEmits<{ delete: [] }>();

// Headers que o Cloudflare e o nginx adicionam no caminho; não fazem sentido num reenvio.
const PROXY_HEADERS = /^(host|content-length|connection|cdn-loop|true-client-ip|x-real-ip|x-forwarded-.*|cf-.*)$/i;

const prettyBody = ref(true);

const queryParams = computed(() =>
  props.request.query_string ? [...new URLSearchParams(props.request.query_string).entries()] : [],
);

const headers = computed(() => Object.entries(props.request.headers ?? {}));

const isUrlEncoded = computed(() =>
  (props.request.content_type ?? "").toLowerCase().startsWith("application/x-www-form-urlencoded"),
);

const formFields = computed<[string, string][]>(() => {
  if (props.request.form) {
    return flatten(props.request.form);
  }
  if (isUrlEncoded.value && props.request.body && !props.request.body_base64) {
    return [...new URLSearchParams(props.request.body).entries()];
  }
  return [];
});

const parsedJson = computed(() => {
  const body = props.request.body;
  if (!body || props.request.body_base64) return null;
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return null;
  }
});

const displayedBody = computed(() =>
  prettyBody.value && parsedJson.value !== null ? parsedJson.value : props.request.body ?? "",
);

function flatten(value: unknown, prefix = ""): [string, string][] {
  if (value !== null && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, item]) =>
      flatten(item, prefix ? `${prefix}[${key}]` : key),
    );
  }
  return [[prefix, value === null || value === undefined ? "" : String(value)]];
}

function shellQuote(value: string) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

const curl = computed(() => {
  const lines = [`curl -X ${props.request.method} ${shellQuote(props.request.url)}`];
  for (const [name, value] of headers.value) {
    if (!PROXY_HEADERS.test(name)) lines.push(`  -H ${shellQuote(`${name}: ${value}`)}`);
  }
  if (props.request.body && !props.request.body_base64) {
    lines.push(`  --data-raw ${shellQuote(props.request.body)}`);
  }
  return lines.join(" \\\n");
});

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast(`${label} copiado`);
  } catch {
    toast.error("Não foi possível copiar");
  }
}
</script>

<template>
  <div class="space-y-5">
    <div class="space-y-3">
      <div class="flex items-start gap-2">
        <span :class="['rounded px-2 py-0.5 text-xs font-bold', methodClass(request.method)]">
          {{ request.method }}
        </span>
        <code class="text-xs break-all flex-1 pt-0.5">{{ request.url }}</code>
        <Button variant="ghost" size="icon" class="size-7 shrink-0" title="Copiar URL" @click="copy(request.url, 'URL')">
          <CopyIcon class="size-3.5" />
        </Button>
      </div>

      <dl class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div>
          <dt class="text-xs text-muted-foreground">Recebida em</dt>
          <dd>{{ moment(request.created_at).format("DD/MM/YYYY HH:mm:ss.SSS") }}</dd>
        </div>
        <div>
          <dt class="text-xs text-muted-foreground">IP de origem</dt>
          <dd class="font-mono">{{ request.ip ?? "—" }}</dd>
        </div>
        <div>
          <dt class="text-xs text-muted-foreground">Tamanho</dt>
          <dd>{{ formatBytes(request.size) }}</dd>
        </div>
        <div>
          <dt class="text-xs text-muted-foreground">Content-Type</dt>
          <dd class="break-all">{{ request.content_type ?? "—" }}</dd>
        </div>
      </dl>

      <div class="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" @click="copy(curl, 'cURL')">
          <TerminalIcon class="size-4 mr-1.5" /> Copiar como cURL
        </Button>
        <Button v-if="request.body" variant="outline" size="sm" @click="copy(request.body, 'Corpo')">
          <CopyIcon class="size-4 mr-1.5" /> Copiar corpo
        </Button>
        <Button variant="outline" size="sm" class="text-destructive" @click="emit('delete')">
          <Trash2Icon class="size-4 mr-1.5" /> Excluir
        </Button>
      </div>
    </div>

    <section v-if="queryParams.length" class="space-y-2">
      <h3 class="text-sm font-semibold">Query string</h3>
      <div class="border rounded-md divide-y text-xs">
        <div v-for="([name, value], index) in queryParams" :key="`q-${index}`" class="grid grid-cols-[minmax(120px,30%)_1fr] gap-3 px-3 py-1.5">
          <span class="font-mono font-medium break-all">{{ name }}</span>
          <span class="font-mono break-all whitespace-pre-wrap">{{ value }}</span>
        </div>
      </div>
    </section>

    <section v-if="formFields.length" class="space-y-2">
      <h3 class="text-sm font-semibold">Campos do formulário</h3>
      <div class="border rounded-md divide-y text-xs">
        <div v-for="([name, value], index) in formFields" :key="`f-${index}`" class="grid grid-cols-[minmax(120px,30%)_1fr] gap-3 px-3 py-1.5">
          <span class="font-mono font-medium break-all">{{ name }}</span>
          <span class="font-mono break-all whitespace-pre-wrap">{{ value }}</span>
        </div>
      </div>
    </section>

    <section v-if="request.files?.length" class="space-y-2">
      <h3 class="text-sm font-semibold">Arquivos</h3>
      <div class="border rounded-md divide-y text-xs">
        <div v-for="file in request.files" :key="file.field + file.name" class="flex flex-wrap gap-x-4 gap-y-1 px-3 py-1.5">
          <span class="font-mono font-medium">{{ file.field }}</span>
          <span>{{ file.name }}</span>
          <span class="text-muted-foreground">{{ file.mime ?? "—" }}</span>
          <span class="text-muted-foreground">{{ formatBytes(file.size) }}</span>
        </div>
      </div>
      <p class="text-xs text-muted-foreground">Só os metadados dos arquivos são guardados.</p>
    </section>

    <section class="space-y-2">
      <div class="flex items-center justify-between gap-2">
        <h3 class="text-sm font-semibold">Corpo</h3>
        <div v-if="parsedJson !== null" class="flex items-center gap-1 text-xs">
          <Button :variant="prettyBody ? 'secondary' : 'ghost'" size="sm" class="h-7" @click="prettyBody = true">Formatado</Button>
          <Button :variant="!prettyBody ? 'secondary' : 'ghost'" size="sm" class="h-7" @click="prettyBody = false">Bruto</Button>
        </div>
      </div>
      <div v-if="request.body_truncated || request.body_base64" class="flex flex-col gap-1">
        <p v-if="request.body_truncated" class="flex items-center gap-1.5 text-xs text-amber-600">
          <TriangleAlertIcon class="size-3.5" /> Corpo maior que o limite: só o começo foi guardado.
        </p>
        <p v-if="request.body_base64" class="flex items-center gap-1.5 text-xs text-muted-foreground">
          <TriangleAlertIcon class="size-3.5" /> Conteúdo binário, exibido em base64.
        </p>
      </div>
      <pre
        v-if="request.body"
        class="bg-muted rounded-md p-3 text-xs font-mono whitespace-pre-wrap break-all max-h-[480px] overflow-auto"
      >{{ displayedBody }}</pre>
      <p v-else class="text-xs text-muted-foreground">
        {{ request.form ? "Multipart: os campos estão acima." : "Sem corpo." }}
      </p>
    </section>

    <section class="space-y-2">
      <h3 class="text-sm font-semibold">
        Headers <Badge variant="outline" class="ml-1">{{ headers.length }}</Badge>
      </h3>
      <div class="border rounded-md divide-y text-xs">
        <div v-for="[name, value] in headers" :key="name" class="grid grid-cols-[minmax(120px,30%)_1fr] gap-3 px-3 py-1.5">
          <span class="font-mono font-medium break-all">{{ name }}</span>
          <span class="font-mono break-all whitespace-pre-wrap">{{ value }}</span>
        </div>
      </div>
    </section>
  </div>
</template>
