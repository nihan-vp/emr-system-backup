import express from 'express';
import { generatePdfFromHtml } from '../controllers/pdfController.js';

const router = express.Router();

router.post('/html-to-pdf', generatePdfFromHtml);

export default router;
