import { h } from "vue";
import { Badge } from "@/components/ui/badge";
import ProjectAvatar from "@/components/custom/ProjectAvatar.vue";
import type { ProjectSummary } from "@/contracts/projectSummary";

export function renderProjectCell(project?: ProjectSummary | null) {
  if (!project) {
    return h("span", { class: "text-muted-foreground" }, "—");
  }

  return h(Badge, { variant: "secondary", class: "gap-1.5 py-1 pr-2" }, () => [
    h(ProjectAvatar, {
      name: project.name,
      logoUrl: project.logo_url,
      class: "h-4 w-4",
    }),
    h("span", { class: "max-w-[140px] truncate" }, project.name),
  ]);
}

export function projectColumnDef() {
  return {
    accessorKey: "project",
    header: "Projeto",
    cell: ({ row }: { row: { original?: { project?: ProjectSummary | null } } }) =>
      renderProjectCell(row.original?.project),
  };
}
