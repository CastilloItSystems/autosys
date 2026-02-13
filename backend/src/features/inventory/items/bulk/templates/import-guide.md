# CSV Import Guide - Bulk Item Operations

## Overview

This guide provides instructions for importing items in bulk using the CSV import functionality in AutoSys. The import process supports creating new items and optionally updating existing ones.

---

## CSV File Format

### Required Columns

- **sku** (String): Unique Stock Keeping Unit identifier
- **name** (String): Item name/description
- **categoryId** (UUID): Category ID (use default if omitted)
- **unitId** (UUID): Unit of measurement ID (use default if omitted)
- **costPrice** (Decimal): Cost price per unit
- **salePrice** (Decimal): Sale price per unit

### Optional Columns

- **description** (String): Detailed description
- **brandId** (UUID): Brand identifier
- **wholesalePrice** (Decimal): Wholesale price per unit
- **minStock** (Integer): Minimum stock level
- **barcode** (String): Product barcode
- **minMargin** (Integer): Minimum profit margin percentage
- **maxMargin** (Integer): Maximum profit margin percentage

---

## Data Types & Validation

| Field          | Type    | Required    | Constraints                                                        |
| -------------- | ------- | ----------- | ------------------------------------------------------------------ |
| sku            | String  | ✅ Yes      | Max 50 chars, must be unique                                       |
| name           | String  | ✅ Yes      | Max 255 chars                                                      |
| description    | String  | ⭕ Optional | Max 1000 chars                                                     |
| categoryId     | UUID    | ⭕ Optional | Valid UUID format; default: `6bd78d44-79f1-4a7a-8e3d-5f1f1e1e1e1e` |
| unitId         | UUID    | ⭕ Optional | Valid UUID format; default: `c5e1d8e1-4e7d-4c1a-8b2d-1a1a1a1a1a1a` |
| brandId        | UUID    | ⭕ Optional | Valid UUID format                                                  |
| costPrice      | Decimal | ✅ Yes      | Positive number, 2 decimal places                                  |
| salePrice      | Decimal | ✅ Yes      | Positive number, 2 decimal places                                  |
| wholesalePrice | Decimal | ⭕ Optional | Positive number, 2 decimal places                                  |
| minStock       | Integer | ⭕ Optional | Non-negative integer; default: 0                                   |
| barcode        | String  | ⭕ Optional | Max 50 chars                                                       |
| minMargin      | Integer | ⭕ Optional | Integer 1-100 (percentage)                                         |
| maxMargin      | Integer | ⭕ Optional | Integer 1-100 (percentage)                                         |

---

## Example CSV File

```csv
sku,name,description,categoryId,unitId,brandId,costPrice,salePrice,wholesalePrice,minStock,barcode,minMargin,maxMargin
SKU-001,Premium Widget,High-quality widget for industrial use,6bd78d44-79f1-4a7a-8e3d-5f1f1e1e1e1e,c5e1d8e1-4e7d-4c1a-8b2d-1a1a1a1a1a1a,6bd78d44-79f1-4a7a-8e3d-5f1f1e1e1e1e,10.00,25.00,18.00,50,BAR-001-A,15,30
SKU-002,Standard Widget,Basic widget for general use,,,,8.50,20.00,,100,BAR-002-A,10,25
SKU-003,Deluxe Widget,Premium version with extra features,6bd78d44-79f1-4a7a-8e3d-5f1f1e1e1e1e,,6bd78d44-79f1-4a7a-8e3d-5f1f1e1e1e1e,15.00,35.00,28.00,25,BAR-003-A,20,35
SKU-004,Budget Widget,Economical option,,,,,12.00,22.00,,150,,5,20
```

---

## Import Options

### Create New Items (Default)

```json
{
  "fileName": "items_import.csv",
  "fileContent": "CSV file content as string",
  "options": {
    "updateExisting": false
  }
}
```

- Creates new items for all rows
- Skips if SKU already exists (unless updateExisting is true)

### Create & Update Existing Items

```json
{
  "fileName": "items_import.csv",
  "fileContent": "CSV file content as string",
  "options": {
    "updateExisting": true
  }
}
```

- Creates new items if SKU doesn't exist
- Updates existing items if SKU is found

---

## Validation Rules

### Per-Row Validation

1. **Required fields** cannot be empty: `sku`, `name`, `costPrice`, `salePrice`
2. **Unique constraint**: SKU must be unique across all items (unless explicitly updating)
3. **Numeric fields**: costPrice, salePrice, wholesalePrice must be positive numbers
4. **UUID fields**: If provided, must be valid GUID format
5. **Price validation**: salePrice should typically be >= costPrice

### Constraints

- Maximum **500 rows** per import operation
- Maximum **50 concurrent import operations** per minutes
- File size limit: **5 MB**

---

## Error Handling

### Common Errors & Solutions

| Error                       | Cause                                    | Solution                                                          |
| --------------------------- | ---------------------------------------- | ----------------------------------------------------------------- |
| "SKU and name are required" | Missing sku or name column               | Ensure both columns exist and have values                         |
| "Item already exists"       | SKU already in database                  | Use `updateExisting: true` or change SKU                          |
| "Invalid UUID format"       | categoryId, unitId, or brandId malformed | Verify UUID format (e.g., `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`) |
| "Price must be positive"    | costPrice or salePrice is negative/zero  | Ensure prices are > 0                                             |
| "Decimal overflow"          | Price value too large                    | Keep prices under 999,999.99                                      |

### Import Response

Success response includes:

```json
{
  "operationId": "uuid-of-operation",
  "imported": 95,
  "updated": 3,
  "failed": 2,
  "errors": [
    {
      "rowNumber": 5,
      "field": "sku",
      "value": "DUPLICATE-SKU",
      "error": "Item already exists and updateExisting is false"
    }
  ]
}
```

---

## Best Practices

### 1. **Data Preparation**

- Validate data in spreadsheet tool before CSV export
- Ensure consistent formatting (decimal places, leading zeros)
- Remove any trailing whitespace

### 2. **Testing**

- Start with 5-10 rows to test format
- Verify a few items were created correctly via API
- Check error log for any validation issues

### 3. **Large Imports**

- Split large datasets (1000+ rows) into multiple files
- Process files sequentially to avoid system overload
- Monitor operation status via GET /api/inventory/items/bulk/operations

### 4. **Data Quality**

- Use actual category and brand IDs from your system
- Standardize naming conventions (all caps, title case, etc.)
- Include descriptions for searchability

---

## API Endpoints

### Import Items

```bash
POST /api/inventory/items/bulk/import
Content-Type: application/json
Authorization: Bearer {token}

{
  "fileName": "items_import.csv",
  "fileContent": "sku,name,...\nSKU-001,Premium Widget,...",
  "options": {
    "updateExisting": false
  }
}
```

### Get Operation Status

```bash
GET /api/inventory/items/bulk/operations/{operationId}
Authorization: Bearer {token}
```

### List All Operations

```bash
GET /api/inventory/items/bulk/operations?page=1&limit=10
Authorization: Bearer {token}
```

---

## Default Values

When optional fields are omitted or empty:

| Field                 | Default Value                                    |
| --------------------- | ------------------------------------------------ |
| categoryId            | `6bd78d44-79f1-4a7a-8e3d-5f1f1e1e1e1e` (General) |
| unitId                | `c5e1d8e1-4e7d-4c1a-8b2d-1a1a1a1a1a1a` (Unit)    |
| description           | Empty string                                     |
| wholesalePrice        | Not set                                          |
| minStock              | 0                                                |
| barcode               | Not set                                          |
| brandId               | Not set                                          |
| minMargin / maxMargin | Not set                                          |

---

## Support

For issues or questions:

1. Check error details in operation response
2. Verify CSV format matches specification
3. Ensure all UUIDs are valid and exist in database
4. Contact support with operation ID for investigation
