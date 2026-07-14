import api from "./base.js";
import type {
  LinkApiResponse,
  LinkArchiveResponse,
  LinkCreatePayload,
  LinkDetailsResponse,
  LinkListParams,
  ListParams,
  LinkListResponse,
  LinkUpdatePayload,
} from "@/contracts/link";

export default {
  async index(params: LinkListParams = {}): Promise<LinkListResponse> {
    const { data } = await api.get<LinkApiResponse<LinkListResponse>>("/links", { params });
    return data.data;
  },

  async store(body: LinkCreatePayload): Promise<LinkDetailsResponse> {
    const { data } = await api.post<LinkApiResponse<LinkDetailsResponse>>("/links", body);
    return data.data;
  },

  async show(id: number | string): Promise<LinkDetailsResponse> {
    const { data } = await api.get<LinkApiResponse<LinkDetailsResponse>>(`/links/${id}`);
    return data.data;
  },

  async update(id: number | string, body: LinkUpdatePayload): Promise<LinkDetailsResponse> {
    const { data } = await api.patch<LinkApiResponse<LinkDetailsResponse>>(`/links/${id}`, body);
    return data.data;
  },

  async archive(id: number | string): Promise<LinkArchiveResponse> {
    const { data } = await api.post<LinkApiResponse<LinkArchiveResponse>>(`/links/${id}/archive`);
    return data.data;
  },

  async list(params: ListParams): Promise<{ id: number; slug: string }[]> {
    const { data } = await api.get<Promise<{ id: number; slug: string }[]>>("/links/list", { params });
    return data;
  }
}
