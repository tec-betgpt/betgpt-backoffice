import api from "./base.js";

interface RiskParams {
  filter_id: string;
  start_date: string;
  end_date?: string;
}

interface RiskChartSerie {
  key: string;
  label: string;
  data: number[];
}

interface RiskChartData {
  title: string;
  x_axis: string[];
  series: RiskChartSerie[];
}

export interface IndexResponse {
  hours: string[],
  acquisition: {
    signups: RiskChartData,
    signups_accumulated: RiskChartData,
  },
  engagement: {
    logins: RiskChartData,
    unique_logins: RiskChartData,
    unique_logins_accumulated: RiskChartData,
  },
  monetization: {
    values: {
      deposits: RiskChartData,
      withdrawals: RiskChartData,
    },
    accumulated: {
      entries: RiskChartData,
      withdrawals: RiskChartData,
    },
    quantities: {
      entries: RiskChartData,
      withdrawals: RiskChartData,
    }
  }
}

export default {
  async index(params: RiskParams): Promise<IndexResponse> {
    const { data } = await api.get("/risk", { params });
    return data;
  },
}
