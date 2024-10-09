const fs = require('fs');
const { default: OpenAI } = require('openai');
const PDFParser = require('pdf-parse');

class PdfController {
    constructor() {
        this.processPdf = this.processPdf.bind(this);
        this.openai = new OpenAI({
            apiKey:process.env.API_KEY_CHAT_GPT
        });
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
            const { text } = await PDFParser(pdfBuffer);

            const result = await this.readerChatGPT(text);

            await fs.promises.unlink(pdfPath); 

            return res.status(200).json(result); 
        } catch (error) {
            console.error('Error processing PDF:', error);
            return res.status(500).json({ error: 'An error occurred during processing' });
        }
    }

    async readerChatGPT(text) {
        const responseData = [];


        const stream = await this.openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: `
                Me retorne somente os dados
                da nota ${text}, quero somente o resultado nesse modelo: 
                {
                Empresa: "VICUNHA TEXTIL S/A" ou "Grande Moinho}
                Destinatário:{
                "cnpj":valor do cnpj,
                "incrição estadual":valor da inscrição estadual,
                "cep":valor do cep,
                "razao_social":valor da razao social,
                "endereço":valor do endereço},
                "valor_da_nota":valor total da nota,
                "peso_bruto":valor do peso bruto,
                "chave_de_acesso":chave de acesso com todos os digitos juntos,
                "Tipo_de_Produto": se é algodão, tecido, fio, diversos,
                `
                }],
            stream: true,
        });

        for await (const part of stream) {
            if (part.choices[0]?.delta?.content) {
                responseData.push(part.choices[0].delta.content);
            }
        }

        return responseData.join('');
    }

   
}

module.exports = PdfController;
