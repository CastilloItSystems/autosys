# Workshop Checklist & Diagnostic Templates System - Exploration Report

## 1. MODEL SCHEMAS WITH ALL FIELDS

### ChecklistTemplate Model

**Location:** [prisma/models/workshop/checklist.prisma](backend/prisma/models/workshop/checklist.prisma)

```prisma
model ChecklistTemplate {
  id          String            @id @default(cuid())
  code        String            // Unique per empresa (e.g., "RECEPTION_BASIC")
  name        String            // Display name
  description String?           @db.Text
  category    ChecklistCategory // RECEPTION | DIAGNOSIS | QUALITY_CONTROL
  isActive    Boolean           @default(true)

  // Relations (1-to-many)
  items       ChecklistItem[]           // Child items in template
  receptions  VehicleReception[]        // Used in reception process
  qualityChecks QualityCheck[]          // Used in quality control

  // Multi-tenancy & Audit
  empresaId   String
  empresa     Empresa           @relation(fields: [empresaId], references: [id_empresa], onDelete: Restrict)
  createdBy   String
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  // Constraints
  @@unique([empresaId, code])   // code is unique per empresa
  @@index([empresaId])
}
```

**ChecklistCategory Enum:**

- `RECEPTION` - For vehicle intake/reception process
- `DIAGNOSIS` - For diagnostic process (not yet fully connected)
- `QUALITY_CONTROL` - For pre-delivery quality checks

---

### ChecklistItem Model

**Location:** [prisma/models/workshop/checklist.prisma](backend/prisma/models/workshop/checklist.prisma)

```prisma
model ChecklistItem {
  id                 String            @id @default(cuid())
  checklistTemplateId String
  template           ChecklistTemplate @relation(fields: [checklistTemplateId], references: [id], onDelete: Cascade)

  code               String            // Unique within template (e.g., "ITEM_001")
  name               String            // Display name
  description        String?           @db.Text
  responseType       ChecklistItemType @default(BOOLEAN)
  isRequired         Boolean           @default(false)
  order              Int               @default(0)   // Sort order in template
  options            Json?             // For SELECTION type: ["Option1", "Option2", ...]

  isActive           Boolean           @default(true)

  // 1-to-many with responses
  responses          ChecklistResponse[]

  // Multi-tenancy & Audit
  empresaId          String
  empresa            Empresa           @relation(fields: [empresaId], references: [id_empresa], onDelete: Restrict)
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt

  // Constraints
  @@unique([checklistTemplateId, code])
  @@index([empresaId])
}
```

**ChecklistItemType Enum:**

- `BOOLEAN` - Yes/No response
- `TEXT` - Text input
- `NUMBER` - Numeric input
- `SELECTION` - Dropdown/select from options

---

### ChecklistResponse Model

**Location:** [prisma/models/workshop/checklist.prisma](backend/prisma/models/workshop/checklist.prisma)

```prisma
model ChecklistResponse {
  id                 String            @id @default(cuid())
  checklistItemId    String
  item               ChecklistItem     @relation(fields: [checklistItemId], references: [id], onDelete: Cascade)

  // Can be linked to either reception or quality check (not both simultaneously)
  receptionId        String?
  reception          VehicleReception? @relation(fields: [receptionId], references: [id], onDelete: Cascade)

  qualityCheckId     String?
  qualityCheck       QualityCheck?     @relation(fields: [qualityCheckId], references: [id], onDelete: Cascade)

  // Flexible response storage based on ChecklistItemType
  boolValue          Boolean?          // For BOOLEAN type
  textValue          String?           @db.Text  // For TEXT type
  numValue           Decimal?          @db.Decimal(12, 2)  // For NUMBER type
  selectionValue     String?           // For SELECTION type
  observation        String?           @db.Text  // Optional notes for any type

  // Multi-tenancy & Audit
  empresaId          String
  empresa            Empresa           @relation(fields: [empresaId], references: [id_empresa], onDelete: Restrict)
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt

  // Indexes
  @@index([empresaId])
  @@index([receptionId])
  @@index([qualityCheckId])
}
```

---

### ServiceType Model

**Location:** [prisma/models/workshop/serviceType.prisma](backend/prisma/models/workshop/serviceType.prisma)

```prisma
model ServiceType {
  id          String  @id @default(cuid())
  code        String  // e.g., "MAINTENANCE_PREVENTIVE"
  name        String  // e.g., "Preventive Maintenance"
  description String? @db.Text

  // Standard reference data (templates for estimation)
  standardMinutes   Int?     // Estimated duration in minutes
  standardLaborPrice Decimal? @db.Decimal(12, 2)

  isActive  Boolean @default(true)

  empresaId String
  empresa   Empresa @relation(fields: [empresaId], references: [id_empresa], onDelete: Restrict)

  // Relations (1-to-many)
  appointments  ServiceAppointment[]
  serviceOrders ServiceOrder[]
  operations    WorkshopOperation[]

  // Constraints
  @@unique([empresaId, code])
  @@index([empresaId])
  @@index([isActive])
  @@map("workshop_service_types")
}
```

**Note:** ServiceType does NOT currently have a direct relation to ChecklistTemplate, but could be extended to support template mapping per service type.

---

### ServiceDiagnosis Model

**Location:** [prisma/models/workshop/serviceDiagnosis.prisma](backend/prisma/models/workshop/serviceDiagnosis.prisma)

```prisma
model ServiceDiagnosis {
  id            String             @id @default(cuid())
  receptionId   String?            @unique
  reception     VehicleReception?  @relation(fields: [receptionId], references: [id], onDelete: SetNull)
  serviceOrderId String?           @unique
  serviceOrder   ServiceOrder?     @relation(fields: [serviceOrderId], references: [id], onDelete: SetNull)
  technicianId  String?            // userId of technician performing diagnosis

  startedAt     DateTime?
  finishedAt    DateTime?
  generalNotes  String?            @db.Text
  severity      DiagnosisFindingSeverity @default(LOW)
  status        DiagnosisStatus    @default(DRAFT)

  // Relations (1-to-many)
  findings      DiagnosisFinding[]
  evidences     DiagnosisEvidence[]
  suggestedOperations DiagnosisSuggestedOperation[]
  suggestedParts      DiagnosisSuggestedPart[]

  // Multi-tenancy & Audit
  empresaId     String
  empresa       Empresa            @relation(fields: [empresaId], references: [id_empresa], onDelete: Restrict)
  createdBy     String
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt

  @@index([empresaId])
}
```

**DiagnosisStatus Enum:**

- `DRAFT` - In progress, not yet completed
- `COMPLETED` - Diagnosis finished
- `APPROVED_INTERNAL` - Approved by supervisor

**DiagnosisFindingSeverity Enum:**

- `LOW` - Minor issue
- `MEDIUM` - Moderate issue
- `HIGH` - Serious issue
- `CRITICAL` - Critical problem

---

### Key Connections

```
ChecklistTemplate
  ├─ 1-to-many → ChecklistItem[]
  ├─ 1-to-many → VehicleReception[]
  └─ 1-to-many → QualityCheck[]

ChecklistItem
  └─ 1-to-many → ChecklistResponse[]

ChecklistResponse
  ├─ many-to-1 → VehicleReception
  └─ many-to-1 → QualityCheck

ServiceDiagnosis
  ├─ 1-to-1 → VehicleReception (optional)
  ├─ 1-to-1 → ServiceOrder (optional)
  ├─ 1-to-many → DiagnosisFinding[]
  ├─ 1-to-many → DiagnosisSuggestedOperation[]
  └─ 1-to-many → DiagnosisSuggestedPart[]

VehicleReception
  ├─ many-to-1 → ChecklistTemplate (optional, for RECEPTION category)
  ├─ 1-to-many → ChecklistResponse[]
  └─ 1-to-1 → ServiceDiagnosis (optional, via receptionId)

QualityCheck
  ├─ many-to-1 → ChecklistTemplate (optional, for QUALITY_CONTROL category)
  ├─ 1-to-many → ChecklistResponse[]
  └─ 1-to-1 → ServiceOrder
```

---

## 2. CURRENT FUNCTIONS IN CHECKLIST SERVICES

### Checklist Service Methods

**Location:** [src/features/workshop/checklists/checklists.service.ts](backend/src/features/workshop/checklists/checklists.service.ts)

#### CRUD Operations

**`findAllChecklistTemplates(empresaId, filters, db)`**

- **Purpose:** Retrieve paginated list of checklist templates
- **Filters:** search, isActive, category, page, limit, sortBy, sortOrder
- **Returns:** `IChecklistListResult` with templates and pagination meta
- **Includes:** items (sorted by order), \_count (receptions & qualityChecks)
- **Features:**
  - Full-text search on code & name (case-insensitive)
  - Filter by category (RECEPTION, DIAGNOSIS, QUALITY_CONTROL)
  - Filter by active status
  - Pagination with configurable limit (default 20)
  - Sorting (default: name asc)

**`findChecklistTemplateById(empresaId, id, db)`**

- **Purpose:** Get single template with all items
- **Returns:** `IChecklistTemplateWithStats`
- **Throws:** `NotFoundError` if not found
- **Includes:** items, \_count

**`createChecklistTemplate(empresaId, userId, data, db)`**

- **Purpose:** Create new template with items in atomic operation
- **Input:** code, name, description, category, items[]
- **Params per Item:** code, name, description, responseType, isRequired, order, options
- **Returns:** Created template with items
- **Validation:** Ensures unique code per empresa
- **Throws:** `ConflictError` if code exists
- **Logging:** Info-level audit trail

**`updateChecklistTemplate(empresaId, id, data, userId, db)`**

- **Purpose:** Update template and manage items (add/update/delete)
- **Atomic Operation:** Uses Prisma transaction
- **Item Management:**
  - Creates new items (no id)
  - Updates existing items (with id)
  - Deletes items not in update payload (soft delete via isActive or hard delete)
- **Returns:** Updated template
- **Throws:** `ConflictError` if code update conflicts
- **Logging:** Info-level audit trail

**`deleteChecklistTemplate(empresaId, id, userId, db)`**

- **Purpose:** Hard delete template
- **Validation:** Prevents deletion if in use (receptions > 0 or qualityChecks > 0)
- **Recommendation:** Suggests deactivation instead via isActive = false
- **Throws:** `BadRequestError` if in use
- **Logging:** Warning-level audit trail

---

### Checklist Controller Endpoints

**Location:** [src/features/workshop/checklists/checklists.controller.ts](backend/src/features/workshop/checklists/checklists.controller.ts)

| Method | Endpoint | Authorization   | Description                     |
| ------ | -------- | --------------- | ------------------------------- |
| GET    | `/`      | WORKSHOP_VIEW   | List all templates with filters |
| GET    | `/:id`   | WORKSHOP_VIEW   | Get single template             |
| POST   | `/`      | WORKSHOP_CREATE | Create new template             |
| PUT    | `/:id`   | WORKSHOP_UPDATE | Update template                 |
| DELETE | `/:id`   | WORKSHOP_DELETE | Delete template                 |

---

### Data Transfer Objects (DTO)

**Location:** [src/features/workshop/checklists/checklists.dto.ts](backend/src/features/workshop/checklists/checklists.dto.ts)

**`CreateChecklistTemplateDTO`**

- Validates and normalizes: code (uppercase/trim), name, description, category
- Items are normalized with defaults:
  - `responseType`: defaults to BOOLEAN
  - `isRequired`: defaults to false
  - `order`: defaults to 0
  - `options`: defaults to null

**`UpdateChecklistTemplateDTO`**

- All fields optional
- Similar normalization as create DTO
- Allows partial updates and item modifications

**`ChecklistTemplateResponseDTO`**

- Includes stats: receptionsCount, qualityChecksCount
- Converts category enum to label: `CHECKLIST_CATEGORY_LABELS`

---

### Interfaces & Types

**Location:** [src/features/workshop/checklists/checklists.interface.ts](backend/src/features/workshop/checklists/checklists.interface.ts)

**`IChecklistItem`**

```typescript
{
  id: string
  checklistTemplateId: string
  code: string
  name: string
  description?: string | null
  responseType: ChecklistItemType
  isRequired: boolean
  order: number
  options?: any  // Array of strings for SELECTION type
  isActive: boolean
}
```

**`IChecklistTemplate`**

```typescript
{
  id: string
  code: string
  name: string
  description?: string | null
  category: ChecklistCategory
  isActive: boolean
  items?: IChecklistItem[]
  empresaId: string
  createdAt: Date
  updatedAt: Date
}
```

**`IChecklistTemplateWithStats`** extends IChecklistTemplate

```typescript
{
  _count?: {
    receptions: number
    qualityChecks: number
  }
}
```

**`IChecklistFilters`**

```typescript
{
  search?: string
  isActive?: boolean
  category?: ChecklistCategory
  page?: number
  limit?: number
  sortBy?: string  // default: 'name'
  sortOrder?: 'asc' | 'desc'  // default: 'asc'
}
```

**`CHECKLIST_CATEGORY_LABELS`** - Display labels for UI

```typescript
{
  RECEPTION: 'Recepción',
  DIAGNOSIS: 'Diagnóstico',
  QUALITY_CONTROL: 'Control de Calidad'
}
```

---

## 3. DIAGNOSIS SERVICE & CHECKLIST LINKAGE

### DiagnosisService Methods

**Location:** [src/features/workshop/diagnoses/diagnoses.service.ts](backend/src/features/workshop/diagnoses/diagnoses.service.ts)

**`findDiagnosisById(db, id, empresaId)`**

- Includes: findings, evidences, suggestedOperations (with operation), suggestedParts (with item)

**`findDiagnosisByServiceOrder(db, serviceOrderId, empresaId)`**

- Find diagnosis linked to a ServiceOrder (optional, 1:1)

**`createDiagnosis(db, empresaId, userId, data)`**

- Creates with: receptionId OR serviceOrderId, technicianId, generalNotes, severity
- Status initialized to DRAFT
- startedAt set to now()

**`updateDiagnosis(db, id, empresaId, data)`**

- Can update: status, generalNotes, severity, technicianId, startedAt, finishedAt

**`addDiagnosisFinding(db, diagnosisId, empresaId, data)`**

- Adds diagnostic finding: category, description, severity, requiresClientAuth, observation

**`addDiagnosisSuggestedOp(db, diagnosisId, empresaId, data)`**

- Suggests operation: operationId (optional), description, estimatedMins, estimatedPrice

**`addDiagnosisSuggestedPart(db, diagnosisId, empresaId, data)`**

- Suggests part: itemId (optional), description, quantity, estimatedCost, estimatedPrice

**`removeDiagnosisFinding(db, findingId, empresaId)`**

- Delete a finding

---

### Current ServiceDiagnosis → Checklist Relationship

**INDIRECT LINKAGE (via VehicleReception):**

```
ServiceDiagnosis
    └─ receptionId (optional, 1:1)
        └─ VehicleReception
            ├─ checklistTemplateId
            └─ checklistResponses
```

**Current Status:**

- ServiceDiagnosis does NOT have direct access to checklists
- Checklists are currently used ONLY in:
  - `VehicleReception` (RECEPTION category)
  - `QualityCheck` (QUALITY_CONTROL category)
- DIAGNOSIS category is defined but not yet connected to ServiceDiagnosis

**Potential Extension:**
To add checklist support to diagnosis:

1. Add `checklistTemplateId` field to ServiceDiagnosis
2. Create `DiagnosisChecklistResponse` or reuse `ChecklistResponse` with diagnosisId
3. Wire up in DiagnosisService for getting/updating diagnostic checklists

---

## 4. EXISTING SEEDING PATTERNS

### Current Seed Infrastructure

**Seed Files Location:** [prisma/seeds/](backend/prisma/seeds/)

**Existing Seeds:**

- `brands.seed.ts` - Vehicle brands
- `categories.seed.ts` - Item categories
- `users.seed.ts` - System users
- `empresas.seed.ts` - Companies/enterprises
- `items.seed.ts` - Inventory items
- `suppliers.seed.ts` - Suppliers
- `warehouses.seed.ts` - Warehouses
- `models.seed.ts` - Vehicle models
- `units.seed.ts` - Measurement units
- `roles.seed.ts` - User roles
- `permissions.seed.ts` - System permissions
- `dynamicRoles.seed.ts` - Dynamic role assignments
- `companyRoles.seed.ts` - Company-level roles

**Important:** NO checkpoint/checklist seed files found yet

- No `checklists.seed.ts`
- No templates seeded during database initialization

**Seed Index:** [prisma/seeds/index.ts](backend/prisma/seeds/index.ts)

- Orchestrates seed execution order

---

## 5. QUALITY CHECK SERVICE (Uses Checklists)

### QualityCheck Service Methods

**Location:** [src/features/workshop/qualityChecks/qualityChecks.service.ts](backend/src/features/workshop/qualityChecks/qualityChecks.service.ts)

**`findQualityCheckBySOId(db, serviceOrderId, empresaId)`**

- Lookup by ServiceOrder (1:1 relationship)

**`findQualityCheckById(db, id, empresaId)`**

- Get single quality check

**`createQualityCheck(db, empresaId, userId, data)`**

- Creates quality check linked to ServiceOrder
- Validates ServiceOrder exists and status is IN_PROGRESS or QUALITY_CHECK
- Prevents duplicate quality checks (1:1 constraint)
- Moves ServiceOrder to QUALITY_CHECK status
- Sets status = IN_PROGRESS, startedAt = now()
- Input: serviceOrderId, inspectorId, notes, checklistItems

**`submitQualityCheck(db, id, empresaId, data)`**

- Completes quality check evaluation
- Checks all checklistItems for pass/fail
- Updates ServiceOrder status:
  - All passed → READY (ready for delivery)
  - Any failed → IN_PROGRESS (needs rework)
- Tracks retryCount (max 3 attempts before escalation)
- Input: checklistItems (with passed field), failureNotes, notes

**Checklist Integration:**

- Uses legacy `checklistItems` JSON field instead of ChecklistResponse model
- Potential migration target: Switch to ChecklistTemplate + ChecklistResponse

---

## 6. VEHICLE RECEPTION (Uses Checklists)

**Location:** [prisma/models/workshop/vehicleReception.prisma](backend/prisma/models/workshop/vehicleReception.prisma)

**Checklist Fields:**

```prisma
// Dynamic checklist for reception process
checklistTemplateId String?
checklistTemplate   ChecklistTemplate?  @relation(fields: [checklistTemplateId], references: [id], onDelete: SetNull)
checklistResponses  ChecklistResponse[]
```

**Current Reception Service:**

- [src/features/workshop/receptions/receptions.service.ts](backend/src/features/workshop/receptions/receptions.service.ts)
- Does NOT yet show active checklist response management
- Template can be associated but response capture not shown in service

---

## 7. ROUTES & PERMISSIONS

### Checklist Routes

**Location:** [src/features/workshop/checklists/checklists.routes.ts](backend/src/features/workshop/checklists/checklists.routes.ts)

```
GET    /checklists/              [WORKSHOP_VIEW]
GET    /checklists/:id           [WORKSHOP_VIEW]
POST   /checklists/              [WORKSHOP_CREATE]
PUT    /checklists/:id           [WORKSHOP_UPDATE]
DELETE /checklists/:id           [WORKSHOP_DELETE]
```

**Permissions Defined in:**

- [prisma/seeds/permissions.seed.ts](backend/prisma/seeds/permissions.seed.ts)
- [prisma/seeds/roles.seed.ts](backend/prisma/seeds/roles.seed.ts)
- [prisma/seeds/companyRoles.seed.ts](backend/prisma/seeds/companyRoles.seed.ts)

All workshop operations share same permission set: `workshop.view`, `workshop.create`, `workshop.update`, `workshop.delete`

---

## 8. KEY FINDINGS & INSIGHTS

### ✅ What's Working

1. **Robust ChecklistTemplate system** with full CRUD operations
2. **Flexible item types** (BOOLEAN, TEXT, NUMBER, SELECTION)
3. **Multi-response storage** via ChecklistResponse model with flexible value fields
4. **Good separation** - templates defined once, responses captured separately
5. **Audit trail** - createdBy, createdAt, updatedAt on all models
6. **Transactional updates** - Items managed atomically with template updates
7. **Prevent accidental deletion** - In-use detection prevents data loss
8. **Clean permissions model** - Role-based access control in place

### ⚠️ Gaps & Opportunities

1. **DIAGNOSIS Category Unused**
   - Category exists but not yet wired to ServiceDiagnosis
   - Checklists not yet captured during diagnostic process
   - Potential for diagnostic workflow templates

2. **No Seeding Pattern for Checklists**
   - Need `checklists.seed.ts` for initial templates
   - QA templates, reception templates not pre-loaded

3. **QualityCheck Legacy JSON**
   - Still uses `checklistItems` JSON field instead of ChecklistResponse model
   - Should migrate to use ChecklistTemplate + responses

4. **VehicleReception Not Showing Checklist Capture**
   - Template association exists but response capture not visible in service
   - Need endpoints for recording checklist responses at reception

5. **No Checklist → ServiceType Mapping**
   - Could define "which checklist applies to which service type"
   - Would enable auto-selection of appropriate template

6. **ServiceDiagnosis → Checklist Missing Direct Link**
   - Currently only indirect via receptionId
   - Could add direct checklistTemplateId field for standalone diagnosis templates

---

## 9. DATABASE STRUCTURE SUMMARY TABLE

| Model             | Purpose              | Key Relations                                  | Instances                           |
| ----------------- | -------------------- | ---------------------------------------------- | ----------------------------------- |
| ChecklistTemplate | Template definition  | 1-to-many Items, Receptions, QualityChecks     | Master data (rare changes)          |
| ChecklistItem     | Question in template | 1-to-many Responses, belongs to Template       | Rare changes (few per template)     |
| ChecklistResponse | Captured answer      | References Item, Reception OR QualityCheck     | Frequent (created per reception/QC) |
| ServiceDiagnosis  | Diagnostic record    | Optional link to Reception + ServiceOrder      | Moderate (one per service)          |
| VehicleReception  | Vehicle intake       | Optional link to ChecklistTemplate + Responses | Frequent (every vehicle gets one)   |
| QualityCheck      | Quality gate         | Links to ServiceOrder + Template + Responses   | Frequent (end of service)           |
| ServiceType       | Service catalog      | No template link (enhancement opportunity)     | Master data                         |

---

## 10. NEXT STEPS FOR IMPLEMENTATION

### Phase 1: Immediate (Seeding & Standardization)

- [ ] Create `checklists.seed.ts` with standard templates (3 reception, 3 QC, 3 diagnosis templates)
- [ ] Migrate QualityCheck from JSON checklistItems to ChecklistTemplate + ChecklistResponse

### Phase 2: Diagnosis Enhancement

- [ ] Add `checklistTemplateId` to ServiceDiagnosis
- [ ] Wire up diagnostic checklist capture in diagnoses service
- [ ] Create UI for capturing diagnostic checklists

### Phase 3: Integration & Mapping

- [ ] Add ChecklistTemplate association to ServiceType
- [ ] Create auto-selection logic: ServiceType → Default Checklist
- [ ] Add endpoint for listing applicable templates by category + service type

### Phase 4: Advanced Features

- [ ] Checklist versioning (track template changes over time)
- [ ] Conditional items (show/hide based on previous answers)
- [ ] Photo/evidence capture per checklist item
- [ ] Signature fields for approval workflows
