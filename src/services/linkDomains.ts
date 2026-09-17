import api from "./base";
import { LinkDomain } from "@/contracts/linkDomain";

export default {
  async index(projectId: number): Promise<LinkDomain[]> {
    const { data } = await api.get("/links/domains", { params: { project_id: projectId } });
    return data.data;
  },

  async store(payload: { project_id: number; domain: string }): Promise<LinkDomain> {
    const { data } = await api.post("/links/domains", payload);
    return data.data;
  },

  async destroy(id: number): Promise<void> {
    await api.delete(`/links/domains/${id}`);
  },
};