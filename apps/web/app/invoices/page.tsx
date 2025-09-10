'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { InvoiceDoc } from '@repo/types';
import { Search, Plus, Eye, Trash2 } from 'lucide-react';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const loadInvoices = async (page = 1, query = '') => {
    try {
      setLoading(true);
      const response = await apiClient.getInvoices({
        q: query || undefined,
        page,
        limit: 10,
      });

      if (response.success && response.data) {
        setInvoices(response.data.invoices);
        setTotalPages(response.data.pagination.pages);
        setCurrentPage(page);
      } else {
        setError('Failed to load invoices');
      }
    } catch (error) {
      console.error('Load invoices error:', error);
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadInvoices(1, searchQuery);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) {
      return;
    }

    try {
      const response = await apiClient.deleteInvoice(id);
      if (response.success) {
        await loadInvoices(currentPage, searchQuery);
      } else {
        alert('Failed to delete invoice');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete invoice');
    }
  };

  if (loading && invoices.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-2">Manage your invoice collection</p>
        </div>
        <Link href="/invoices/upload">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Upload Invoice
          </Button>
        </Link>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by vendor name, invoice number, or filename..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {invoices.map((invoice) => (
          <Card key={invoice._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{invoice.vendor.name}</CardTitle>
              <CardDescription>
                Invoice #{invoice.invoice.number}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Date:</span>
                  <span>{formatDate(invoice.invoice.date)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-semibold">
                    {invoice.invoice.total 
                      ? formatCurrency(invoice.invoice.total, invoice.invoice.currency)
                      : 'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">File:</span>
                  <span className="truncate ml-2">{invoice.fileName}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/invoices/${invoice._id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(invoice._id!)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {invoices.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">No invoices found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? 'Try adjusting your search terms.' : 'Get started by uploading your first invoice.'}
            </p>
            <Link href="/invoices/upload">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Upload Invoice
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          <Button
            variant="outline"
            onClick={() => loadInvoices(currentPage - 1, searchQuery)}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => loadInvoices(currentPage + 1, searchQuery)}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}