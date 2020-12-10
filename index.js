process.title = 'LUM | Pagamento por cartão de crédito';
let args = process.argv,
port = args[2] || 7070,
webServer = require('./server');

webServer.listen(port, function() {
    console.log(`Servidor rodando na porta ${port}`);
})