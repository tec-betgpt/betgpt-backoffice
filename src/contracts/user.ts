import {Language} from "@/contracts/language";
import {UserPreference} from "@/contracts/userPreference";
import {EmailChangeRequest} from "@/contracts/emailChangeRequest";
import {Project} from "@/contracts/project";
import {UserProjectGroup} from "@/contracts/userProjectGroup";
import {UserLogin} from "@/contracts/userLogin";
import {UserMetadata} from "@/contracts/userMetadata";

export interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  lang: string
  email_verified_at: string | null
  password: string
  document_number: string
  kind_person: string
  asaas_costumer: string | null
  language_id: number
  last_login_at: string | null
  metadata: UserMetadata|null
  language: Language
  projects: Project[]
  ownerProjects: Project[]
  emailChangeRequest: EmailChangeRequest|null
  preferences: UserPreference|null
  projectGroups: UserProjectGroup[]
  userLogins: UserLogin[]
}
