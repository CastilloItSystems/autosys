/**
 * Generate Alerts Job Processor
 * Generates alerts for low stock, no movement items, etc.
 */

import { logger } from '../../../../shared/utils/logger';
import prisma from '../../../../services/prisma.service';
import { EventType } from '../../shared/events/event.types';
import EventService from '../../shared/events/event.service';

const eventService = EventService.getInstance();

export interface IGenerateAlertsJobData {
  warehouseId?: string;
  checkType?: 'low-stock' | 'no-movement' | 'all';
  thresholdDays?: number;
}

export async function generateAlertsProcessor(
  data: IGenerateAlertsJobData
): Promise<void> {
  try {
    const { warehouseId, checkType = 'all', thresholdDays = 30 } = data;

    logger.info('Generating inventory alerts', {
      warehouseId,
      checkType,
      thresholdDays,
    });

    // Check for low stock items
    if (checkType === 'low-stock' || checkType === 'all') {
      const where: any = {};
      if (warehouseId) {
        where.warehouseId = warehouseId;
      }

      const lowStockItems = await prisma.stock.findMany({
        where,
      });

      let alertCount = 0;
      for (const stock of lowStockItems) {
        // Check if quantity is below safe level
        if (stock.quantityAvailable < 10) {
          await eventService.emit({
            type: EventType.STOCK_LOW,
            entityId: stock.id,
            entityType: 'stock',
            userId: 'SYSTEM',
            data: {
              itemId: stock.itemId,
              warehouseId: stock.warehouseId,
              currentQuantity: stock.quantityAvailable,
              threshold: 10,
            },
          });
          alertCount++;
        }
      }

      logger.info('Low stock alert check completed', {
        itemsChecked: lowStockItems.length,
        alertsGenerated: alertCount,
      });
    }

    // Check for items with no movement
    if (checkType === 'no-movement' || checkType === 'all') {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - thresholdDays);

      const where: any = {
        lastMovementAt: {
          lt: thresholdDate,
        },
        quantityAvailable: {
          gt: 0,
        },
      };

      if (warehouseId) {
        where.warehouseId = warehouseId;
      }

      const noMovementItems = await prisma.stock.findMany({
        where,
      });

      for (const stock of noMovementItems) {
        await eventService.emit({
          type: EventType.SYSTEM_WARNING,
          entityId: stock.id,
          entityType: 'stock',
          userId: 'SYSTEM',
          data: {
            message: `Item has no movement for ${thresholdDays} days`,
            itemId: stock.itemId,
            warehouseId: stock.warehouseId,
            lastMovement: stock.lastMovementAt,
          },
        });
      }

      logger.info('No movement alert check completed', {
        itemsFound: noMovementItems.length,
      });
    }

    logger.info('Alert generation job completed successfully');
  } catch (error) {
    logger.error('Error generating alerts', { error });
    throw error;
  }
}
