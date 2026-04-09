// backend/src/features/crm/cases/cases.dto.ts

export class CreateCaseDTO {
  title: string = ''
  description: string = ''
  type: string = ''
  priority?: string
  customerId: string = ''
  customerVehicleId?: string
  leadId?: string
  refDocType?: string
  refDocId?: string
  refDocNumber?: string
  assignedTo?: string

  constructor(body: any) {
    Object.assign(this, body)
  }
}

export class UpdateCaseDTO {
  title?: string
  description?: string
  priority?: string
  assignedTo?: string
  customerVehicleId?: string
  leadId?: string
  refDocType?: string
  refDocId?: string
  refDocNumber?: string

  constructor(body: any) {
    Object.assign(this, body)
  }
}

export class UpdateCaseStatusDTO {
  status: string = ''
  resolution?: string
  rootCause?: string

  constructor(body: any) {
    Object.assign(this, body)
  }
}

export class AddCommentDTO {
  comment: string = ''
  isInternal: boolean = false

  constructor(body: any) {
    Object.assign(this, body)
  }
}
