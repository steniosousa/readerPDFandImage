const router = require('express').Router();
const multer = require('multer');
const TesseractController = require('../adapters/controllers/tesseractController');
const PdfController = require('../readerPdf/readerPDF2Text');

const upload = multer({ dest: 'uploads/' });
const tesseractController = new TesseractController();
const pdfController = new PdfController(); 

router.post('/processar-imagem', upload.single('imagem'), tesseractController.processarImagem);
router.post('/ler-pdf', upload.single('pdf'), async (req, res) => {
  await pdfController.processPdf(req, res); 
});

module.exports = router;
