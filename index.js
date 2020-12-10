process.title = 'LUM | Pagamento por cartão de crédito';

port = process.env.PORT || 7070,
webServer = require('./server');

webServer.listen(port, function() {
    console.log(`Servidor rodando na porta ${port}`);
})
