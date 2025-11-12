export const PIPELINE_TEMPLATES = {
  SALES: {
    name: 'Sales Pipeline',
    description: 'Track leads from initial contact to closed deal',
    color: '#3b82f6',
    icon: '💼',
    stages: [
      { name: 'New Lead', color: '#3b82f6', type: 'LEAD', order: 0 },
      { name: 'Contacted', color: '#8b5cf6', type: 'IN_PROGRESS', order: 1 },
      { name: 'Qualified', color: '#ec4899', type: 'IN_PROGRESS', order: 2 },
      { name: 'Proposal Sent', color: '#f59e0b', type: 'IN_PROGRESS', order: 3 },
      { name: 'Negotiating', color: '#14b8a6', type: 'IN_PROGRESS', order: 4 },
      { name: 'Closed Won', color: '#10b981', type: 'WON', order: 5 },
      { name: 'Closed Lost', color: '#ef4444', type: 'LOST', order: 6 },
    ],
  },

  SUPPORT: {
    name: 'Customer Support',
    description: 'Manage support tickets and customer issues',
    color: '#f59e0b',
    icon: '🎧',
    stages: [
      { name: 'New Ticket', color: '#3b82f6', type: 'LEAD', order: 0 },
      { name: 'In Progress', color: '#f59e0b', type: 'IN_PROGRESS', order: 1 },
      { name: 'Waiting on Customer', color: '#8b5cf6', type: 'IN_PROGRESS', order: 2 },
      { name: 'Resolved', color: '#10b981', type: 'WON', order: 3 },
      { name: 'Closed', color: '#64748b', type: 'ARCHIVED', order: 4 },
    ],
  },

  ONBOARDING: {
    name: 'Customer Onboarding',
    description: 'Guide new customers through onboarding',
    color: '#10b981',
    icon: '🚀',
    stages: [
      { name: 'New Customer', color: '#3b82f6', type: 'LEAD', order: 0 },
      { name: 'Setup Scheduled', color: '#8b5cf6', type: 'IN_PROGRESS', order: 1 },
      { name: 'In Setup', color: '#f59e0b', type: 'IN_PROGRESS', order: 2 },
      { name: 'Training', color: '#ec4899', type: 'IN_PROGRESS', order: 3 },
      { name: 'Active', color: '#10b981', type: 'WON', order: 4 },
      { name: 'Churned', color: '#ef4444', type: 'LOST', order: 5 },
    ],
  },
};

