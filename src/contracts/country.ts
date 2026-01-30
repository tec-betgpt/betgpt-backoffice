import {State} from "@/contracts/state";

export interface Country {
  id: number
  name: string
  iso3: string
  numeric_code: string
  iso2: string
  phonecode: string
  capital: string
  currency: string
  currency_name: string
  currency_symbol: string
  tld: string
  native: string
  nationality: string
  timezones: any[]
  translations: any[]
  latitude: number
  longitude: number
  created_at: string
  updated_at: string
  states: State[]
}
