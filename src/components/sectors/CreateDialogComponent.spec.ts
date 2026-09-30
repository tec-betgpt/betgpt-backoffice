import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { nextTick } from "vue";
import { AxiosError, type AxiosResponse } from "axios";
import Sector from "@/services/sector";
import { useWorkspaceStore } from "@/stores/workspace";
import globalComponents from "@/boot/components";
import CreateDialogComponent from "@/components/sectors/CreateDialogComponent.vue";

const uiComponents = Object.fromEntries(
  Object.entries(globalComponents).map(([path, component]) => [
    path.split("/").pop()!.replace(".vue", ""),
    (component as any).default,
  ]),
);

const toastMock = vi.hoisted(() => Object.assign(vi.fn(), { error: vi.fn() }));

vi.mock("vue-sonner", () => ({
  toast: toastMock,
}));

vi.mock("@/services/sector", () => ({
  default: {
    store: vi.fn(),
    update: vi.fn(),
    index: vi.fn(),
  },
}));

const sectorStoreMock = vi.mocked(Sector.store);

function axios422(data: unknown): AxiosError {
  const error = new AxiosError("Request failed", "ERR_BAD_REQUEST");
  error.response = {
    status: 422,
    data,
    statusText: "",
    headers: {},
    config: { headers: {} },
  } as AxiosResponse;
  return error;
}

async function openDialogAndSubmit() {
  const reload = vi.fn();
  const wrapper = mount(CreateDialogComponent, {
    props: { reload },
    attachTo: document.body,
    global: { components: uiComponents },
  });

  await wrapper.find("button").trigger("click");
  await flushPromises();

  const form = document.body.querySelector("form");
  expect(form).not.toBeNull();
  form!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  await flushPromises();

  return { wrapper, reload };
}

describe("sectors/CreateDialogComponent", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const workspaceStore = useWorkspaceStore();
    workspaceStore.activeGroupProject = {
      id: "1",
      project_id: "1",
      is_selected: true,
      label: "Projeto",
      logo: null,
      name: "Projeto",
      type: "project",
    };
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  it("422: mantém o diálogo aberto, exibe erro inline e não emite toast local", async () => {
    sectorStoreMock.mockRejectedValue(
      axios422({
        success: false,
        message: "Os dados informados são inválidos.",
        errors: { name: ["O nome é obrigatório."] },
      }),
    );

    const { reload } = await openDialogAndSubmit();

    // Erro inline ao lado do campo, diálogo continua aberto.
    expect(document.body.textContent).toContain("O nome é obrigatório.");
    expect(document.body.textContent).toContain("Crie um novo setor");

    // Sem toast local (o interceptor global é quem tosta o 422) e sem reload.
    expect(toastMock.error).not.toHaveBeenCalled();
    expect(toastMock).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it("erro não-422: não exibe erro inline nem toast local duplicado", async () => {
    sectorStoreMock.mockRejectedValue(new AxiosError("Network Error"));

    await openDialogAndSubmit();

    expect(document.body.textContent).not.toContain("text-destructive");
    expect(toastMock.error).not.toHaveBeenCalled();
  });

  it("sucesso: fecha o diálogo, recarrega e tosta sucesso", async () => {
    sectorStoreMock.mockResolvedValue({} as any);

    const { reload } = await openDialogAndSubmit();

    expect(reload).toHaveBeenCalledTimes(1);
    expect(toastMock).toHaveBeenCalledWith(
      "Sucesso",
      expect.objectContaining({ description: "Setor criado com sucesso." }),
    );
    await nextTick();
    expect(document.body.textContent).not.toContain("Crie um novo setor");
  });
});
