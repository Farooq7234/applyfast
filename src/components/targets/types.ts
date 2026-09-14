import type { TargetCompany, TargetContact } from "@prisma/client"

export type TargetCompanyWithContacts = TargetCompany & {
  contacts: TargetContact[]
}
