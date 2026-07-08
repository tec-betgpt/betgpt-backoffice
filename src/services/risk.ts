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
  has_smartico?: boolean,
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

export interface SmarticoChartData extends RiskChartData {
  value_type?: "integer" | "money";
  chart_type?: "area" | "line" | "bar";
}

export interface SmarticoIndexResponse {
  available: boolean;
  message?: string;
  hours?: string[];
  casino?: {
    revenue: SmarticoChartData;
    turnover: SmarticoChartData;
    ggr: SmarticoChartData;
    ggr_accumulated: SmarticoChartData;
  };
  sports?: {
    revenue: SmarticoChartData;
    turnover: SmarticoChartData;
    bets_count: SmarticoChartData;
    ggr: SmarticoChartData;
  };
  bonus?: {
    approved_amount: SmarticoChartData;
    free_spins: SmarticoChartData;
    free_spins_accumulated: SmarticoChartData;
  };
  wallet?: {
    real_balance: SmarticoChartData;
    bonus_balance: SmarticoChartData;
    total_balance: SmarticoChartData;
  };
  meta?: {
    source: string;
    last_sync_at?: string | null;
    timezone?: string;
  };
}

export default {
  async index(params: RiskParams, config?: RiskRequestConfig): Promise<IndexResponse> {
    const { data } = await api.get("/risk", { params, ...config });
    return data;
  },

  async smartico(params: RiskParams, config?: RiskRequestConfig): Promise<SmarticoIndexResponse> {
    const { data } = await api.get("/risk/smartico", { params, ...config });
    return data;
  },
}
