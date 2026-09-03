import apiClient from './client';

export interface TicketPayload {
  message: string;
  category: string;
  supportType: 'Ticket' | 'Chat' | 'Call';
  bookingId?: string;
  image?: string;
  priority?: 'Low' | 'Medium' | 'High';
}

export interface Ticket {
  _id: string;
  raisedBy: string;
  raisedByModel: 'Employee' | 'ToolShop' | 'User';
  message: string;
  category: string;
  supportType: 'Ticket' | 'Chat' | 'Call';
  bookingId?: string;
  image?: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In progress' | 'Resolved' | 'Closed';
  adminReply?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  _id: string;
  ticket: string;
  sender: string;
  senderModel: 'Admin' | 'Employee' | 'ToolShop' | 'User';
  message: string;
  type: 'text' | 'image';
  createdAt: string;
}

export const TicketAPI = {
  /**
   * Create a new support ticket or request.
   */
  createTicket: async (payload: TicketPayload) => {
    const res = await apiClient.post<{ success: boolean; ticket: Ticket }>('/tickets/', payload);
    return res.data;
  },

  /**
   * Get all tickets raised by the current authenticated user/provider.
   */
  getMyTickets: async () => {
    const res = await apiClient.get<{ success: boolean; tickets: Ticket[] }>('/tickets/my-tickets');
    return res.data;
  },

  /**
   * Get a specific ticket by ID, including message history for Chat type.
   */
  getTicketById: async (id: string) => {
    const res = await apiClient.get<{
      success: boolean;
      ticket: Ticket;
      messages: TicketMessage[];
    }>(`/tickets/${id}`);
    return res.data;
  },

  /**
   * Get messages for a specific ticket.
   */
  getChatMessages: async (ticketId: string) => {
    const res = await apiClient.get<{ success: boolean; messages: TicketMessage[] }>(
      `/tickets/${ticketId}/messages`
    );
    return res.data;
  },

  /**
   * Send a message in a ticket chat.
   */
  sendChatMessage: async (ticketId: string, message: string, type: 'text' | 'image' = 'text') => {
    const res = await apiClient.post<{ success: boolean; message: TicketMessage }>(
      `/tickets/${ticketId}/messages`,
      { message, type }
    );
    return res.data;
  },
};
