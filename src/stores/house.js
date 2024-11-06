import { defineStore } from "pinia";
import { ref } from "vue";

export const useHouseStore = defineStore("houseStore", () => {
  const selectedHouse = ref(null);

  function setSelectedHouse(id) {
    selectedHouse.value = id;
  }

  return {
    selectedHouse,
    setSelectedHouse,
  };
});
