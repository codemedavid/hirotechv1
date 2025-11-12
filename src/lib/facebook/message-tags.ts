export interface MessageTagInfo {
  value: string;
  label: string;
  description: string;
  useCases: string[];
  restrictions: string[];
  icon: string;
}

export const MESSAGE_TAGS: Record<string, MessageTagInfo> = {
  CONFIRMED_EVENT_UPDATE: {
    value: 'CONFIRMED_EVENT_UPDATE',
    label: 'Event Update',
    description: 'Send event reminders, updates, or cancellations',
    useCases: [
      'Event reminders',
      'Event updates or changes',
      'Event cancellations',
      'Appointment confirmations',
    ],
    restrictions: [
      'Must be for a confirmed event',
      'Event must be scheduled in the future',
      'Cannot be used for promotional content',
    ],
    icon: '📅',
  },
  POST_PURCHASE_UPDATE: {
    value: 'POST_PURCHASE_UPDATE',
    label: 'Purchase Update',
    description: 'Send order and shipping notifications',
    useCases: [
      'Order confirmations',
      'Shipping notifications',
      'Delivery updates',
      'Digital receipts',
    ],
    restrictions: [
      'Must be related to a confirmed purchase',
      'Cannot be used for marketing or promotions',
      'Only for transactional updates',
    ],
    icon: '📦',
  },
  ACCOUNT_UPDATE: {
    value: 'ACCOUNT_UPDATE',
    label: 'Account Update',
    description: 'Send account-related notifications',
    useCases: [
      'Account setting changes',
      'Password resets',
      'Payment issues',
      'Security alerts',
      'Billing reminders',
    ],
    restrictions: [
      "Must be about user's account",
      'Cannot be used for promotional content',
      'Only for important account notifications',
    ],
    icon: '🔐',
  },
  HUMAN_AGENT: {
    value: 'HUMAN_AGENT',
    label: 'Human Agent',
    description: 'During active customer support conversations',
    useCases: [
      'Customer support conversations',
      'Live agent responses',
      'Follow-up on support tickets',
    ],
    restrictions: [
      'Must be part of an active conversation',
      'Requires human agent involvement',
      'Cannot be used for automated broadcasts',
    ],
    icon: '👤',
  },
};

export function getMessageTagInfo(tag: string): MessageTagInfo | null {
  return MESSAGE_TAGS[tag] || null;
}

export function getAllMessageTags(): MessageTagInfo[] {
  return Object.values(MESSAGE_TAGS);
}

