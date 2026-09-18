export interface WorkspaceGroupProject {
  id: string;
  project_id?: number;
  label: string;
  name: string;
  type: "group" | "project";
  is_selected: boolean;
  logo: string | null;
}
