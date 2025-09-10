import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Bot, Search, FileText } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Invoice Manager
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            AI-powered invoice processing and management system. Upload, extract, and manage your invoices with ease.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Upload className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Upload PDFs</CardTitle>
              <CardDescription>
                Securely upload PDF invoices up to 25MB
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Bot className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>AI Extraction</CardTitle>
              <CardDescription>
                Extract invoice data using Gemini or Groq AI
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <FileText className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Edit & Manage</CardTitle>
              <CardDescription>
                View, edit, and manage your invoice data
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Search className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <CardTitle>Search & Filter</CardTitle>
              <CardDescription>
                Find invoices quickly with powerful search
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center space-x-4">
          <Link href="/invoices">
            <Button size="lg" className="px-8">
              Get Started
            </Button>
          </Link>
          <Link href="/invoices/upload">
            <Button variant="outline" size="lg" className="px-8">
              Upload Invoice
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}