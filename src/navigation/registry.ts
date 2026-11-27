import type { Component } from "vue";
import type { RouteLocationNamedRaw } from "vue-router";
import {
  Activity,
  Album,
  ArrowLeftRight,
  BadgeCheck,
  Blocks,
  Bot,
  Brain,
  Briefcase,
  Building2,
  ChartArea,
  ChartBarBig,
  ChartNoAxesColumnIncreasing,
  ChartNoAxesCombined,
  CircleDollarSign,
  Download,
  ExternalLink,
  FileText,
  Gauge,
  Goal,
  HeartPulse,
  History,
  KeyRound,
  Landmark,
  LayoutDashboard,
  LayoutList,
  LineChart,
  Link2,
  ListChecks,
  ListFilter,
  Logs,
  Mail,
  MailCheck,
  Megaphone,
  MessageCircleMore,
  MessageSquareText,
  PencilLine,
  PhoneCall,
  PieChart,
  RadioReceiver,
  RadioTower,
  ReceiptText,
  Rows3,
  Send,
  Server,
  ServerCog,
  Settings,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  SquareStack,
  Tag,
  Target,
  UserCheck,
  UserCog,
  UserRoundCog,
  Users2,
  View,
  Wallet,
  Waypoints,
  Webhook,
} from "lucide-vue-next";
import { WEBHOOK_INSPECTOR_ROLES } from "@/services/webhookInspector";

export type Area = "admin" | "workspace" | "account";

export interface NavItem {
  id: string;
  label: string;
  icon: Component;
  to: RouteLocationNamedRaw | ((ctx: NavContext) => RouteLocationNamedRaw | null);
  /** Basta uma das permissões. */
  perm?: string[];
  /** Alternativa à permissão, para telas que hoje são liberadas por perfil. */
  roles?: string[];
  /** Só aparece para membros da Elevate (marcado "Só Elevate" no workspace). */
  internal?: boolean;
  workspaceType?: "project" | "group";
  /** Regra extra que não cabe em permissão (ex.: chaves de marketing do grupo). */
  when?: (ctx: NavContext) => boolean;
  /** Outras rotas que deixam este item ativo (telas de detalhe). */
  activeFor?: string[];
}

export interface NavGroup {
  id: string;
  label?: string;
  icon?: Component;
  internal?: boolean;
  items: NavItem[];
}

export interface NavContext {
  projectId: number | null;
  groupId: number | null;
  workspaceType: "project" | "group" | null;
  canManageMarketingApiKeys: boolean;
}

const LEADS = ["member-proprietor", "member-admin", "member-developer"];
const TECH_LEADS = ["member-proprietor", "member-developer"];

export const ADMIN_NAV: NavGroup[] = [
  {
    id: "admin-top",
    items: [
      { id: "admin-home", label: "Visão geral", icon: LayoutDashboard, to: { name: "admin.home" } },
    ],
  },
  {
    id: "contas",
    label: "Contas",
    icon: Landmark,
    items: [
      { id: "subscribers", label: "Assinantes", icon: UserCheck, to: { name: "subscribers" }, perm: ["access-to-subscribers"], roles: LEADS },
      { id: "projects", label: "Projetos", icon: Building2, to: { name: "projects" }, perm: ["view-projects", "access-to-project-groups"] },
      { id: "services", label: "Planos e serviços", icon: Briefcase, to: { name: "services" }, perm: ["access-to-services"], roles: LEADS },
    ],
  },
  {
    id: "financeiro",
    label: "Financeiro Elevate",
    icon: CircleDollarSign,
    items: [
      { id: "registers", label: "Entradas e saídas", icon: ArrowLeftRight, to: { name: "registers" }, perm: ["access-to-finance"] },
      { id: "sectors", label: "Setores", icon: Briefcase, to: { name: "sectors" }, perm: ["access-to-finance"] },
      { id: "costs", label: "Custos", icon: Rows3, to: { name: "costs" }, perm: ["access-to-finance"] },
    ],
  },
  {
    id: "consumo",
    label: "Consumo das contas",
    icon: Gauge,
    items: [
      { id: "resource-usage", label: "Uso de recursos", icon: Activity, to: { name: "financial.resource-usage" }, perm: ["access-to-finance"] },
      { id: "ledger", label: "Extrato do ledger", icon: Rows3, to: { name: "financial.ledger" }, perm: ["access-to-finance"] },
    ],
  },
  {
    id: "operacao",
    label: "Operação",
    icon: Activity,
    items: [
      { id: "webhook-logs", label: "Logs de webhooks", icon: Webhook, to: { name: "webhook-logs" }, perm: ["access-to-webhook-logs"] },
      { id: "webhook-inspector", label: "Webhook Inspector", icon: RadioReceiver, to: { name: "webhook-inspector" }, roles: WEBHOOK_INSPECTOR_ROLES, activeFor: ["webhook-inspector-detail"] },
      { id: "protection-dashboard", label: "Proteção", icon: HeartPulse, to: { name: "protection-list-dashboard" }, perm: ["access-to-protection-lists"], roles: LEADS },
      { id: "protection-lists", label: "Listas de proteção", icon: ShieldAlert, to: { name: "protection-lists" }, perm: ["access-to-protection-lists"], roles: LEADS },
      { id: "protection-reports", label: "Relatórios de proteção", icon: FileText, to: { name: "protection-list-reports" }, perm: ["protection-list-report-view"], roles: LEADS },
    ],
  },
  {
    id: "ia",
    label: "IA e conteúdo",
    icon: Sparkles,
    items: [
      { id: "ai-controller", label: "Controlador IA", icon: SlidersHorizontal, to: { name: "ai-controller" }, roles: TECH_LEADS },
      { id: "insight-ia", label: "Insights IA", icon: Bot, to: { name: "insightIA" }, roles: TECH_LEADS },
      { id: "texts", label: "MyElevate Insights", icon: Album, to: { name: "texts" }, perm: ["access-to-motivational-texts"], roles: LEADS },
    ],
  },
  {
    id: "equipe",
    label: "Equipe e acesso",
    icon: ShieldCheck,
    items: [
      { id: "users", label: "Usuários", icon: Users2, to: { name: "users" }, perm: ["access-to-users"] },
      { id: "roles", label: "Perfis", icon: UserCog, to: { name: "roles" }, perm: ["access-to-roles"] },
      { id: "permissions", label: "Permissões", icon: BadgeCheck, to: { name: "permissions" }, perm: ["access-to-permissions"] },
      { id: "user-logins", label: "Histórico de acesso", icon: History, to: { name: "user-logins" }, roles: LEADS },
    ],
  },
];

export const WORKSPACE_NAV: NavGroup[] = [
  {
    id: "ws-top",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, to: { name: "workspace.home" } },
    ],
  },
  {
    id: "elevate-ia",
    label: "Elevate IA",
    icon: Sparkles,
    items: [
      { id: "brain", label: "Elevate Brain", icon: Brain, to: { name: "chat-ia" }, perm: ["access-to-ai"] },
      { id: "jarbas", label: "Jarbas BOT", icon: Bot, to: { name: "jarbas-bot" }, perm: ["access-to-ai"] },
    ],
  },
  {
    id: "audiencias",
    label: "Audiências",
    icon: View,
    items: [
      { id: "clients", label: "Clientes", icon: Users2, to: { name: "clients" }, perm: ["player-registrations"], activeFor: ["clients.show"] },
      { id: "segments", label: "Segmentos", icon: ListFilter, to: { name: "segments" }, perm: ["view-segments"] },
      { id: "segment-analysis", label: "Análise de segmentos", icon: PieChart, to: { name: "segment-analysis-v2" }, perm: ["access-to-reports"], activeFor: ["segment-analysis"] },
      { id: "target-audiences", label: "Público alvo", icon: Target, to: { name: "target-audiences" }, perm: ["view-segments"] },
      { id: "tags", label: "Tags", icon: Tag, to: { name: "tags" }, perm: ["access-to-tags"] },
      { id: "attributions", label: "Atribuições", icon: ExternalLink, to: { name: "attributions" }, perm: ["access-to-parameter-tracking"] },
      { id: "exports", label: "Exportações", icon: Download, to: { name: "exports" }, perm: ["access-to-exportations"] },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: Megaphone,
    items: [
      { id: "campaigns", label: "Campanhas", icon: MessageSquareText, to: { name: "campaign-drafts.index" }, perm: ["access-to-marketing"], activeFor: ["campaign-drafts.create", "campaign-drafts.edit", "campaign-drafts.show"] },
      { id: "mk-emails", label: "E-mails", icon: Mail, to: { name: "marketing.emails" }, perm: ["access-to-marketing"] },
      { id: "mk-inbox", label: "Inbox", icon: MessageCircleMore, to: { name: "marketing.inbox" }, perm: ["access-to-marketing"] },
      { id: "mk-webpush", label: "Webpush", icon: Send, to: { name: "marketing.webpush" }, perm: ["access-to-marketing"] },
      { id: "mk-sms", label: "SMS", icon: ListChecks, to: { name: "marketing.sms" }, perm: ["access-to-marketing"] },
      { id: "mk-popups", label: "PopUps", icon: Album, to: { name: "marketing.popups" }, perm: ["access-to-marketing"] },
      { id: "mk-callcenter", label: "Callcenter", icon: PhoneCall, to: { name: "marketing.callcenter" }, perm: ["access-to-marketing"] },
      { id: "mk-whatsapp", label: "Whatsapp", icon: MessageCircleMore, to: { name: "marketing.whatsapp" }, perm: ["access-to-marketing"] },
      { id: "mk-rcs", label: "RCS", icon: RadioTower, to: { name: "marketing.rcs" }, perm: ["access-to-marketing"] },
    ],
  },
  {
    id: "trafego",
    label: "Tráfego",
    icon: Waypoints,
    items: [
      { id: "link-engine", label: "Monitoramento", icon: Activity, to: { name: "link-engine" }, perm: ["access-to-marketing"] },
      { id: "links", label: "Gestão de links", icon: Link2, to: { name: "links" }, perm: ["access-to-marketing"] },
    ],
  },
  {
    id: "performance",
    label: "Performance",
    icon: LineChart,
    items: [
      { id: "controls", label: "Controles", icon: SlidersHorizontal, to: { name: "controls" }, perm: ["access-to-reports"] },
      { id: "traffics", label: "Aquisição", icon: ChartNoAxesCombined, to: { name: "traffics" }, perm: ["access-to-reports"] },
      { id: "retention", label: "Retenção", icon: UserRoundCog, to: { name: "retention" }, perm: ["access-to-reports"] },
      { id: "emails", label: "E-mails", icon: MailCheck, to: { name: "emails" }, perm: ["access-to-reports"] },
      { id: "email-health", label: "Email Health", icon: HeartPulse, to: { name: "email-health" }, perm: ["access-to-reports"] },
      { id: "sms-insights", label: "SMS", icon: Send, to: { name: "sms-insights" }, perm: ["access-to-reports"] },
      { id: "calls", label: "Ligações", icon: PhoneCall, to: { name: "calls" }, perm: ["access-to-reports"] },
      { id: "risk", label: "Risco", icon: ShieldAlert, to: { name: "risk" }, perm: ["access-to-reports"] },
    ],
  },
  {
    id: "desempenho",
    label: "Desempenho",
    icon: ChartNoAxesColumnIncreasing,
    items: [
      { id: "conversions", label: "Conversões", icon: ChartBarBig, to: { name: "conversions" }, perm: ["view-efficiency"] },
      { id: "reports", label: "Relatórios", icon: ChartArea, to: { name: "reports" }, perm: ["view-efficiency"] },
      { id: "results", label: "Resultados", icon: Goal, to: { name: "ConversionAnalytics" }, perm: ["view-efficiency"] },
    ],
  },
  {
    id: "financeiro-cliente",
    label: "Financeiro",
    icon: CircleDollarSign,
    items: [
      { id: "ws-registers", label: "Entradas e saídas", icon: ArrowLeftRight, to: { name: "workspace.registers" }, perm: ["access-to-finance"] },
      { id: "ws-sectors", label: "Setores", icon: Briefcase, to: { name: "workspace.sectors" }, perm: ["access-to-finance"] },
      { id: "ws-costs", label: "Custos", icon: Rows3, to: { name: "workspace.costs" }, perm: ["access-to-finance"] },
      { id: "ws-resource-usage", label: "Uso de recursos", icon: Gauge, to: { name: "workspace.financial.resource-usage" }, perm: ["access-to-finance"] },
      { id: "ws-ledger", label: "Extrato do ledger", icon: Rows3, to: { name: "workspace.financial.ledger" }, perm: ["access-to-finance"] },
    ],
  },
  {
    id: "configuracoes",
    label: "Configurações",
    icon: Settings,
    items: [
      { id: "data-sources", label: "Fontes de dados", icon: Blocks, to: { name: "data-sources" }, perm: ["access-to-integrations"], workspaceType: "project" },
      { id: "dns-records", label: "Registros DNS", icon: Server, to: { name: "dns-records" }, perm: ["access-to-integrations"], workspaceType: "project" },
      { id: "webhooks", label: "Webhooks", icon: Webhook, to: { name: "webhooks" }, perm: ["access-to-webhooks"], activeFor: ["webhook-operations"] },
      { id: "project-preferences", label: "Preferências do projeto", icon: Settings2, to: { name: "project-preferences" }, perm: ["access-to-integrations"] },
      {
        id: "project-api-keys",
        label: "Chaves de API",
        icon: KeyRound,
        to: (ctx) => (ctx.projectId ? { name: "project-api-keys", params: { id: ctx.projectId } } : null),
        perm: ["manage-project-api-keys"],
        workspaceType: "project",
      },
      { id: "marketing-api-keys", label: "Chaves de marketing", icon: KeyRound, to: { name: "configurations.api-keys" }, when: (ctx) => ctx.canManageMarketingApiKeys },
      { id: "mcp", label: "MCP", icon: ServerCog, to: { name: "mcp" }, perm: ["access-to-client-management", "access-to-member-management"] },
      {
        id: "group-overview",
        label: "Visão do grupo",
        icon: LayoutDashboard,
        to: (ctx) => (ctx.groupId ? { name: "groups.overview", params: { id: ctx.groupId } } : null),
        workspaceType: "group",
      },
      {
        id: "group-management",
        label: "Gestão do grupo",
        icon: SquareStack,
        to: (ctx) => (ctx.groupId ? { name: "groups.management", params: { id: ctx.groupId } } : null),
        workspaceType: "group",
      },
      { id: "groups", label: "Grupos", icon: LayoutList, to: { name: "groups" }, perm: ["access-to-project-groups"] },
    ],
  },
  {
    id: "cobranca",
    label: "Conta e cobrança",
    icon: Wallet,
    items: [
      { id: "invoices", label: "Faturas", icon: ReceiptText, to: { name: "invoices.index" }, roles: ["member", "client-proprietor", "client-financial"], activeFor: ["invoices.show"] },
      { id: "consumption", label: "Consumo", icon: Gauge, to: { name: "service-consumeds.index" }, roles: ["member", "client-proprietor", "client-financial"] },
    ],
  },
  {
    id: "interno",
    label: "Interno Elevate",
    icon: ShieldCheck,
    internal: true,
    items: [
      { id: "postbacks", label: "Postbacks (Elevate API)", icon: Logs, to: { name: "elevate-api" }, perm: ["access-to-postback-logs"], internal: true },
      { id: "annotations", label: "Marcos", icon: PencilLine, to: { name: "annotations" }, perm: ["access-to-dashboard"], internal: true },
    ],
  },
];

export const ACCOUNT_NAV: NavItem[] = [
  { id: "profile", label: "Minha conta", icon: UserCog, to: { name: "configurations.profile" } },
  { id: "preferences", label: "Preferências", icon: SlidersHorizontal, to: { name: "configurations.preferences" } },
  { id: "security", label: "Segurança e 2 etapas", icon: ShieldCheck, to: { name: "configurations.security" } },
  { id: "notifications", label: "Notificações", icon: MessageCircleMore, to: { name: "configurations.notifications" } },
];

function routeNames(groups: NavGroup[]): string[] {
  return groups.flatMap((g) =>
    g.items.flatMap((i) => {
      const names = [...(i.activeFor ?? [])];
      if (typeof i.to !== "function" && typeof i.to.name === "string") names.push(i.to.name);
      return names;
    }),
  );
}

const ADMIN_ROUTES = new Set<string>([...routeNames(ADMIN_NAV), "admin.home"]);

const ACCOUNT_ROUTES = new Set<string>([
  "configurations.profile",
  "configurations.preferences",
  "configurations.security",
  "configurations.notifications",
  "configurations.confirm-email-change",
]);

/** Toda rota autenticada que não é do Admin nem da conta pertence ao workspace. */
export function areaOfRoute(name: string | null | undefined): Area {
  if (!name) return "workspace";
  if (ADMIN_ROUTES.has(name)) return "admin";
  if (ACCOUNT_ROUTES.has(name)) return "account";
  return "workspace";
}
