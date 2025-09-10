import { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { Database } from '../config/database';
import { InvoiceDoc, SearchParams, ExtractRequest } from '@repo/types';
import { AIExtractionService } from '../services/aiExtraction';

const router = Router();
const database = Database.getInstance();
const aiService = new AIExtractionService();

// Get all invoices with optional search
router.get('/', async (req: Request, res: Response) => {
  try {
    const { q, page = 1, limit = 10 }: SearchParams = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const db = database.getDb();
    const collection = db.collection<InvoiceDoc>('invoices');

    let query = {};
    if (q) {
      query = {
        $or: [
          { 'vendor.name': { $regex: q, $options: 'i' } },
          { 'invoice.number': { $regex: q, $options: 'i' } },
          { fileName: { $regex: q, $options: 'i' } }
        ]
      };
    }

    const [invoices, total] = await Promise.all([
      collection.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .toArray(),
      collection.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get invoice by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = database.getDb();
    const collection = db.collection<InvoiceDoc>('invoices');

    const invoice = await collection.findOne({ _id: new ObjectId(id) });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create new invoice
router.post('/', async (req: Request, res: Response) => {
  try {
    const invoiceData: Omit<InvoiceDoc, '_id'> = {
      ...req.body,
      createdAt: new Date().toISOString()
    };

    const db = database.getDb();
    const collection = db.collection<InvoiceDoc>('invoices');

    const result = await collection.insertOne(invoiceData);

    res.status(201).json({
      success: true,
      data: {
        _id: result.insertedId.toString(),
        ...invoiceData
      }
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update invoice
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    const db = database.getDb();
    const collection = db.collection<InvoiceDoc>('invoices');

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: result.value
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete invoice
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = database.getDb();
    const collection = db.collection<InvoiceDoc>('invoices');

    // Get invoice to also delete associated file
    const invoice = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // Delete from database
    await collection.deleteOne({ _id: new ObjectId(id) });

    // Delete associated PDF file
    try {
      const gridFS = database.getGridFS();
      await gridFS.delete(new ObjectId(invoice.fileId));
    } catch (fileError) {
      console.error('Error deleting associated file:', fileError);
      // Continue with invoice deletion even if file deletion fails
    }

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// AI extraction endpoint
router.post('/extract', async (req: Request, res: Response) => {
  try {
    const extractRequest: ExtractRequest = req.body;

    if (!extractRequest.fileId || !extractRequest.model) {
      return res.status(400).json({
        success: false,
        error: 'fileId and model are required'
      });
    }

    // For demo purposes, we'll use mock PDF content
    // In production, you'd extract text from the actual PDF
    const mockPdfContent = "ACME Corporation Invoice #INV-2024-001 Date: 2024-01-15 Total: $1,085.00";

    const result = await aiService.extractInvoiceData(extractRequest, mockPdfContent);

    res.json(result);
  } catch (error) {
    console.error('AI extraction error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;