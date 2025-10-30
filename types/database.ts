export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      User: {
        Row: {
          id: string
          email: string
          name: string
          avatarUrl: string | null
          status: 'Active' | 'Inactive'
          passwordHash: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          avatarUrl?: string | null
          status?: 'Active' | 'Inactive'
          passwordHash?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: Partial<Database['public']['Tables']['User']['Row']>
      }

      Role: {
        Row: {
          id: string
          name: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          name: string
          createdAt?: string
          updatedAt?: string
        }
        Update: Partial<Database['public']['Tables']['Role']['Row']>
      }

      UserRole: {
        Row: {
          userId: string
          roleId: string
          createdAt: string
        }
        Insert: {
          userId: string
          roleId: string
          createdAt?: string
        }
        Update: Partial<Database['public']['Tables']['UserRole']['Row']>
      }

      Module: {
        Row: {
          id: string
          name: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          name: string
          createdAt?: string
          updatedAt?: string
        }
        Update: Partial<Database['public']['Tables']['Module']['Row']>
      }

      Permission: {
        Row: {
          id: string
          roleId: string
          moduleId: string
          level: 'full' | 'edit' | 'view' | 'none'
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          roleId: string
          moduleId: string
          level: 'full' | 'edit' | 'view' | 'none'
          createdAt?: string
          updatedAt?: string
        }
        Update: Partial<Database['public']['Tables']['Permission']['Row']>
      }

      Task: {
        Row: {
          id: string
          name: string
          description: string | null
          assigneeId: string | null
          dueDate: string
          status: 'NotStarted' | 'InProgress' | 'Completed' | 'Overdue'
          priority: 'Critical' | 'High' | 'Medium' | 'Low'
          isRecurring: boolean
          parentTaskId: string | null
          createdById: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          assigneeId?: string | null
          dueDate: string
          status?: 'NotStarted' | 'InProgress' | 'Completed' | 'Overdue'
          priority?: 'Critical' | 'High' | 'Medium' | 'Low'
          isRecurring?: boolean
          parentTaskId?: string | null
          createdById?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: Partial<Database['public']['Tables']['Task']['Row']>
      }

      TaskComment: {
        Row: {
          id: string
          taskId: string
          authorId: string
          text: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          taskId: string
          authorId: string
          text: string
          createdAt?: string
          updatedAt?: string
        }
        Update: Partial<Database['public']['Tables']['TaskComment']['Row']>
      }

      RecurringPattern: {
        Row: {
          id: string
          taskId: string
          pattern: 'daily' | 'weekly' | 'monthly' | 'custom'
          interval: number
          daysOfWeek: number[] | null
          endCondition: 'never' | 'after' | 'onDate'
          occurrences: number | null
          endDate: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          taskId: string
          pattern: 'daily' | 'weekly' | 'monthly' | 'custom'
          interval?: number
          daysOfWeek?: number[] | null
          endCondition?: 'never' | 'after' | 'onDate'
          occurrences?: number | null
          endDate?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: Partial<Database['public']['Tables']['RecurringPattern']['Row']>
      }

      Budget: {
        Row: {
          id: string
          name: string
          totalBudget: string
          fiscalYear: number
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          name: string
          totalBudget: string
          fiscalYear: number
          createdAt?: string
          updatedAt?: string
        }
        Update: Partial<Database['public']['Tables']['Budget']['Row']>
      }

      PaymentPlan: {
        Row: {
          id: string
          planName: string
          budgetId: string | null
          amount: string
          dueDate: string
          description: string | null
          vendor: string | null
          status: 'Scheduled' | 'Pending' | 'Paid' | 'Overdue'
          createdById: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          planName: string
          budgetId?: string | null
          amount: string
          dueDate: string
          description?: string | null
          vendor?: string | null
          status?: 'Scheduled' | 'Pending' | 'Paid' | 'Overdue'
          createdById?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: Partial<Database['public']['Tables']['PaymentPlan']['Row']>
      }

      Expense: {
        Row: {
          id: string
          planId: string | null
          amount: string
          paymentDate: string
          paymentMethod: string | null
          vendor: string | null
          description: string | null
          receiptFilename: string | null
          receiptUrl: string | null
          notes: string | null
          createdById: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          planId?: string | null
          amount: string
          paymentDate: string
          paymentMethod?: string | null
          vendor?: string | null
          description?: string | null
          receiptFilename?: string | null
          receiptUrl?: string | null
          notes?: string | null
          createdById?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: Partial<Database['public']['Tables']['Expense']['Row']>
      }

      Farmer: {
        Row: {
          id: string
          farmerCode: string
          name: string
          location: string | null
          contactPhone: string | null
          contactEmail: string | null
          landSizeHectares: string | null
          yearGroup: number | null
          status: string | null
          baselineIncome: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          farmerCode: string
          name: string
          location?: string | null
          contactPhone?: string | null
          contactEmail?: string | null
          landSizeHectares?: string | null
          yearGroup?: number | null
          status?: string | null
          baselineIncome?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: Partial<Database['public']['Tables']['Farmer']['Row']>
      }

      Training: {
        Row: {
          id: string
          topic: string
          description: string | null
          date: string
          location: string | null
          facilitatorId: string | null
          capacity: number | null
          status: 'Upcoming' | 'Completed' | 'Cancelled'
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          topic: string
          description?: string | null
          date: string
          location?: string | null
          facilitatorId?: string | null
          capacity?: number | null
          status?: 'Upcoming' | 'Completed' | 'Cancelled'
          createdAt?: string
          updatedAt?: string
        }
        Update: Partial<Database['public']['Tables']['Training']['Row']>
      }
    }

    Views: {
      [_ in never]: never
    }

    Functions: {
      [_ in never]: never
    }

    Enums: {
      // Provided in prompt (alias-like types for UI usage)
      AccessLevel: 'FULL_ACCESS' | 'EDIT' | 'VIEW_ONLY' | 'NO_ACCESS'
      RecurrenceType: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM'

      // Based on Prisma schema enums
      UserStatus: 'Active' | 'Inactive'
      TaskStatus: 'NotStarted' | 'InProgress' | 'Completed' | 'Overdue'
      TaskPriority: 'Critical' | 'High' | 'Medium' | 'Low'
      PermissionLevel: 'full' | 'edit' | 'view' | 'none'
      RecurrencePatternType: 'daily' | 'weekly' | 'monthly' | 'custom'
      RecurrenceEndCondition: 'never' | 'after' | 'onDate'
      TrainingStatus: 'Upcoming' | 'Completed' | 'Cancelled'
      PaymentStatus: 'Scheduled' | 'Pending' | 'Paid' | 'Overdue'
    }
  }
}


