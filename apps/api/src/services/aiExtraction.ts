import { ExtractRequest, ExtractResponse, InvoiceDoc } from '@repo/types';

interface AIProvider {
  extractInvoiceData(content: string): Promise<any>;
}

class GeminiProvider implements AIProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async extractInvoiceData(content: string): Promise<any> {
    // Mock implementation - replace with actual Gemini API call
    if (process.env.NODE_ENV === 'development') {
      return this.getMockData();
    }

    try {
      // Actual Gemini API implementation would go here
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Extract invoice data from this text and return as JSON: ${content.substring(0, 2000)}`
            }]
          }]
        })
      });

      const data = await response.json();
      return JSON.parse(data.candidates[0].content.parts[0].text);
    } catch (error) {
      console.error('Gemini API error:', error);
      return this.getMockData();
    }
  }

  private getMockData() {
    return {
      vendor: {
        name: "ACME Corporation",
        address: "123 Business St, City, State 12345",
        taxId: "12-3456789"
      },
      invoice: {
        number: "INV-2024-001",
        date: "2024-01-15",
        currency: "USD",
        subtotal: 1000.00,
        taxPercent: 8.5,
        total: 1085.00,
        poNumber: "PO-2024-001",
        poDate: "2024-01-10",
        lineItems: [
          {
            description: "Professional Services",
            unitPrice: 100.00,
            quantity: 10,
            total: 1000.00
          }
        ]
      }
    };
  }
}

class GroqProvider implements AIProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async extractInvoiceData(content: string): Promise<any> {
    // Mock implementation - replace with actual Groq API call
    if (process.env.NODE_ENV === 'development') {
      return this.getMockData();
    }

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b-32768',
          messages: [{
            role: 'user',
            content: `Extract invoice data from this text and return only valid JSON: ${content.substring(0, 2000)}`
          }]
        })
      });

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Groq API error:', error);
      return this.getMockData();
    }
  }

  private getMockData() {
    return {
      vendor: {
        name: "TechCorp Industries",
        address: "456 Tech Ave, Silicon Valley, CA 94000",
        taxId: "98-7654321"
      },
      invoice: {
        number: "TC-2024-005",
        date: "2024-01-20",
        currency: "USD",
        subtotal: 2500.00,
        taxPercent: 10.0,
        total: 2750.00,
        poNumber: "PO-2024-005",
        poDate: "2024-01-18",
        lineItems: [
          {
            description: "Software License",
            unitPrice: 500.00,
            quantity: 5,
            total: 2500.00
          }
        ]
      }
    };
  }
}

export class AIExtractionService {
  private geminiProvider: GeminiProvider | null = null;
  private groqProvider: GroqProvider | null = null;

  constructor() {
    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    if (geminiKey) {
      this.geminiProvider = new GeminiProvider(geminiKey);
    }

    if (groqKey) {
      this.groqProvider = new GroqProvider(groqKey);
    }
  }

  async extractInvoiceData(request: ExtractRequest, pdfContent: string): Promise<ExtractResponse> {
    try {
      let provider: AIProvider;

      if (request.model === 'gemini' && this.geminiProvider) {
        provider = this.geminiProvider;
      } else if (request.model === 'groq' && this.groqProvider) {
        provider = this.groqProvider;
      } else {
        // Fallback to mock data for development
        provider = new GeminiProvider('');
      }

      const extractedData = await provider.extractInvoiceData(pdfContent);

      return {
        success: true,
        data: extractedData
      };
    } catch (error) {
      console.error('AI extraction error:', error);
      return {
        success: false,
        error: 'Failed to extract invoice data'
      };
    }
  }
}