import type { CreditTransaction } from '../types'

export const MOCK_TRANSACTIONS: CreditTransaction[] = [
  {
    id: 'tx1',
    type: 'earned',
    amount: 80,
    description: 'Vendiste: Jean Skinny Negro',
    date: '2026-03-20',
  },
  {
    id: 'tx2',
    type: 'spent',
    amount: -5,
    description: 'Generación de imagen IA',
    date: '2026-03-19',
  },
  {
    id: 'tx3',
    type: 'purchased',
    amount: 100,
    description: 'Compra de créditos — Paquete Starter',
    date: '2026-03-18',
  },
  {
    id: 'tx4',
    type: 'spent',
    amount: -15,
    description: 'Try-on 3D IA — Bomber Vintage',
    date: '2026-03-17',
  },
  {
    id: 'tx5',
    type: 'earned',
    amount: 50,
    description: 'Referido exitoso: @maria.garcia',
    date: '2026-03-15',
  },
  {
    id: 'tx6',
    type: 'earned',
    amount: 10,
    description: 'Completaste tu perfil',
    date: '2026-03-14',
  },
  {
    id: 'tx7',
    type: 'spent',
    amount: -5,
    description: 'Generación de imagen IA',
    date: '2026-03-13',
  },
  {
    id: 'tx8',
    type: 'earned',
    amount: 25,
    description: 'Vendiste: Remera Básica Blanca',
    date: '2026-03-12',
  },
]
