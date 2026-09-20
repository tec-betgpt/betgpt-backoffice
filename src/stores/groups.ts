import { defineStore } from "pinia";
import groupsService from "@/services/groups";
import { normalizeApiError } from "@/lib/apiError";
import type { NormalizedApiError } from "@/lib/apiError";
import type {
  CreateGroupPayload,
  Group,
  ReplaceGroupProjectsPayload,
  UpdateGroupPayload,
} from "@/contracts/group";
import type {
  GroupMember,
  UpdateGroupMemberPayload,
} from "@/contracts/groupMember";
import type {
  CreateGroupInvitationPayload,
  GroupInvitation,
} from "@/contracts/groupInvitation";

export const useGroupsStore = defineStore("groups", {
  state: () => ({
    groups: [] as Group[],
    currentGroup: null as Group | null,
    members: [] as GroupMember[],
    invitations: [] as GroupInvitation[],
    myInvitations: [] as GroupInvitation[],
    loading: false,
    saving: false,
    error: null as NormalizedApiError | null,
  }),

  getters: {
    groupById(state) {
      return (id: number): Group | null =>
        state.groups.find((group) => group.id === id) ?? null;
    },
    pendingInvitations(state): GroupInvitation[] {
      return state.myInvitations.filter(
        (invitation) => invitation.status === "pending",
      );
    },
  },

  actions: {
    async fetchGroups() {
      this.loading = true;
      this.error = null;
      try {
        this.groups = await groupsService.listGroups();
      } catch (error) {
        this.error = normalizeApiError(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createGroup(payload: CreateGroupPayload): Promise<Group> {
      this.saving = true;
      try {
        const group = await groupsService.createGroup(payload);
        this.groups = [...this.groups, group];
        return group;
      } finally {
        this.saving = false;
      }
    },

    async fetchGroup(id: number): Promise<Group> {
      this.loading = true;
      this.error = null;
      try {
        const group = await groupsService.getGroup(id);
        this.currentGroup = group;
        this.upsertGroup(group);
        return group;
      } catch (error) {
        this.error = normalizeApiError(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateGroup(id: number, payload: UpdateGroupPayload): Promise<Group> {
      this.saving = true;
      try {
        const group = await groupsService.updateGroup(id, payload);
        this.currentGroup = group;
        this.upsertGroup(group);
        return group;
      } finally {
        this.saving = false;
      }
    },

    async deleteGroup(id: number): Promise<void> {
      this.saving = true;
      try {
        await groupsService.deleteGroup(id);
        this.groups = this.groups.filter((group) => group.id !== id);
        if (this.currentGroup?.id === id) this.currentGroup = null;
      } finally {
        this.saving = false;
      }
    },

    async replaceProjects(
      id: number,
      payload: ReplaceGroupProjectsPayload,
    ): Promise<Group> {
      this.saving = true;
      try {
        const group = await groupsService.replaceGroupProjects(id, payload);
        this.currentGroup = group;
        this.upsertGroup(group);
        return group;
      } finally {
        this.saving = false;
      }
    },

    async transferOwnership(groupId: number, userId: number): Promise<Group> {
      this.saving = true;
      try {
        const group = await groupsService.transferGroup(groupId, userId);
        this.currentGroup = group;
        this.upsertGroup(group);
        return group;
      } finally {
        this.saving = false;
      }
    },

    async fetchMembers(groupId: number): Promise<GroupMember[]> {
      this.members = await groupsService.listMembers(groupId);
      return this.members;
    },

    async updateMember(
      groupId: number,
      userId: number,
      payload: UpdateGroupMemberPayload,
    ): Promise<GroupMember> {
      const member = await groupsService.updateMember(groupId, userId, payload);
      this.members = this.members.map((m) =>
        m.user_id === userId ? member : m,
      );
      return member;
    },

    async removeMember(groupId: number, userId: number): Promise<void> {
      await groupsService.removeMember(groupId, userId);
      this.members = this.members.filter((m) => m.user_id !== userId);
    },

    async fetchInvitations(groupId: number): Promise<GroupInvitation[]> {
      this.invitations = await groupsService.listInvitations(groupId);
      return this.invitations;
    },

    async createInvitation(
      groupId: number,
      payload: CreateGroupInvitationPayload,
    ): Promise<GroupInvitation> {
      const invitation = await groupsService.createInvitation(groupId, payload);
      this.invitations = [...this.invitations, invitation];
      return invitation;
    },

    async revokeInvitation(invitationId: number): Promise<void> {
      await groupsService.revokeInvitation(invitationId);
      this.invitations = this.invitations.filter(
        (invitation) => invitation.id !== invitationId,
      );
    },

    async fetchMyInvitations(): Promise<GroupInvitation[]> {
      this.myInvitations = await groupsService.listMyInvitations();
      return this.myInvitations;
    },

    async acceptInvitation(uuid: string): Promise<void> {
      await groupsService.acceptInvitation(uuid);
      this.myInvitations = this.myInvitations.filter(
        (invitation) => invitation.uuid !== uuid,
      );
    },

    async declineInvitation(uuid: string): Promise<void> {
      await groupsService.declineInvitation(uuid);
      this.myInvitations = this.myInvitations.filter(
        (invitation) => invitation.uuid !== uuid,
      );
    },

    upsertGroup(group: Group) {
      const index = this.groups.findIndex((item) => item.id === group.id);
      this.groups =
        index >= 0
          ? this.groups.map((item) => (item.id === group.id ? group : item))
          : [...this.groups, group];
    },

    reset() {
      this.groups = [];
      this.currentGroup = null;
      this.members = [];
      this.invitations = [];
      this.myInvitations = [];
      this.loading = false;
      this.saving = false;
      this.error = null;
    },
  },
});
