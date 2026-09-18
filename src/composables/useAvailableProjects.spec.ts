import { beforeEach, describe, expect, it, vi } from "vitest";
import Projects from "@/services/projects";
import { useAvailableProjects } from "@/composables/useAvailableProjects";

vi.mock("@/services/projects", () => ({
  default: { index: vi.fn() },
}));

const mocked = Projects as unknown as { index: ReturnType<typeof vi.fn> };

describe("useAvailableProjects", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads projects from GET /projects envelope data", async () => {
    mocked.index.mockResolvedValue({ data: [{ id: 1 }, { id: 2 }] });
    const { projects, loading, fetchProjects } = useAvailableProjects();

    await fetchProjects();

    expect(mocked.index).toHaveBeenCalled();
    expect(projects.value.map((project: any) => project.id)).toEqual([1, 2]);
    expect(loading.value).toBe(false);
  });

  it("falls back to an empty list and records the error on failure", async () => {
    mocked.index.mockRejectedValue(new Error("boom"));
    const { projects, error, fetchProjects } = useAvailableProjects();

    await fetchProjects();

    expect(projects.value).toEqual([]);
    expect(error.value).toBe("boom");
  });
});
