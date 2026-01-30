import {Project} from "@/contracts/project";
import {UserProjectGroup} from "@/contracts/userProjectGroup";

export interface UserProjectGroupProject {
  id: number
  group_id: number
  project_id: number
  created_at: string
  updated_at: string
  group: UserProjectGroup
  project: Project
}
