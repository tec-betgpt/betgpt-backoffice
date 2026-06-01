import api from "./base.js";

interface RiskParams {
  filter_id: string
  today_date: string
  yesterday_date: string
  average_start_date: string
  average_end_date: string
}

interface RiskRequestConfig {
  signal?: AbortSignal;
}

interface RiskChartSerie {
  key: string;
  label: string;
  data: (number | null)[];
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
  async index(params: RiskParams, config?: RiskRequestConfig): Promise<IndexResponse> {
    const { data } = await api.get("/risk", { params, ...config });
    return data;
  }
}
