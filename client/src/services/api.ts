const API_BASE_URL = 'http://localhost:3000/api'

export interface Order {
  id: string
  createdAt: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  items: Array<{
    id: string
    name: string
    quantity: number
    sku: string
  }>
}

export const api = {
  async getOrders(): Promise<Order[]> {
    const response = await fetch(`${API_BASE_URL}/orders`)
    if (!response.ok) {
      throw new Error('Failed to fetch orders')
    }
    return response.json()
  },

  async createOrder(orderData: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    })
    if (!response.ok) {
      throw new Error('Failed to create order')
    }
    return response.json()
  },

  async updateOrder(id: string, orderData: Partial<Order>): Promise<Order> {
    const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    })
    if (!response.ok) {
      throw new Error('Failed to update order')
    }
    return response.json()
  },

  async deleteOrder(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to delete order')
    }
  },
} 