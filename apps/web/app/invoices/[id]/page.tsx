'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PDFViewer } from '@/components/pdf-viewer';
import { apiClient } from '@/lib/api';
import { InvoiceDoc, ExtractRequest } from '@repo/types';
import { Bot, Save, Trash2, Plus, X } from 'lucide-react';

interface PageProps {
  params: { id: string };
}

export default function InvoiceDetailPage({ params }: PageProps) {
  const [invoice, setInvoice] = useState<InvoiceDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const loadInvoice = async () => {
    try {
      const response = await apiClient.getInvoice(params.id);
      if (response.success && response.data) {
        setInvoice(response.data);
      } else {
        setError('Invoice not found');
      }
    } catch (error) {
      console.error('Load invoice error:', error);
      setError('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoice();
  }, [params.id]);

  const handleSave = async () => {
    if (!invoice) return;

    try {
      setSaving(true);
      const { _id, ...updateData } = invoice;
      const response = await apiClient.updateInvoice(params.id, updateData);
      
      if (response.success) {
        alert('Invoice saved successfully');
      } else {
        alert('Failed to save invoice');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this invoice? This will also delete the PDF file.')) {
      return;
    }

    try {
      const response = await apiClient.deleteInvoice(params.id);
      if (response.success) {
        router.push('/invoices');
      } else {
        alert('Failed to delete invoice');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete invoice');
    }
  };

  const handleExtractWithAI = async (model: 'gemini' | 'groq') => {
    if (!invoice) return;

    try {
      setExtracting(true);
      const extractRequest: ExtractRequest = {
        fileId: invoice.fileId,
        model,
      };

      const response = await apiClient.extractInvoiceData(extractRequest);
      
      if (response.success && response.data) {
        setInvoice(prev => prev ? {
          ...prev,
          vendor: response.data.vendor,
          invoice: response.data.invoice,
          updatedAt: new Date().toISOString(),
        } : null);
        alert('AI extraction completed successfully!');
      } else {
        alert('AI extraction failed: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('AI extraction error:', error);
      alert('AI extraction failed');
    } finally {
      setExtracting(false);
    }
  };

  const addLineItem = () => {
    if (!invoice) return;
    
    setInvoice(prev => prev ? {
      ...prev,
      invoice: {
        ...prev.invoice,
        lineItems: [
          ...prev.invoice.lineItems,
          { description: '', unitPrice: 0, quantity: 1, total: 0 }
        ]
      }
    } : null);
  };

  const removeLineItem = (index: number) => {
    if (!invoice) return;
    
    setInvoice(prev => prev ? {
      ...prev,
      invoice: {
        ...prev.invoice,
        lineItems: prev.invoice.lineItems.filter((_, i) => i !== index)
      }
    } : null);
  };

  const updateLineItem = (index: number, field: string, value: string | number) => {
    if (!invoice) return;
    
    setInvoice(prev => {
      if (!prev) return null;
      
      const lineItems = [...prev.invoice.lineItems];
      const item = { ...lineItems[index], [field]: value };
      
      // Recalculate total if quantity or unitPrice changed
      if (field === 'quantity' || field === 'unitPrice') {
        item.total = Number(item.unitPrice) * Number(item.quantity);
      }
      
      lineItems[index] = item;
      
      return {
        ...prev,
        invoice: {
          ...prev.invoice,
          lineItems
        }
      };
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-red-600 mb-4">{error || 'Invoice not found'}</p>
            <Button onClick={() => router.push('/invoices')}>
              Back to Invoices
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fileUrl = apiClient.getFileURL(invoice.fileId);

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{invoice.vendor.name}</h1>
            <p className="text-gray-600">Invoice #{invoice.invoice.number || 'N/A'}</p>
          </div>
          <div className="flex gap-2">
            <Select onValueChange={(model) => handleExtractWithAI(model as 'gemini' | 'groq')}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Extract with AI" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">
                  <Bot className="h-4 w-4 mr-2 inline" />
                  Gemini
                </SelectItem>
                <SelectItem value="groq">
                  <Bot className="h-4 w-4 mr-2 inline" />
                  Groq
                </SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* PDF Viewer */}
        <div className="w-1/2 border-r">
          <PDFViewer fileUrl={fileUrl} fileName={invoice.fileName} />
        </div>

        {/* Invoice Form */}
        <div className="w-1/2 overflow-y-auto">
          <div className="p-6 space-y-6">
            {extracting && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-blue-800">Extracting data with AI...</span>
                </CardContent>
              </Card>
            )}

            {/* Vendor Information */}
            <Card>
              <CardHeader>
                <CardTitle>Vendor Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="vendor-name">Vendor Name</Label>
                  <Input
                    id="vendor-name"
                    value={invoice.vendor.name}
                    onChange={(e) => setInvoice(prev => prev ? {
                      ...prev,
                      vendor: { ...prev.vendor, name: e.target.value }
                    } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="vendor-address">Address</Label>
                  <Textarea
                    id="vendor-address"
                    value={invoice.vendor.address || ''}
                    onChange={(e) => setInvoice(prev => prev ? {
                      ...prev,
                      vendor: { ...prev.vendor, address: e.target.value }
                    } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="vendor-taxid">Tax ID</Label>
                  <Input
                    id="vendor-taxid"
                    value={invoice.vendor.taxId || ''}
                    onChange={(e) => setInvoice(prev => prev ? {
                      ...prev,
                      vendor: { ...prev.vendor, taxId: e.target.value }
                    } : null)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Invoice Details */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="invoice-number">Invoice Number</Label>
                    <Input
                      id="invoice-number"
                      value={invoice.invoice.number}
                      onChange={(e) => setInvoice(prev => prev ? {
                        ...prev,
                        invoice: { ...prev.invoice, number: e.target.value }
                      } : null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="invoice-date">Date</Label>
                    <Input
                      id="invoice-date"
                      type="date"
                      value={invoice.invoice.date}
                      onChange={(e) => setInvoice(prev => prev ? {
                        ...prev,
                        invoice: { ...prev.invoice, date: e.target.value }
                      } : null)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="po-number">PO Number</Label>
                    <Input
                      id="po-number"
                      value={invoice.invoice.poNumber || ''}
                      onChange={(e) => setInvoice(prev => prev ? {
                        ...prev,
                        invoice: { ...prev.invoice, poNumber: e.target.value }
                      } : null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="po-date">PO Date</Label>
                    <Input
                      id="po-date"
                      type="date"
                      value={invoice.invoice.poDate || ''}
                      onChange={(e) => setInvoice(prev => prev ? {
                        ...prev,
                        invoice: { ...prev.invoice, poDate: e.target.value }
                      } : null)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Line Items</CardTitle>
                  <Button onClick={addLineItem} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {invoice.invoice.lineItems.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Item #{index + 1}</span>
                      <Button
                        onClick={() => removeLineItem(index)}
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>Unit Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label>Total</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.total}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {invoice.invoice.lineItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No line items yet. Add items to get started.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Totals */}
            <Card>
              <CardHeader>
                <CardTitle>Totals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="subtotal">Subtotal</Label>
                    <Input
                      id="subtotal"
                      type="number"
                      step="0.01"
                      value={invoice.invoice.subtotal || ''}
                      onChange={(e) => setInvoice(prev => prev ? {
                        ...prev,
                        invoice: { ...prev.invoice, subtotal: parseFloat(e.target.value) || 0 }
                      } : null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tax-percent">Tax %</Label>
                    <Input
                      id="tax-percent"
                      type="number"
                      step="0.01"
                      value={invoice.invoice.taxPercent || ''}
                      onChange={(e) => setInvoice(prev => prev ? {
                        ...prev,
                        invoice: { ...prev.invoice, taxPercent: parseFloat(e.target.value) || 0 }
                      } : null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="total">Total</Label>
                    <Input
                      id="total"
                      type="number"
                      step="0.01"
                      value={invoice.invoice.total || ''}
                      onChange={(e) => setInvoice(prev => prev ? {
                        ...prev,
                        invoice: { ...prev.invoice, total: parseFloat(e.target.value) || 0 }
                      } : null)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={invoice.invoice.currency || 'USD'}
                      onValueChange={(value) => setInvoice(prev => prev ? {
                        ...prev,
                        invoice: { ...prev.invoice, currency: value }
                      } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                        <SelectItem value="JPY">JPY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}