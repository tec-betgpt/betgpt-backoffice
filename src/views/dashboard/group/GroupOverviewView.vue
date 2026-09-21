<template>
  <div class="space-y-4">
    <Card>
      <CardContent class="space-y-4 py-6">
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="text-lg font-semibold">{{ group.name }}</h3>
          <Badge variant="secondary">
            {{
              $t(
                group.status === "archived"
                  ? "groups_status_archived"
                  : "groups_status_active",
              )
            }}
          </Badge>
          <Badge v-if="permissions.role" variant="outline">
            {{ $t(`groups_role_${permissions.role}`) }}
          </Badge>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-lg border p-3">
            <p class="text-xs text-muted-foreground">
              {{ $t("groups_description") }}
            </p>
            <p class="font-medium">{{ group.description || "—" }}</p>
          </div>
          <div class="rounded-lg border p-3">
            <p class="text-xs text-muted-foreground">
              {{ $t("groups_projects") }}
            </p>
            <p class="font-medium">{{ group.projects.length }}</p>
          </div>
          <div class="rounded-lg border p-3">
            <p class="text-xs text-muted-foreground">
              {{ $t("groups_owner") }}
            </p>
            <p class="font-medium">{{ ownerName }}</p>
          </div>
          <div class="rounded-lg border p-3">
            <p class="text-xs text-muted-foreground">
              {{ $t("groups_created_at") }}
            </p>
            <p class="font-medium">{{ formatDate(group.created_at) }}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <router-link
        v-for="section in sections"
        :key="section.name"
        :to="{ name: section.name, params: { id: group.id } }"
        class="block"
      >
        <Card class="h-full transition hover:border-primary/50">
          <CardContent class="flex items-start gap-3 py-4">
            <component :is="section.icon" class="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p class="font-medium">{{ $t(section.label) }}</p>
              <p class="text-sm text-muted-foreground">
                {{ $t(section.description) }}
              </p>
            </div>
          </CardContent>
        </Card>
      </router-link>
    </div>

    <Card v-if="hasManagementActions">
      <CardHeader class="py-4">
        <CardTitle class="text-base">{{ $t("groups_management") }}</CardTitle>
      </CardHeader>
      <CardContent class="flex flex-wrap gap-2">
        <Button
          v-if="permissions.canEdit && canManageGroups"
          variant="outline"
          @click="emit('edit')"
        >
          {{ $t("groups_edit") }}
        </Button>
        <Button
          v-if="permissions.canManageInvitations"
          variant="outline"
          @click="emit('invite')"
        >
          {{ $t("groups_invite_person") }}
        </Button>
        <Button
          v-if="permissions.isOwner"
          variant="outline"
          @click="emit('transfer')"
        >
          {{ $t("groups_transfer") }}
        </Button>
        <Button
          v-if="permissions.canDelete"
          variant="destructive"
          @click="emit('delete')"
        >
          {{ $t("groups_delete") }}
        </Button>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import moment from "moment";
import {
  Building2,
  Users2,
  Mail,
  PieChart,
  CircleDollarSign,
  ChartNoAxesColumnIncreasing,
  Layers,
} from "lucide-vue-next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useManagementProfile } from "@/composables/useManagementProfile";
import type { Group } from "@/contracts/group";
import type { GroupPermissions } from "@/composables/useGroupPermissions";

const props = defineProps<{ group: Group; permissions: GroupPermissions }>();
const emit = defineEmits<{
  (event: "edit"): void;
  (event: "invite"): void;
  (event: "transfer"): void;
  (event: "delete"): void;
}>();

const { canManageGroups } = useManagementProfile();

const sections = [
  {
    name: "groups.projects",
    label: "groups_projects",
    description: "groups_section_projects",
    icon: Building2,
  },
  {
    name: "groups.members",
    label: "groups_members",
    description: "groups_section_members",
    icon: Users2,
  },
  {
    name: "groups.invitations",
    label: "groups_invitations",
    description: "groups_section_invitations",
    icon: Mail,
  },
  {
    name: "groups.consolidated",
    label: "groups_consolidated",
    description: "groups_section_consolidated",
    icon: Layers,
  },
  {
    name: "groups.analytics",
    label: "groups_analytics",
    description: "groups_section_analytics",
    icon: ChartNoAxesColumnIncreasing,
  },
  {
    name: "groups.dre",
    label: "groups_dre",
    description: "groups_section_dre",
    icon: PieChart,
  },
  {
    name: "groups.financial",
    label: "groups_financial",
    description: "groups_section_financial",
    icon: CircleDollarSign,
  },
];

const ownerName = computed(() => {
  const owner = props.group.members?.find((member) => member.role === "owner");
  return owner?.user?.name ?? owner?.user?.email ?? "—";
});

const hasManagementActions = computed(
  () =>
    (props.permissions.canEdit && canManageGroups.value) ||
    props.permissions.canManageInvitations ||
    props.permissions.isOwner ||
    props.permissions.canDelete,
);

function formatDate(value: string | null | undefined): string {
  return value ? moment(value).format("DD/MM/YYYY HH:mm") : "—";
}
</script>
