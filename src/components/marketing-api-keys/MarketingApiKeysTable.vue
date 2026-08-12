<script setup lang="ts">
import { useI18n } from "vue-i18n";
import moment from "moment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  EllipsisIcon,
  PencilIcon,
  RefreshCwIcon,
  BanIcon,
} from "lucide-vue-next";
import type {
  MarketingApiKey,
  MarketingApiKeyStatus,
} from "@/contracts/marketingApiKeys";

const props = defineProps<{
  apiKeys: MarketingApiKey[];
  loading: boolean;
  canManage: boolean;
}>();

const emit = defineEmits<{
  edit: [apiKey: MarketingApiKey];
  rotate: [apiKey: MarketingApiKey];
  revoke: [apiKey: MarketingApiKey];
}>();

const { t } = useI18n();

const COLUMN_COUNT = 8;

const statusVariant: Record<
  MarketingApiKeyStatus,
  "default" | "secondary" | "destructive"
> = {
  active: "default",
  expired: "secondary",
  revoked: "destructive",
};

function statusLabel(status: MarketingApiKeyStatus): string {
  return t(`marketing_api_keys.status_${status}`);
}

/** Chave ativa com expiração nos próximos 7 dias. */
function isExpiringSoon(apiKey: MarketingApiKey): boolean {
  if (apiKey.status !== "active" || !apiKey.expires_at) return false;
  const diffMs = moment(apiKey.expires_at).diff(moment());
  return diffMs > 0 && diffMs <= 7 * 24 * 60 * 60 * 1000;
}

function formatDate(value: string | null): string {
  return value ? moment(value).format("DD/MM/YYYY HH:mm") : "";
}

function formatLastUsed(apiKey: MarketingApiKey): string {
  if (!apiKey.last_used_at) return t("marketing_api_keys.never_used");
  const at = formatDate(apiKey.last_used_at);
  return apiKey.last_used_ip ? `${at} · ${apiKey.last_used_ip}` : at;
}

/** Edição permitida para chaves ativas/expiradas (expirada reativa via expires_at). */
function canEdit(apiKey: MarketingApiKey): boolean {
  return props.canManage && apiKey.status !== "revoked";
}

/** Rotação/revogação apenas em chaves ativas — o backend retorna 409 `state_conflict` nos demais casos. */
function canRotateOrRevoke(apiKey: MarketingApiKey): boolean {
  return props.canManage && apiKey.status === "active";
}

function hasAnyAction(apiKey: MarketingApiKey): boolean {
  return canEdit(apiKey) || canRotateOrRevoke(apiKey);
}
</script>

<template>
  <div class="w-full border rounded-lg overflow-x-auto">
    <Table class="w-full">
      <TableHeader>
        <TableRow>
          <TableHead>{{ t("marketing_api_keys.column_name") }}</TableHead>
          <TableHead>{{ t("marketing_api_keys.column_key") }}</TableHead>
          <TableHead>{{ t("marketing_api_keys.column_status") }}</TableHead>
          <TableHead>{{ t("marketing_api_keys.column_scopes") }}</TableHead>
          <TableHead class="text-right">
            {{ t("marketing_api_keys.column_rate_limit") }}
          </TableHead>
          <TableHead>{{ t("marketing_api_keys.column_expires_at") }}</TableHead>
          <TableHead>{{ t("marketing_api_keys.column_last_used") }}</TableHead>
          <TableHead>{{ t("marketing_api_keys.column_created") }}</TableHead>
          <TableHead v-if="canManage" class="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        <template v-if="loading">
          <TableRow v-for="i in 5" :key="`skeleton-${i}`">
            <TableCell
              v-for="j in canManage ? COLUMN_COUNT + 1 : COLUMN_COUNT"
              :key="j"
            >
              <Skeleton class="h-4 w-full bg-gray-300 my-1" />
            </TableCell>
          </TableRow>
        </template>

        <template v-else-if="apiKeys.length">
          <TableRow v-for="apiKey in apiKeys" :key="apiKey.uuid">
            <TableCell class="font-medium max-w-48 truncate">
              {{ apiKey.name }}
            </TableCell>
            <TableCell>
              <code class="text-xs bg-muted px-1.5 py-0.5 rounded">
                {{ apiKey.key_prefix }}
              </code>
            </TableCell>
            <TableCell>
              <Badge :variant="statusVariant[apiKey.status]">
                {{ statusLabel(apiKey.status) }}
              </Badge>
            </TableCell>
            <TableCell class="max-w-56">
              <div class="flex flex-wrap gap-1">
                <Badge
                  v-for="scope in apiKey.scopes.slice(0, 2)"
                  :key="scope"
                  variant="outline"
                  class="text-xs"
                >
                  {{ scope }}
                </Badge>
                <Badge
                  v-if="apiKey.scopes.length > 2"
                  variant="outline"
                  class="text-xs"
                >
                  {{
                    t("marketing_api_keys.more_scopes", {
                      count: apiKey.scopes.length - 2,
                    })
                  }}
                </Badge>
              </div>
            </TableCell>
            <TableCell class="text-right">
              {{ apiKey.rate_limit_per_minute }}
            </TableCell>
            <TableCell class="text-nowrap">
              <TooltipProvider v-if="isExpiringSoon(apiKey)">
                <Tooltip>
                  <TooltipTrigger class="text-amber-600 font-medium">
                    {{ formatDate(apiKey.expires_at) }}
                  </TooltipTrigger>
                  <TooltipContent>
                    {{ t("marketing_api_keys.expires_soon") }}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span v-else-if="apiKey.expires_at">
                {{ formatDate(apiKey.expires_at) }}
              </span>
              <span v-else class="text-muted-foreground">
                {{ t("marketing_api_keys.no_expiration") }}
              </span>
            </TableCell>
            <TableCell class="text-nowrap">
              {{ formatLastUsed(apiKey) }}
            </TableCell>
            <TableCell class="text-nowrap">
              {{ formatDate(apiKey.created_at) }}
              <span
                v-if="apiKey.created_by"
                class="block text-xs text-muted-foreground"
              >
                {{ apiKey.created_by.name }}
              </span>
            </TableCell>
            <TableCell v-if="canManage">
              <DropdownMenu v-if="hasAnyAction(apiKey)">
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon">
                    <EllipsisIcon class="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    v-if="canEdit(apiKey)"
                    @click="emit('edit', apiKey)"
                  >
                    <PencilIcon class="size-4 mr-2" />
                    {{ t("marketing_api_keys.action_edit") }}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    v-if="canRotateOrRevoke(apiKey)"
                    @click="emit('rotate', apiKey)"
                  >
                    <RefreshCwIcon class="size-4 mr-2" />
                    {{ t("marketing_api_keys.action_rotate") }}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    v-if="canRotateOrRevoke(apiKey)"
                    class="text-destructive focus:text-destructive"
                    @click="emit('revoke', apiKey)"
                  >
                    <BanIcon class="size-4 mr-2" />
                    {{ t("marketing_api_keys.action_revoke") }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </template>

        <TableRow v-else>
          <TableCell
            :colspan="canManage ? COLUMN_COUNT + 1 : COLUMN_COUNT"
            class="text-center py-8 text-muted-foreground"
          >
            {{ t("marketing_api_keys.empty") }}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
