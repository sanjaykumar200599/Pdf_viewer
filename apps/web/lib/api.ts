import { ApiResponse, InvoiceDoc, ExtractRequest, ExtractResponse, SearchParams } from '@repo/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // File operations
  async uploadFile(file: File): Promise<ApiResponse<{ fileId: string; fileName: string; size: number }>> {
    const formData = new FormData();
    formData.append('pdf', file);

    const response = await fetch(`${this.baseURL}/api/files/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Upload failed');
    }

    return await response.json();
  }

  getFileURL(fileId: string): string {
    return `${this.baseURL}/api/files/${fileId}`;
  }

  async deleteFile(fileId: string): Promise<ApiResponse> {
    return this.request(`/api/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  // Invoice operations
  async getInvoices(params?: SearchParams): Promise<ApiResponse<{
    invoices: InvoiceDoc[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>> {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.append('q', params.q);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    return this.request(`/api/invoices${queryString ? `?${queryString}` : ''}`);
  }

  async getInvoice(id: string): Promise<ApiResponse<InvoiceDoc>> {
    return this.request(`/api/invoices/${id}`);
  }

  async createInvoice(invoice: Omit<InvoiceDoc, '_id'>): Promise<ApiResponse<InvoiceDoc>> {
    return this.request('/api/invoices', {
      method: 'POST',
      body: JSON.stringify(invoice),
    });
  }

  async updateInvoice(id: string, invoice: Partial<InvoiceDoc>): Promise<ApiResponse<InvoiceDoc>> {
    return this.request(`/api/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(invoice),
    });
  }

  async deleteInvoice(id: string): Promise<ApiResponse> {
    return this.request(`/api/invoices/${id}`, {
      method: 'DELETE',
    });
  }

  async extractInvoiceData(request: ExtractRequest): Promise<ExtractResponse> {
    return this.request('/api/invoices/extract', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);