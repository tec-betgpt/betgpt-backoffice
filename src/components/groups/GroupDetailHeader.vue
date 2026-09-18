<template>
  <div
    class="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-start sm:justify-between"
  >
    <div class="space-y-1">
      <div class="flex items-center gap-2">
        <Button variant="ghost" size="icon" as-child>
          <router-link :to="{ name: 'groups' }" aria-label="Voltar">
            <ArrowLeft class="h-4 w-4" />
          </router-link>
        </Button>
        <h2 class="text-2xl font-bold tracking-tight">{{ group.name }}</h2>
        <Badge variant="secondary">
          {{
            $t(
              group.status === "archived"
                ? "groups_status_archived"
                : "groups_status_active",
            )
          }}
        </Badge>
        <Badge variant="outline">{{ $t(`groups_role_${permissions.role}`) }}</Badge>
      </div>
      <p class="text-sm text-muted-foreground">
        {{ group.projects.length }} {{ $t("groups_projects").toLowerCase() }}
        <span v-if="group.description"> · {{ group.description }}</span>
      </p>
    </div>

    <div class="flex items-center gap-2">
      <Button v-if="permissions.canEdit" variant="outline" @click="emit('edit')">
        {{ $t("groups_edit") }}
      </Button>
      <DropdownMenu v-if="permissions.canEdit || permissions.canDelete">
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon">
            <MoreHorizontal class="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem v-if="permissions.canEdit" @click="emit('archive')">
            {{ $t("groups_archive") }}
          </DropdownMenuItem>
          <DropdownMenuItem
            v-if="permissions.canDelete"
            class="text-destructive"
            @click="emit('delete')"
          >
            {{ $t("groups_delete") }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, MoreHorizontal } from "lucide-vue-next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Group } from "@/contracts/group";
import type { GroupPermissions } from "@/composables/useGroupPermissions";

defineProps<{ group: Group; permissions: GroupPermissions }>();
const emit = defineEmits<{
  (event: "edit"): void;
  (event: "archive"): void;
  (event: "delete"): void;
}>();
</script>
