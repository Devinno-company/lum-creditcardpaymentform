function parameters() {
  let url = window.location.href;
  let paramString = new RegExp('(.*)[?](.*)').exec(url);
  if (null == paramString) {
    return { 'base': url, 'params': null };
  }

  if (paramString[2].includes("&amp;")) {
    var paramList = paramString[2].split("&amp;");
  } else {
    var paramList = paramString[2].split("&");
  }

  let params = [];

  for (let i = 0; i < paramList.length; i++) {
    let values = paramList[i].split("=");
    params[values[0]] = values[1];
  }

  return { "base": paramString[1], "params": params };
}
const params = parameters().params;

window.onload = () => {

  const http = new XMLHttpRequest();

  http.onload = () => {
    // parse JSON
    if (http.status >= 200 && http.status < 300) {
      sendPurchase = JSON.parse(http.response).purchase;

      const $form = document.getElementById('paymentForm');
      $form.email.value = sendPurchase.email;
      $form.docType.value = 'CPF';
      $form.docNumber.value = sendPurchase.cpf_payer;
      $form.installments.value = 1;
      $form.issuer.value = '';
      console.log('email',$form.email.value)
      console.log('cpf',$form.docNumber.value)
    }
  };

  const url = `http://localhost:7070/currentPurchases?token=${params['token']}`;
  http.open('GET', url);
  http.setRequestHeader('Content-Type', 'application/json');
  http.setRequestHeader('x-access-token', `Bearer ${params['token']}`)
  http.send();
}


window.Mercadopago.setPublishableKey("TEST-7171486a-3c37-4425-877a-e70cc0769d6e");
window.Mercadopago.getIdentificationTypes();

doSubmit = false;
document.getElementById('cardNumber').addEventListener('change', guessPaymentMethod);
document.getElementById('paymentForm').addEventListener('submit', getCardToken);
guessPaymentMethod();
const httpToLum = new XMLHttpRequest();

httpToLum.onload = () => {
  console.log(httpToLum.response);
  // print JSON response
  if (httpToLum.status >= 200 && httpToLum.status < 300) {
    // parse JSON
    console.log(httpToLum.response);
  }
};

function guessPaymentMethod(event) {
  let cardnumber = document.getElementById("cardNumber").value;
  if (cardnumber.length >= 6) {
    let bin = cardnumber.substring(0, 6);
    window.Mercadopago.getPaymentMethod({
      "bin": bin
    }, setPaymentMethod);
  }
};

function setPaymentMethod(status, response) {
  if (status == 200) {
    let paymentMethod = response[0];
    document.getElementById('paymentMethodId').value = paymentMethod.id;

    if (paymentMethod.additional_info_needed.includes("issuer_id")) {
      getIssuers(paymentMethod.id);
    } else {
      getInstallments(
        paymentMethod.id,
        document.getElementById('transactionAmount').value
      );
    }
  } else {
    alert(`payment method info error: ${response}`);
  }
}

function getIssuers(paymentMethodId) {
  window.Mercadopago.getIssuers(
    paymentMethodId,
    setIssuers
  );
}

function getCardToken(event) {
  event.preventDefault();
  if (!doSubmit) {
    let $form = document.getElementById('paymentForm');
    window.Mercadopago.createToken($form, setCardTokenAndPay);
    return false;
  }
};

function setIssuers(status, response) {
  if (status == 200) {
    let issuerSelect = document.getElementById('issuer');
    response.forEach(issuer => {
      let opt = document.createElement('option');
      opt.text = issuer.name;
      opt.value = issuer.id;
      issuerSelect.appendChild(opt);
    });

    getInstallments(
      document.getElementById('paymentMethodId').value,
      document.getElementById('transactionAmount').value,
      issuerSelect.value
    );
  } else {
    alert(`issuers method info error: ${response}`);
  }
}

function getInstallments(paymentMethodId, transactionAmount, issuerId) {
  window.Mercadopago.getInstallments({
    "payment_method_id": paymentMethodId,
    "amount": parseFloat(transactionAmount),
    "issuer_id": issuerId ? parseInt(issuerId) : undefined
  }, setInstallments);
}

function setInstallments(status, response) {
  if (status == 200) {
    document.getElementById('installments').options.length = 0;
    response[0].payer_costs.forEach(payerCost => {
      let opt = document.createElement('option');
      opt.text = payerCost.recommended_message;
      opt.value = payerCost.installments;
      document.getElementById('installments').appendChild(opt);
    });
  } else {
    alert(`installments method info error: ${response}`);
  }
}

function setCardTokenAndPay(status, response) {
  if (status == 200 || status == 201) {
    console.log('passou');
    let form = document.getElementById('paymentForm');
    let card = document.createElement('input');
    card.setAttribute('name', 'token');
    card.setAttribute('type', 'hidden');
    card.setAttribute('value', response.id);
    form.appendChild(card);
    console.log(form.cardExpirationMonth.value)
    console.log()

    const url = 'https://lum-rest.herokuapp.com/purchases';
    sendPurchase.credit_card = {
      token: card.value,
      payment_method_id: form.paymentMethodId.value,
      installments: 1,
      issuer: (form.issuer.value === "") ? undefined : form.issuer.value,
    }

    httpToLum.open('POST', url);
    httpToLum.setRequestHeader('Content-Type', 'application/json');
    httpToLum.setRequestHeader('x-access-token', `Bearer ${params['token']}`)
    httpToLum.setRequestHeader('Access-Control-Allow-Origin', 'http://localhost:7070')
    console.log(sendPurchase);
    httpToLum.send(JSON.stringify(sendPurchase));
  } else {
    alert("Verify filled data!\n" + JSON.stringify(response, null, 4));
  }
};