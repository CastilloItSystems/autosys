/**
 * Check Overdue Loans Job
 * Identifies and alerts on overdue equipment loans
 */

import prisma from '../../../../services/prisma.service.js'
import { EventService } from '../../shared/events/event.service.js'
import { EventType } from '../../shared/types/event.types.js'

const eventService = EventService.getInstance()

export interface OverdueLoan {
  loanId: string
  loanNumber: string
  borrowerName: string
  loanDate: Date
  dueDate: Date
  daysOverdue: number
}

/**
 * Check for overdue loans and update their status
 */
export async function checkOverdueLoans(): Promise<OverdueLoan[]> {
  const overdue: OverdueLoan[] = []

  try {
    const loans = await prisma.loan.findMany({
      where: {
        status: {
          in: ['ACTIVE'],
        },
        dueDate: {
          lt: new Date(),
        },
        returnedAt: null,
      },
    })

    const now = new Date()

    for (const loan of loans) {
      const daysOverdue = Math.floor(
        (now.getTime() - loan.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      overdue.push({
        loanId: loan.id,
        loanNumber: loan.loanNumber,
        borrowerName: loan.borrowerName,
        loanDate: loan.startDate,
        dueDate: loan.dueDate,
        daysOverdue,
      })

      // Update loan status to OVERDUE
      if (loan.status !== 'OVERDUE') {
        await prisma.loan.update({
          where: { id: loan.id },
          data: {
            status: 'OVERDUE',
            updatedAt: new Date(),
          },
        })

        // Emit LOAN_OVERDUE event
        eventService.emit({
          type: EventType.LOAN_OVERDUE,
          entityId: loan.id,
          entityType: 'LOAN',
          data: {
            loanId: loan.id,
            loanNumber: loan.loanNumber,
            borrowerName: loan.borrowerName,
            daysOverdue,
          },
          userId: 'SYSTEM',
        })
      }
    }

    return overdue
  } catch (error) {
    console.error('Error checking overdue loans:', error)
    throw error
  }
}

/**
 * Process the overdue loans check job
 */
export async function processCheckOverdueLoansJob(data?: any): Promise<any> {
  console.log('⏰ Processing check overdue loans job...')

  try {
    const overdue = await checkOverdueLoans()

    const summary = {
      total: overdue.length,
      loans: overdue,
      timestamp: new Date(),
    }

    console.log(
      `✅ Overdue loans check completed: ${summary.total} overdue loans updated`
    )

    return summary
  } catch (error) {
    console.error('❌ Overdue loans check failed:', error)
    throw error
  }
}

/**
 * Job processor for queue system
 */
export async function processCheckOverdueLoansJob(data?: any): Promise<any> {
  console.log('⏰ Processing check overdue loans job...')

  try {
    const [overdue, reminders, report] = await Promise.all([
      checkOverdueLoans(),
      sendLoanReminders(),
      getOverdueLoanReport(),
    ])

    const summary = {
      overdue: {
        total: overdue.length,
        critical: overdue.filter((l) => l.status === 'CRITICAL').length,
        lost: overdue.filter((l) => l.status === 'LOST').length,
      },
      reminders: {
        sent: reminders.remindersSent,
        failed: reminders.failedCount,
      },
      report,
      timestamp: new Date(),
    }

    console.log(
      `✅ Overdue loans check completed: ${summary.overdue.total} overdue, ${summary.overdue.critical} critical`
    )

    return summary
  } catch (error) {
    console.error('❌ Overdue loans check failed:', error)
    throw error
  }
}

export default {
  checkOverdueLoans,
  sendLoanReminders,
  getOverdueLoanReport,
  processCheckOverdueLoansJob,
}
