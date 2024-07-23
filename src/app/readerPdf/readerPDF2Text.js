const fs = require('fs');
const PDFParser = require('pdf-parse');

class PdfController {
    constructor() {
        this.processPdf = this.processPdf.bind(this);
    }

    async processPdf(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No file provided' });
            }

            const { path: pdfPath, mimetype: pdfType } = req.file;

            if (pdfType !== 'application/pdf') {
                return res.status(400).json({ message: 'File provided is not a PDF' });
            }

            const pdfBuffer = fs.readFileSync(pdfPath);

            const pdfText = await this.readPdfText(pdfBuffer);

            await fs.promises.unlink(pdfPath);

            return res.status(200).json(pdfText);
        } catch (error) {
            console.error('Error processing PDF:', error);
            return res.status(500).json({ error: 'An error occurred during processing' });
        }
    }

    async readPdfText(pdfBuffer) {
        try {
            const obj = {};
            const data = await PDFParser(pdfBuffer);
            const usuario = /DESTINATÁRIO:(.*?) - /s;
            const matchUsuario = data.text.match(usuario);

            const valorNota = /VALORTOTAL:(.*?) DESTINATÁRIO:/s;
            const matchValorNota = data.text.match(valorNota)


            const pesoBruto = /PESO BRUTO\n(.*?)\n/;
            const matchPesoBruto = data.text.match(pesoBruto)


            const tipo = /ESPÉCIE(.*?)MARCA/s
            const matchTipo = data.text.match(tipo)

            const localização = new RegExp(`${matchUsuario[1].trim()}(.*?)NF-e`,"s")
            const matchLocalização = data.text.match(localização)

            const cpfCnpj = new RegExp(`${matchUsuario[1].trim()}\nCNPJ / CPF(.*?)DATA DA EMISSÃO\n`, "s")
            const matchCnpj = data.text.match(cpfCnpj)
            const incrição = /INSCRIÇÃO ESTADUAL\n([0-9]+)/;
            const matchIncrição = data.text.match(incrição)
            if (matchUsuario) {
                const destinatario = matchUsuario[1].trim();
                obj["Destinatário"] = destinatario
            }

            if (matchValorNota) {
                const valorNota = matchValorNota[1].trim()
                obj["Valor da nota"] = valorNota
            }

            if (matchPesoBruto) {
                const PesoBruto = matchPesoBruto[1].trim()

                obj["Peso bruto"] = PesoBruto
            }

            if (matchTipo) {
                const tipo = matchTipo[1].trim()

                obj["tipo"] = tipo
            }

            if (matchLocalização) {
                const localização = matchLocalização[1].trim()

                obj["localização"] = localização
            }

            if (matchCnpj) {
                const cnpj = matchCnpj[1].trim()
                obj["cnpj*"] = cnpj
            }

            if (matchIncrição) {
                const incriçãoEstadual = matchIncrição[1].trim()
                obj["Incrição estadual*"] = incriçãoEstadual
            }

            return obj


        } catch (error) {
            console.error('Error reading PDF:', error);
            throw error;
        }
    }
}

module.exports = PdfController;
