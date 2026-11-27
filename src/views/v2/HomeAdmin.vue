<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import moment from "moment";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  CircleCheck,
  CircleDollarSign,
  Clock3,
  Cpu,
  Inbox,
  RadioTower,
  ReceiptText,
  RefreshCcw,
  Search,
} from "lucide-vue-next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ProjectAvatar from "@/components/custom/ProjectAvatar.vue";
import AdminOverviewService, {
  type AdminOverview,
  type AdminOverviewProject,
  type BillingState,
  type PostbackState,
} from "@/services/adminOverview";
import toCurrency from "@/filters/currencyFilter";
import { useAuthStore } from "@/stores/auth";
import { useShellStore } from "@/stores/shell";
import { useWorkspaceStore } from "@/stores/workspace";
import { cn } from "@/lib/utils";

const router = useRouter();
const auth = useAuthStore();
const shell = useShellStore();
const workspace = useWorkspaceStore();

const overview = ref<AdminOverview | null>(null);
const loading = ref(true);
const unavailable = ref(false);
const search = ref("");
const filter = ref<"all" | "stopped" | "attention" | "overdue">("all");

const firstName = computed(() => (auth.user as any)?.first_name ?? "");

// O workspace salvo na conta é o último usado, em qualquer computador.
const lastWorkspace = computed(() => workspace.activeGroupProject);
const otherRecents = computed(() =>
  shell.recents
    .filter((id) => id !== lastWorkspace.value?.id)
    .map((id) => workspace.group_projects.find((item) => item.id === id))
    .filter(Boolean)
    .slice(0, 4) as typeof workspace.group_projects,
);

const enter = (workspaceId: string) =>
  router.push({ name: "workspace.home", params: { workspace: workspaceId } });

const canEnter = (project: AdminOverviewProject) =>
  workspace.group_projects.some((item) => item.id === project.workspace_id);

const POSTBACK: Record<PostbackState, { label: string; dot: string; text: string }> = {
  ok: { label: "Recebendo", dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  attention: { label: "Atenção", dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
  stopped: { label: "Parado", dot: "bg-rose-500", text: "text-rose-600 dark:text-rose-400" },
  never: { label: "Nunca recebeu", dot: "bg-zinc-400", text: "text-muted-foreground" },
};

const BILLING: Record<BillingState, { label: string; class: string }> = {
  ok: { label: "Em dia", class: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  pending: { label: "A vencer", class: "bg-sky-500/10 text-sky-700 dark:text-sky-400" },
  overdue: { label: "Vencida", class: "bg-rose-500/10 text-rose-700 dark:text-rose-400" },
  none: { label: "Sem fatura", class: "bg-muted text-muted-foreground" },
};

const sinceLabel = (project: AdminOverviewProject) => {
  const { last_at } = project.postback;
  return last_at ? moment(last_at).fromNow() : "sem registro";
};

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const STATE_ORDER: Record<PostbackState, number> = { stopped: 0, attention: 1, never: 2, ok: 3 };

const projects = computed(() => {
  const list = (overview.value?.projects ?? []).filter((p) => p.active);
  return list
    .filter((p) => !search.value || normalize(p.name).includes(normalize(search.value)))
    .filter((p) => {
      if (filter.value === "stopped") return p.postback.state === "stopped";
      if (filter.value === "attention") return p.postback.state === "attention";
      if (filter.value === "overdue") return p.billing.state === "overdue";
      return true;
    })
    .sort(
      (a, b) =>
        STATE_ORDER[a.postback.state] - STATE_ORDER[b.postback.state] ||
        (b.billing.state === "overdue" ? 1 : 0) - (a.billing.state === "overdue" ? 1 : 0) ||
        b.postback.count_24h - a.postback.count_24h,
    );
});

const filters = computed(() => {
  const t = overview.value?.totals;
  return [
    { id: "all", label: "Todos", count: t?.projects_active ?? 0 },
    { id: "stopped", label: "Parados", count: t?.projects_stopped ?? 0 },
    { id: "attention", label: "Atenção", count: t?.projects_attention ?? 0 },
    { id: "overdue", label: "Com fatura vencida", count: (overview.value?.projects ?? []).filter((p) => p.billing.state === "overdue").length },
  ] as const;
});

const alerts = computed(() => {
  if (!overview.value) return [];
  const list: Array<{ tone: "bad" | "warn"; title: string; text: string; action?: () => void; actionLabel?: string }> = [];
  const stopped = overview.value.projects.filter((p) => p.active && p.postback.state === "stopped");
  if (stopped.length) {
    list.push({
      tone: "bad",
      title: `${stopped.length} ${stopped.length === 1 ? "projeto parado" : "projetos parados"} há mais de 24 h`,
      text: stopped.slice(0, 3).map((p) => p.name).join(", ") + (stopped.length > 3 ? "…" : ""),
      action: () => (filter.value = "stopped"),
      actionLabel: "Ver",
    });
  }
  const t = overview.value.totals;
  if (t.invoices_overdue_count) {
    list.push({
      tone: "bad",
      title: `${t.invoices_overdue_count} ${t.invoices_overdue_count === 1 ? "fatura vencida" : "faturas vencidas"}`,
      text: `${toCurrency(t.invoices_overdue_amount)} em aberto`,
      action: () => (filter.value = "overdue"),
      actionLabel: "Ver",
    });
  }
  const failed = overview.value.platform.failed_jobs_24h;
  if (failed) {
    list.push({ tone: "warn", title: `${failed} jobs com falha nas últimas 24 h`, text: "Vale olhar a fila antes que vire atraso de postback." });
  }
  return list;
});

const kpis = computed(() => {
  const t = overview.value?.totals;
  if (!t) return [];
  return [
    { label: "Projetos ativos", value: t.projects_active.toLocaleString("pt-BR"), hint: `${t.projects_ok} recebendo postback`, icon: Building2 },
    { label: "Postbacks em 24 h", value: t.postbacks_24h.toLocaleString("pt-BR"), hint: `${t.projects_stopped} parados · ${t.projects_attention} em atenção`, icon: RadioTower },
    { label: "A receber", value: toCurrency(t.invoices_pending_amount), hint: `${t.invoices_pending_count} faturas em aberto`, icon: ReceiptText },
    { label: "Recebido em 30 dias", value: toCurrency(t.invoices_paid_30d_amount), hint: `${toCurrency(t.invoices_overdue_amount)} vencido`, icon: CircleDollarSign },
  ];
});

const sparkPoints = (values: number[]) => {
  if (!values?.length) return "";
  const max = Math.max(...values, 1);
  const step = 100 / Math.max(values.length - 1, 1);
  return values.map((v, i) => `${(i * step).toFixed(1)},${(28 - (v / max) * 26).toFixed(1)}`).join(" ");
};

const load = async () => {
  loading.value = true;
  unavailable.value = false;
  try {
    overview.value = await AdminOverviewService.show();
  } catch (_) {
    unavailable.value = true;
  }
  loading.value = false;
};

onMounted(load);
</script>

<template>
  <div class="mx-auto w-full max-w-7xl pb-12">
    <div class="flex flex-col gap-3 pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Olá{{ firstName ? `, ${firstName}` : "" }}</h1>
        <p class="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          Como estão as contas e a plataforma agora
          <template v-if="overview">
            · {{ moment(overview.generated_at).format("HH:mm") }}
            <button type="button" class="rounded p-0.5 hover:text-foreground" title="Atualizar" @click="load">
              <RefreshCcw class="size-3.5" :class="loading && 'animate-spin'" />
            </button>
          </template>
        </p>
      </div>
    </div>

    <Card v-if="lastWorkspace" class="mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div class="flex min-w-0 flex-1 items-center gap-3">
        <ProjectAvatar class="size-10 shrink-0" shape="square" :name="lastWorkspace.name" :logo-url="lastWorkspace.logo" />
        <div class="min-w-0">
          <p class="text-xs text-muted-foreground">Último workspace usado</p>
          <p class="truncate font-semibold">{{ lastWorkspace.name }}</p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="item in otherRecents"
          :key="item.id"
          type="button"
          class="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs hover:bg-accent"
          @click="enter(item.id)"
        >
          <Clock3 class="size-3 text-muted-foreground" />
          {{ item.name }}
        </button>
        <Button size="sm" class="gap-1.5" @click="enter(lastWorkspace.id)">
          Continuar em {{ lastWorkspace.name }}
          <ArrowRight class="size-4" />
        </Button>
      </div>
    </Card>

    <Card v-if="unavailable" class="mb-4 flex items-start gap-3 border-dashed p-4">
      <Inbox class="mt-0.5 size-5 shrink-0 text-muted-foreground" />
      <div class="text-sm">
        <p class="font-medium">Os números da visão geral ainda não chegaram</p>
        <p class="text-muted-foreground">
          Eles vêm de <code class="rounded bg-muted px-1">GET /v1/admin/overview</code>, que precisa estar na API deste ambiente.
          Enquanto isso, use o seletor de workspace ou <kbd class="rounded border px-1 text-xs">⌘K</kbd> para entrar num cliente.
        </p>
        <Button variant="outline" size="sm" class="mt-2" @click="load">Tentar de novo</Button>
      </div>
    </Card>

    <div v-if="alerts.length" class="mb-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="alert in alerts"
        :key="alert.title"
        :class="cn(
          'flex items-start gap-3 rounded-lg border p-3 text-sm',
          alert.tone === 'bad' ? 'border-rose-500/30 bg-rose-500/5' : 'border-amber-500/30 bg-amber-500/5',
        )"
      >
        <AlertTriangle :class="cn('mt-0.5 size-4 shrink-0', alert.tone === 'bad' ? 'text-rose-600' : 'text-amber-600')" />
        <div class="min-w-0 flex-1">
          <p class="font-medium">{{ alert.title }}</p>
          <p class="truncate text-muted-foreground">{{ alert.text }}</p>
        </div>
        <Button v-if="alert.action" variant="ghost" size="sm" class="h-7" @click="alert.action">{{ alert.actionLabel }}</Button>
      </div>
    </div>

    <div v-if="loading && !overview" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Skeleton v-for="n in 4" :key="n" class="h-[104px] rounded-xl" />
    </div>
    <div v-else-if="kpis.length" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card v-for="kpi in kpis" :key="kpi.label" class="p-4">
        <div class="flex items-start justify-between gap-3">
          <p class="text-sm text-muted-foreground">{{ kpi.label }}</p>
          <span class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <component :is="kpi.icon" class="size-4" />
          </span>
        </div>
        <p class="mt-1 text-2xl font-semibold tabular-nums">{{ kpi.value }}</p>
        <p class="mt-1 text-xs text-muted-foreground">{{ kpi.hint }}</p>
      </Card>
    </div>

    <div v-if="overview || loading" class="mt-4 grid gap-4 xl:grid-cols-3">
      <Card class="overflow-hidden xl:col-span-2">
        <div class="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center">
          <div class="flex-1">
            <h2 class="font-semibold">Projetos dos clientes</h2>
            <p class="text-xs text-muted-foreground">Postback e fatura de cada um. Os parados aparecem primeiro.</p>
          </div>
          <div class="flex h-9 items-center gap-2 rounded-md border px-2.5 sm:w-56">
            <Search class="size-4 text-muted-foreground" />
            <input v-model="search" type="text" placeholder="Buscar projeto" class="w-full bg-transparent text-sm outline-none" />
          </div>
        </div>
        <div class="flex gap-1.5 overflow-x-auto border-b px-4 py-2">
          <button
            v-for="f in filters"
            :key="f.id"
            type="button"
            :class="cn(
              'shrink-0 rounded-full px-3 py-1 text-xs transition-colors',
              filter === f.id ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground',
            )"
            @click="filter = f.id"
          >
            {{ f.label }} <span class="opacity-70">{{ f.count }}</span>
          </button>
        </div>

        <div v-if="loading && !overview" class="space-y-2 p-4">
          <Skeleton v-for="n in 6" :key="n" class="h-10 w-full" />
        </div>
        <div v-else class="max-h-[34rem] overflow-y-auto">
          <table class="w-full text-sm">
            <thead class="sticky top-0 bg-card text-left text-xs text-muted-foreground">
              <tr class="border-b">
                <th class="px-4 py-2 font-medium">Projeto</th>
                <th class="px-2 py-2 font-medium">Postback</th>
                <th class="hidden px-2 py-2 font-medium md:table-cell">Últimas 24 h</th>
                <th class="hidden px-2 py-2 font-medium sm:table-cell">Fatura</th>
                <th class="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="project in projects" :key="project.id" class="border-b last:border-0 hover:bg-muted/40">
                <td class="px-4 py-2.5">
                  <div class="flex min-w-0 items-center gap-2.5">
                    <ProjectAvatar class="size-7 shrink-0" shape="square" :name="project.name" :logo-url="project.logo" />
                    <span class="truncate font-medium">{{ project.name }}</span>
                  </div>
                </td>
                <td class="px-2 py-2.5">
                  <div class="flex items-center gap-2">
                    <span :class="cn('size-2 shrink-0 rounded-full', POSTBACK[project.postback.state].dot)" />
                    <div class="leading-tight">
                      <p :class="cn('text-xs font-medium', POSTBACK[project.postback.state].text)">
                        {{ POSTBACK[project.postback.state].label }}
                      </p>
                      <p class="text-[11px] text-muted-foreground">{{ sinceLabel(project) }}</p>
                    </div>
                  </div>
                </td>
                <td class="hidden px-2 py-2.5 md:table-cell">
                  <div class="flex items-center gap-2">
                    <svg viewBox="0 0 100 30" class="h-6 w-24 text-primary" preserveAspectRatio="none" aria-hidden="true">
                      <polyline
                        :points="sparkPoints(project.postback.hourly_24h)"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                        vector-effect="non-scaling-stroke"
                      />
                    </svg>
                    <span class="text-xs tabular-nums text-muted-foreground">{{ project.postback.count_24h.toLocaleString("pt-BR") }}</span>
                  </div>
                </td>
                <td class="hidden px-2 py-2.5 sm:table-cell">
                  <span :class="cn('rounded px-1.5 py-0.5 text-[11px] font-medium', BILLING[project.billing.state].class)">
                    {{ BILLING[project.billing.state].label }}
                  </span>
                  <span v-if="project.billing.state === 'overdue'" class="ml-1.5 text-xs tabular-nums text-muted-foreground">
                    {{ toCurrency(project.billing.overdue_amount) }}
                  </span>
                </td>
                <td class="px-4 py-2.5 text-right">
                  <Button
                    v-if="canEnter(project)"
                    variant="outline"
                    size="sm"
                    class="h-7 gap-1"
                    @click="enter(project.workspace_id)"
                  >
                    Entrar
                    <ArrowRight class="size-3.5" />
                  </Button>
                </td>
              </tr>
              <tr v-if="!projects.length">
                <td colspan="5" class="px-4 py-10 text-center text-sm text-muted-foreground">Nenhum projeto neste filtro.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <div class="flex flex-col gap-4">
        <Card class="p-4">
          <h2 class="flex items-center gap-2 font-semibold"><Activity class="size-4 text-primary" /> Saúde da plataforma</h2>
          <div v-if="overview" class="mt-3 space-y-2.5 text-sm">
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-2 text-muted-foreground"><RadioTower class="size-4" /> Último postback</span>
              <span class="font-medium">{{ overview.platform.last_postback_at ? moment(overview.platform.last_postback_at).fromNow() : "—" }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-2 text-muted-foreground"><AlertTriangle class="size-4" /> Jobs com falha (24 h)</span>
              <span :class="cn('font-medium tabular-nums', overview.platform.failed_jobs_24h ? 'text-amber-600' : '')">
                {{ overview.platform.failed_jobs_24h ?? "—" }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-2 text-muted-foreground"><Cpu class="size-4" /> Fila pendente</span>
              <span class="font-medium tabular-nums">{{ overview.platform.queue_pending ?? "—" }}</span>
            </div>
            <p
              v-if="!overview.platform.failed_jobs_24h && overview.totals.projects_stopped === 0"
              class="flex items-center gap-1.5 pt-1 text-xs text-emerald-600 dark:text-emerald-400"
            >
              <CircleCheck class="size-3.5" /> Tudo rodando
            </p>
          </div>
          <Skeleton v-else class="mt-3 h-24 w-full" />
        </Card>

        <Card class="p-4">
          <h2 class="flex items-center gap-2 font-semibold"><ReceiptText class="size-4 text-primary" /> Próximos vencimentos</h2>
          <ul v-if="overview?.invoices_upcoming.length" class="mt-2 divide-y">
            <li v-for="invoice in overview.invoices_upcoming" :key="invoice.id" class="flex items-center gap-3 py-2 text-sm">
              <div class="min-w-0 flex-1">
                <p class="truncate font-medium">{{ invoice.account_name ?? invoice.name }}</p>
                <p class="text-xs text-muted-foreground">
                  {{ invoice.due_at ? moment(invoice.due_at).format("DD/MM") : "sem data" }}
                  <span v-if="invoice.status === 'OVERDUE'" class="text-rose-600"> · vencida</span>
                </p>
              </div>
              <span class="font-medium tabular-nums">{{ toCurrency(Number(invoice.amount)) }}</span>
            </li>
          </ul>
          <p v-else-if="overview" class="py-6 text-center text-sm text-muted-foreground">Nenhuma fatura em aberto.</p>
          <Skeleton v-else class="mt-3 h-24 w-full" />
        </Card>
      </div>
    </div>
  </div>
</template>
