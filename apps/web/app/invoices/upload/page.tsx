'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api';
import { Upload, FileText, CheckCircle } from 'lucide-react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        alert('Please select a PDF file');
        return;
      }
      if (selectedFile.size > 25 * 1024 * 1024) {
        alert('File size must be less than 25MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress('Uploading PDF...');

      const uploadResponse = await apiClient.uploadFile(file);
      
      if (!uploadResponse.success || !uploadResponse.data) {
        throw new Error('Upload failed');
      }

      setUploadProgress('Creating invoice record...');

      // Create initial invoice record
      const invoiceData = {
        fileId: uploadResponse.data.fileId,
        fileName: uploadResponse.data.fileName,
        vendor: {
          name: 'Unknown Vendor',
        },
        invoice: {
          number: '',
          date: new Date().toISOString().split('T')[0],
          lineItems: [],
        },
        createdAt: new Date().toISOString(),
      };

      const invoiceResponse = await apiClient.createInvoice(invoiceData);

      if (!invoiceResponse.success || !invoiceResponse.data) {
        throw new Error('Failed to create invoice record');
      }

      setUploadProgress('Complete!');

      // Redirect to the invoice detail page
      router.push(`/invoices/${invoiceResponse.data._id}`);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
      setUploadProgress('');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.type !== 'application/pdf') {
        alert('Please select a PDF file');
        return;
      }
      if (droppedFile.size > 25 * 1024 * 1024) {
        alert('File size must be less than 25MB');
        return;
      }
      setFile(droppedFile);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Upload Invoice</h1>
          <p className="text-gray-600">
            Upload a PDF invoice to get started with AI-powered data extraction
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select PDF File</CardTitle>
            <CardDescription>
              Choose a PDF invoice file (max 25MB) to upload and process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                file 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="space-y-4">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                  <div>
                    <p className="font-semibold text-green-800">{file.name}</p>
                    <p className="text-sm text-green-600">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-lg font-semibold text-gray-700">
                      Drag and drop your PDF here
                    </p>
                    <p className="text-gray-500">or click to browse files</p>
                  </div>
                </div>
              )}
              
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            {uploadProgress && (
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-blue-800">{uploadProgress}</p>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                onClick={() => router.push('/invoices')}
                variant="outline"
                className="flex-1"
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                Upload & Process
              </Button>
            </div>

            <div className="text-sm text-gray-500 space-y-2">
              <p><strong>Supported:</strong> PDF files only</p>
              <p><strong>Max size:</strong> 25MB</p>
              <p><strong>Next steps:</strong> After upload, you can use AI to extract invoice data automatically</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}