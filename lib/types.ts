export interface Member {
  id: string
  name: string
  isActive: boolean
  created_at?: string
  updated_at?: string
}

export interface LunchEntry {
  id: string
  memberId: string
  date: string // ISO date string (YYYY-MM-DD)
  quantity: number
  price: number | null // Giá tiền mỗi suất (VND), nullable
  note: string | null
  created_at?: string
  updated_at?: string
}

export interface LunchEntryWithMember extends LunchEntry {
  member: Member
}

export interface WeeklyDebt {
  memberId: string
  memberName: string
  totalMeals: number
  totalAmount: number
}

export interface Payment {
  id: string
  memberId: string
  startDate: string // ISO date string (YYYY-MM-DD)
  endDate: string // ISO date string (YYYY-MM-DD)
  amount: number
  note: string | null
  created_at?: string
  updated_at?: string
}

import { CONFIG } from './config'

export const DEFAULT_MEAL_PRICE = CONFIG.DEFAULT_MEAL_PRICE

