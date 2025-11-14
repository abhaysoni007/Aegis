import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Document from '../models/Document';

const router = express.Router();

// GET /api/documents - Get all documents
router.get('/', async (req: Request, res: Response) => {
  try {
    const documents = await Document.find().sort({ updatedAt: -1 });
    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// GET /api/documents/:docId - Get a specific document
router.get('/:docId', async (req: Request, res: Response) => {
  try {
    const { docId } = req.params;
    const document = await Document.findOne({ docId });
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// POST /api/documents - Create a new document
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, parentId, path = [] } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Document name is required' });
    }
    
    const docId = uuidv4();
    const document = new Document({
      docId,
      name,
      path,
      content: '',
      metadata: { parentId },
    });
    
    await document.save();
    res.status(201).json(document);
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

// PUT /api/documents/:docId - Update document metadata
router.put('/:docId', async (req: Request, res: Response) => {
  try {
    const { docId } = req.params;
    const { name, path, content } = req.body;
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (path !== undefined) updateData.path = path;
    if (content !== undefined) updateData.content = content;
    
    const document = await Document.findOneAndUpdate(
      { docId },
      { $set: updateData },
      { new: true }
    );
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json(document);
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// DELETE /api/documents/:docId - Delete a document
router.delete('/:docId', async (req: Request, res: Response) => {
  try {
    const { docId } = req.params;
    const document = await Document.findOneAndDelete({ docId });
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json({ message: 'Document deleted successfully', docId });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
