import {City} from "@/contracts/city";
import {Country} from "@/contracts/country";

export interface State {
  id: number
  name: string
  country_id: number
  iso2: string
  type: string
  latitude: number
  longitude: number
  created_at: string
  updated_at: string
  country: Country
  cities: City[]
}
