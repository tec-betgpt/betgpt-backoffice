import { defineStore } from "pinia";
import { ref } from "vue";

export const useProjectStore = defineStore("projectStore", () => {
  const selectedProject = ref(null);

  function setSelectedProject(id) {
    selectedProject.value = id;
  }

  return {
    selectedProject,
    setSelectedProject,
  };
});
