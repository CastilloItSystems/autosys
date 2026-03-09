/**
 * Hook Registry - Central Hook Management System
 */

import { v4 as uuidv4 } from 'uuid'
import { logger } from '../../../shared/utils/logger'
import { IHook, IHookContext, HookType, HookStage } from './hook.interface'

class HookRegistry {
  private static instance: HookRegistry
  private hooks: Map<HookType, IHook[]> = new Map()

  private constructor() {}

  static getInstance(): HookRegistry {
    if (!HookRegistry.instance) {
      HookRegistry.instance = new HookRegistry()
    }
    return HookRegistry.instance
  }

  /**
   * Register a hook
   */
  register(
    hookType: HookType,
    stage: HookStage,
    handler: (context: IHookContext) => Promise<void> | void,
    priority = 0,
    enabled = true
  ): string {
    const hookId = uuidv4()

    if (!this.hooks.has(hookType)) {
      this.hooks.set(hookType, [])
    }

    const hook: IHook = {
      id: hookId,
      hookType,
      stage,
      handler,
      priority,
      enabled,
    }

    const hooksList = this.hooks.get(hookType)!
    hooksList.push(hook)
    // Sort by priority (higher priority first), then by stage (BEFORE first)
    hooksList.sort((a, b) => {
      const priorityDiff = (b.priority || 0) - (a.priority || 0)
      if (priorityDiff !== 0) return priorityDiff
      return a.stage === HookStage.BEFORE ? -1 : 1
    })

    logger.info(`Hook registered: ${hookId}`, {
      hookType,
      stage,
      priority,
    })

    return hookId
  }

  /**
   * Unregister a hook
   */
  unregister(hookId: string): boolean {
    let removed = false

    for (const [, hooks] of this.hooks) {
      const index = hooks.findIndex((h) => h.id === hookId)
      if (index > -1) {
        hooks.splice(index, 1)
        removed = true
        break
      }
    }

    if (removed) {
      logger.info(`Hook unregistered: ${hookId}`)
    }

    return removed
  }

  /**
   * Execute hooks for a specific type and stage
   */
  async execute(
    hookType: HookType,
    stage: HookStage,
    context: Omit<IHookContext, 'hookType' | 'stage' | 'timestamp'>
  ): Promise<void> {
    const hooks = this.hooks.get(hookType) || []
    const filteredHooks = hooks.filter(
      (h) => h.stage === stage && h.enabled !== false
    )

    if (filteredHooks.length === 0) {
      return
    }

    const fullContext: IHookContext = {
      ...context,
      hookType,
      stage,
      timestamp: new Date(),
    }

    logger.debug(`Executing ${filteredHooks.length} hooks`, {
      hookType,
      stage,
      entityId: context.entityId,
    })

    for (const hook of filteredHooks) {
      try {
        await Promise.resolve(hook.handler(fullContext))
        logger.debug(`Hook executed: ${hook.id}`, { hookType, stage })
      } catch (error) {
        if (stage === HookStage.BEFORE) {
          // BEFORE hooks errors should prevent execution
          logger.error(`BEFORE hook failed: ${hook.id}`, {
            error,
            hookType,
          })
          throw error
        } else {
          // AFTER hooks errors should be logged but not thrown
          logger.warn(`AFTER hook failed: ${hook.id}`, {
            error,
            hookType,
          })
          if (!fullContext.errors) {
            fullContext.errors = []
          }
          fullContext.errors.push(
            `Hook ${hook.id} failed: ${error instanceof Error ? error.message : String(error)}`
          )
        }
      }
    }
  }

  /**
   * Execute BEFORE hooks and return updated context
   */
  async executeBefore(
    hookType: HookType,
    context: Omit<IHookContext, 'hookType' | 'stage' | 'timestamp'>
  ): Promise<void> {
    await this.execute(hookType, HookStage.BEFORE, context)
  }

  /**
   * Execute AFTER hooks (without throwing errors)
   */
  async executeAfter(
    hookType: HookType,
    context: Omit<IHookContext, 'hookType' | 'stage' | 'timestamp'>
  ): Promise<void> {
    await this.execute(hookType, HookStage.AFTER, context)
  }

  /**
   * Get hooks for a specific type
   */
  getHooks(hookType: HookType): IHook[] {
    return this.hooks.get(hookType) || []
  }

  /**
   * Enable/disable a hook
   */
  setHookEnabled(hookId: string, enabled: boolean): boolean {
    for (const [, hooks] of this.hooks) {
      const hook = hooks.find((h) => h.id === hookId)
      if (hook) {
        hook.enabled = enabled
        logger.info(`Hook ${enabled ? 'enabled' : 'disabled'}: ${hookId}`)
        return true
      }
    }
    return false
  }

  /**
   * Clear all hooks (mainly for testing)
   */
  clearAll(): void {
    this.hooks.clear()
    logger.warn('All hooks cleared')
  }

  /**
   * Get hook count
   */
  getHookCount(hookType?: HookType): number {
    if (hookType) {
      return (this.hooks.get(hookType) || []).length
    }

    let total = 0
    for (const hooks of this.hooks.values()) {
      total += hooks.length
    }
    return total
  }
}

export default HookRegistry
