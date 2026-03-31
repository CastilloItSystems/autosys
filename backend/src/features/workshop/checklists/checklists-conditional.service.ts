// backend/src/features/workshop/checklists/checklists-conditional.service.ts
// FASE 3.3: Conditional QC Rules - Evaluate dynamic field requirements based on responses

import type {
  PrismaClient,
  ChecklistResponse,
  ChecklistItem,
} from '../../../generated/prisma/client.js'

/**
 * Conditional Rule Structure
 * {
 *   "rules": [
 *     {
 *       "id": "rule1",
 *       "condition": {
 *         "itemId": "item-uuid",
 *         "valueEquals": true | "value" | 123
 *       },
 *       "action": {
 *         "requiredItemIds": ["item-uuid1", "item-uuid2"]
 *       }
 *     }
 *   ]
 * }
 */

export interface ConditionalRule {
  id: string
  condition: {
    itemId: string
    valueEquals: unknown
  }
  action: {
    requiredItemIds: string[]
  }
}

export interface ConditionalRulesPayload {
  rules: ConditionalRule[]
}

/**
 * Evaluate conditional rules based on checklist responses
 * Returns list of item IDs that should be marked as required due to conditions met
 */
export async function evaluateConditionalRules(
  responses: ChecklistResponse[],
  conditionalRulesJson: unknown
): Promise<string[]> {
  if (!conditionalRulesJson) {
    return []
  }

  try {
    const payload = conditionalRulesJson as ConditionalRulesPayload
    const activatedRequiredIds: string[] = []

    if (!Array.isArray(payload.rules)) {
      return []
    }

    // For each response, check if conditions are met
    for (const response of responses) {
      const responseValue = getResponseValue(response)

      // Check each rule
      for (const rule of payload.rules) {
        // Check if this response triggers the condition
        if (rule.condition.itemId === response.checklistItemId) {
          const conditionMet = responseValue === rule.condition.valueEquals

          if (conditionMet && rule.action?.requiredItemIds) {
            // Add required items from this rule
            activatedRequiredIds.push(...rule.action.requiredItemIds)
          }
        }
      }
    }

    // Return unique IDs
    return [...new Set(activatedRequiredIds)]
  } catch (error) {
    console.error('Error evaluating conditional rules:', error)
    return []
  }
}

/**
 * Extract the actual value from a ChecklistResponse based on its type
 */
export function getResponseValue(response: ChecklistResponse): unknown {
  if (response.boolValue !== null) return response.boolValue
  if (response.textValue) return response.textValue
  if (response.numValue !== null) return response.numValue
  if (response.selectionValue) return response.selectionValue
  return undefined
}

/**
 * Validate a ChecklistResponse against conditional rules
 * and return all required fields (both static + conditionally activated)
 */
export async function validateWithConditionalRules(
  prisma: PrismaClient,
  templateId: string,
  responses: ChecklistResponse[]
): Promise<{
  isValid: boolean
  missingRequiredItems: string[]
  activatedRules: string[]
}> {
  try {
    // Get template with items and conditional rules
    const template = await prisma.checklistTemplate.findUnique({
      where: { id: templateId },
      include: {
        items: true,
      },
    })

    if (!template) {
      return {
        isValid: false,
        missingRequiredItems: [],
        activatedRules: [],
      }
    }

    // Evaluate conditional rules
    const conditionallyRequiredIds = await evaluateConditionalRules(
      responses,
      template.conditionalRules
    )

    // Get all static required items
    const staticRequiredIds = template.items
      .filter((item) => item.isRequired)
      .map((item) => item.id)

    // Combine static + conditional required items
    const allRequiredIds = [
      ...new Set([...staticRequiredIds, ...conditionallyRequiredIds]),
    ]

    // Get response item IDs
    const responseItemIds = responses.map((r) => r.checklistItemId)

    // Find missing required items
    const missingRequiredItems = allRequiredIds.filter(
      (id) => !responseItemIds.includes(id)
    )

    return {
      isValid: missingRequiredItems.length === 0,
      missingRequiredItems,
      activatedRules: conditionallyRequiredIds,
    }
  } catch (error) {
    console.error('Error validating with conditional rules:', error)
    return {
      isValid: false,
      missingRequiredItems: [],
      activatedRules: [],
    }
  }
}

/**
 * Get detailed validation info including item names
 */
export async function getValidationDetailsWithConditionalRules(
  prisma: PrismaClient,
  templateId: string,
  responses: ChecklistResponse[]
): Promise<{
  isValid: boolean
  staticRequired: { id: string; name: string }[]
  conditionallyRequired: { id: string; name: string; triggeredBy: string[] }[]
  missingItems: { id: string; name: string }[]
}> {
  try {
    const template = await prisma.checklistTemplate.findUnique({
      where: { id: templateId },
      include: { items: true },
    })

    if (!template) {
      return {
        isValid: false,
        staticRequired: [],
        conditionallyRequired: [],
        missingItems: [],
      }
    }

    // Static required
    const staticRequired = template.items
      .filter((item) => item.isRequired)
      .map((item) => ({ id: item.id, name: item.name }))

    // Evaluate conditionals
    const conditionallyActivatedIds = await evaluateConditionalRules(
      responses,
      template.conditionalRules
    )
    const conditionallyRequired = template.items
      .filter((item) => conditionallyActivatedIds.includes(item.id))
      .map((item) => ({
        id: item.id,
        name: item.name,
        triggeredBy: getTriggeringRules(
          item.id,
          template.conditionalRules,
          responses
        ),
      }))

    // Missing items
    const allRequiredIds = [
      ...new Set([
        ...staticRequired.map((r) => r.id),
        ...conditionallyActivatedIds,
      ]),
    ]
    const responseItemIds = responses.map((r) => r.checklistItemId)
    const missingIds = allRequiredIds.filter(
      (id) => !responseItemIds.includes(id)
    )
    const missingItems = template.items
      .filter((item) => missingIds.includes(item.id))
      .map((item) => ({ id: item.id, name: item.name }))

    return {
      isValid: missingItems.length === 0,
      staticRequired,
      conditionallyRequired,
      missingItems,
    }
  } catch (error) {
    console.error('Error getting validation details:', error)
    return {
      isValid: false,
      staticRequired: [],
      conditionallyRequired: [],
      missingItems: [],
    }
  }
}

/**
 * Helper: Get which rules triggered a specific item
 */
function getTriggeringRules(
  itemId: string,
  conditionalRulesJson: unknown,
  responses: ChecklistResponse[]
): string[] {
  if (!conditionalRulesJson) return []

  try {
    const payload = conditionalRulesJson as ConditionalRulesPayload
    const triggers: string[] = []

    for (const response of responses) {
      const responseValue = getResponseValue(response)

      for (const rule of payload.rules) {
        if (rule.condition.itemId === response.checklistItemId) {
          const conditionMet = responseValue === rule.condition.valueEquals

          if (conditionMet && rule.action?.requiredItemIds?.includes(itemId)) {
            triggers.push(rule.id)
          }
        }
      }
    }

    return triggers
  } catch {
    return []
  }
}
