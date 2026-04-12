const fs = require('fs');
const pdf = require('pdf-parse');
let dataBuffer = fs.readFileSync('../06_Documentacao/Layouts/Leiaute_de_Importacao_TXT_Unico_modulo_contabil.pdf');
pdf.PDFParse(dataBuffer).then(function(data) {
  fs.writeFileSync('pdf_out.txt', data.text);
}).catch(console.error);
