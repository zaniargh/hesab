// Client-side API utility functions

class APIError extends Error {
  constructor(public status: number, message: string, public details?: any) {
    super(message)
    this.name = 'APIError'
  }
}

async function fetcher(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // برای ارسال cookies
  })

  const data = await response.json()

  if (!response.ok) {
    throw new APIError(response.status, data.error || 'خطای سرور', data.details)
  }

  return data
}

// Auth APIs
export const authAPI = {
  login: async (username: string, password: string) => {
    return fetcher('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  },

  logout: async () => {
    return fetcher('/api/auth/logout', {
      method: 'POST',
    })
  },

  getMe: async () => {
    return fetcher('/api/auth/me')
  },
}

// Customer APIs
export const customerAPI = {
  getAll: async () => {
    return fetcher('/api/customers')
  },

  getById: async (id: string) => {
    return fetcher(`/api/customers/${id}`)
  },

  create: async (data: any) => {
    return fetcher('/api/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id: string, data: any) => {
    return fetcher(`/api/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  delete: async (id: string) => {
    return fetcher(`/api/customers/${id}`, {
      method: 'DELETE',
    })
  },
}

// Connection APIs
export const connectionAPI = {
  getAll: async () => {
    return fetcher('/api/connections')
  },

  delete: async (id: string) => {
    return fetcher(`/api/connections/${id}`, {
      method: 'DELETE',
    })
  },

  update: async (id: string, customName: string) => {
    return fetcher(`/api/connections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ customName }),
    })
  },
}

// Request APIs
export const requestAPI = {
  getAll: async () => {
    return fetcher('/api/requests')
  },

  create: async (uniqueCode: string, customName: string) => {
    return fetcher('/api/requests', {
      method: 'POST',
      body: JSON.stringify({ uniqueCode, customName }),
    })
  },

  accept: async (id: string) => {
    return fetcher(`/api/requests/${id}/accept`, {
      method: 'POST',
    })
  },

  reject: async (id: string) => {
    return fetcher(`/api/requests/${id}/reject`, {
      method: 'POST',
    })
  },
}

// Transaction APIs
export const transactionAPI = {
  getAll: async () => {
    return fetcher('/api/transactions')
  },

  getById: async (id: string) => {
    return fetcher(`/api/transactions/${id}`)
  },

  create: async (data: any) => {
    return fetcher('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id: string, data: any) => {
    return fetcher(`/api/transactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  delete: async (id: string) => {
    return fetcher(`/api/transactions/${id}`, {
      method: 'DELETE',
    })
  },

  addReceipt: async (transactionId: string, accountId: string, receiptData: any) => {
    return fetcher(`/api/transactions/${transactionId}/receipts`, {
      method: 'POST',
      body: JSON.stringify({ accountId, ...receiptData }),
    })
  },
}

// Receipt APIs
export const receiptAPI = {
  approve: async (id: string) => {
    return fetcher(`/api/receipts/${id}/approve`, {
      method: 'POST',
    })
  },

  markNeedsFollowUp: async (id: string) => {
    return fetcher(`/api/receipts/${id}/needs-follow-up`, {
      method: 'POST',
    })
  },
}

export { APIError }
