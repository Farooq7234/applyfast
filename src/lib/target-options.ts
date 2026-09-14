export const COMPANY_SIZES = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1001-5000",
  "5000+",
] as const

export type CompanySize = (typeof COMPANY_SIZES)[number]

export const INDIA_TECH_LOCATIONS = [
  "Bengaluru",
  "Hyderabad",
  "Chennai",
  "Pune",
  "Mumbai",
  "Delhi NCR",
  "Gurugram",
  "Noida",
  "Kolkata",
  "Ahmedabad",
  "Kochi",
  "Jaipur",
  "Other",
] as const

export type IndiaTechLocation = (typeof INDIA_TECH_LOCATIONS)[number]

export function isPresetLocation(value: string | null | undefined) {
  if (!value) return false
  return (INDIA_TECH_LOCATIONS as readonly string[]).includes(value)
}
