/**
 * BRINDES 2026 - API PARA GITHUB PAGES
 * Publicar como Aplicativo da Web:
 * Executar como: Eu
 * Quem tem acesso: Qualquer pessoa
 */

var SHEET_NAME = "Escolhas RH";
var RH_PIN = "2026";

var EMPLOYEE_EMAILS = {
  "ANDREI PISCIONERI": "piscioneriandrei@gmail.com"
};

var ALLOWED = {
  "PABLO HESPANHOL PEDRO": {band:"Até 6 meses",gifts:["Caixa de chocolates Lacta"]},
  "ANDREI PISCIONERI": {band:"7 meses a 1 ano",gifts:["Garrafa térmica","Fone de ouvido","Copo térmico"]},
  "ANDRESSA CAROLINE ARMILIATO": {band:"7 meses a 1 ano",gifts:["Garrafa térmica","Fone de ouvido","Copo térmico"]},
  "JOSE MEDEIROS DE OLIVEIRA": {band:"7 meses a 1 ano",gifts:["Garrafa térmica","Fone de ouvido","Copo térmico"]},
  "LUCIANE MENDES GONÇALVES": {band:"7 meses a 1 ano",gifts:["Garrafa térmica","Fone de ouvido","Copo térmico"]},
  "PATRICIA NUNES DE BORBA": {band:"7 meses a 1 ano",gifts:["Garrafa térmica","Fone de ouvido","Copo térmico"]},
  "SABRINA MACHADO SANTOS": {band:"7 meses a 1 ano",gifts:["Garrafa térmica","Fone de ouvido","Copo térmico"]},
  "VANESSA PACHECO VENANCIO": {band:"7 meses a 1 ano",gifts:["Garrafa térmica","Fone de ouvido","Copo térmico"]},
  "VILSO LUIS OLIVEIRA DE NOVAIS": {band:"7 meses a 1 ano",gifts:["Garrafa térmica","Fone de ouvido","Copo térmico"]},
  "MAYARA FERNANDA MATTOS": {band:"2 a 5 anos",gifts:["Secador de cabelo","Cadeira + bolsa térmica","Barbeador elétrico"]},
  "KATIA CAROLINA DE OLIVEIRA OURIQUES": {band:"6 a 10 anos",gifts:["Carrinho + bolsa térmica","Lavadora de alta pressão","Cadeira + bolsa térmica"]},
  "KELEN CRISTINA UBIALI DALMAS": {band:"6 a 10 anos",gifts:["Carrinho + bolsa térmica","Lavadora de alta pressão","Cadeira + bolsa térmica"]},
  "TANIA ELISA HEIDRICH": {band:"6 a 10 anos",gifts:["Carrinho + bolsa térmica","Lavadora de alta pressão","Cadeira + bolsa térmica"]},
  "DAIANE BILK REIBERG": {band:"11 a 15 anos",gifts:["Cafeteira espresso","Caixa de som","Kit de ferramentas"]},
  "LIDIANE MAYER": {band:"11 a 15 anos",gifts:["Cafeteira espresso","Caixa de som","Kit de ferramentas"]},
  "ALEXSANDRO CARDOSO DOS SANTOS": {band:"Acima de 15 anos",gifts:["Bicicleta aro 29","Robô aspirador","Gazebo"]},
  "FREDERICO CARDOSO DOS SANTOS": {band:"Acima de 15 anos",gifts:["Bicicleta aro 29","Robô aspirador","Gazebo"]},
  "JOSE ALCIONE BAYER": {band:"Acima de 15 anos",gifts:["Bicicleta aro 29","Robô aspirador","Gazebo"]},
  "MARIA ELIZABETH ANGELI SPECK": {band:"Acima de 15 anos",gifts:["Bicicleta aro 29","Robô aspirador","Gazebo"]},
  "SIRLEIA SANTIAGO": {band:"Acima de 15 anos",gifts:["Bicicleta aro 29","Robô aspirador","Gazebo"]}
};

function doGet(e) {
  var p = e && e.parameter ? e.parameter : {};
  var action = String(p.action || "ping");
  var callback = safeCallback_(p.callback || "");

  try {
    var result;

    if (action === "ping") {
      result = {ok:true, service:"Brindes 2026 API", version:"github-1.0"};
    } else if (action === "sendCode") {
      result = sendVerificationCode_(p.employee, p.email);
    } else if (action === "confirmChoice") {
      result = confirmVerifiedChoice_({
        employee:p.employee,
        band:p.band,
        p1:p.p1,
        p2:p.p2,
        p3:p.p3
      }, p.email, p.code);
    } else if (action === "report") {
      result = {ok:true, records:getReport_(p.pin)};
    } else if (action === "delete") {
      result = deleteChoice_(p.employee, p.pin);
    } else if (action === "clearAll") {
      result = clearAllChoices_(p.pin);
    } else {
      result = {ok:false,error:"Ação inválida."};
    }

    return respond_(result, callback);

  } catch (err) {
    return respond_({
      ok:false,
      error:String(err && err.message ? err.message : err)
    }, callback);
  }
}

function sendVerificationCode_(employee, email) {
  employee = String(employee || "").trim();
  email = String(email || "").trim().toLowerCase();

  if (!ALLOWED[employee]) throw new Error("Colaborador inválido.");

  var expectedEmail = String(EMPLOYEE_EMAILS[employee] || "").trim().toLowerCase();

  if (!expectedEmail) {
    throw new Error("Este colaborador ainda não possui e-mail cadastrado para validação. Procure o RH.");
  }

  if (email !== expectedEmail) {
    throw new Error("O e-mail informado não corresponde ao e-mail cadastrado para este colaborador.");
  }

  if (MailApp.getRemainingDailyQuota() <= 0) {
    throw new Error("O limite diário de envio de e-mails foi atingido.");
  }

  var cache = CacheService.getScriptCache();
  var cooldownKey = "gift_verify_cooldown_" + employee;

  if (cache.get(cooldownKey)) {
    throw new Error("Aguarde 60 segundos antes de solicitar um novo código.");
  }

  var code = String(Math.floor(100000 + Math.random() * 900000));

  cache.put(
    "gift_verify_" + employee,
    JSON.stringify({employee:employee,email:email,code:code,attempts:0}),
    600
  );

  cache.put(cooldownKey, "1", 60);

  MailApp.sendEmail(
    email,
    "Código de confirmação - Brindes Fim de Ano 2026",
    "Olá, " + employee + ".\n\n" +
    "Seu código de confirmação é: " + code + "\n\n" +
    "Este código é válido por 10 minutos.\n\n" +
    "Se você não solicitou esta confirmação, desconsidere este e-mail.\n\n" +
    "Gestão de Pessoas"
  );

  return {ok:true,maskedEmail:maskEmail_(email),expiresInMinutes:10};
}

function confirmVerifiedChoice_(payload, email, code) {
  payload = payload || {};

  var employee = String(payload.employee || "").trim();
  email = String(email || "").trim().toLowerCase();
  code = String(code || "").trim();

  var expectedEmail = String(EMPLOYEE_EMAILS[employee] || "").trim().toLowerCase();

  if (!expectedEmail) throw new Error("Este colaborador ainda não possui e-mail cadastrado para validação.");
  if (email !== expectedEmail) throw new Error("O e-mail informado não corresponde ao cadastro.");
  if (!/^\d{6}$/.test(code)) throw new Error("Digite o código de 6 dígitos.");

  var cache = CacheService.getScriptCache();
  var key = "gift_verify_" + employee;
  var raw = cache.get(key);

  if (!raw) {
    throw new Error("O código expirou ou não foi solicitado. Solicite um novo código.");
  }

  var verification = JSON.parse(raw);
  verification.attempts = Number(verification.attempts || 0) + 1;

  if (verification.attempts > 5) {
    cache.remove(key);
    throw new Error("Número máximo de tentativas excedido. Solicite um novo código.");
  }

  if (verification.email !== email || String(verification.code) !== code) {
    cache.put(key, JSON.stringify(verification), 600);
    throw new Error("Código incorreto.");
  }

  cache.remove(key);
  return saveChoice_(payload);
}

function saveChoice_(payload) {
  var employee = String(payload.employee || "").trim();
  var band = String(payload.band || "").trim();
  var p1 = String(payload.p1 || "").trim();
  var p2 = String(payload.p2 || "").trim();
  var p3 = String(payload.p3 || "").trim();

  var rule = ALLOWED[employee];

  if (!rule) throw new Error("Colaborador inválido.");
  if (band !== rule.band) throw new Error("Faixa de tempo inválida.");

  var picks = [];
  if (p1) picks.push(p1);
  if (p2) picks.push(p2);
  if (p3) picks.push(p3);

  var required = Math.min(3, rule.gifts.length);

  if (picks.length < required) {
    throw new Error("Preencha todas as prioridades disponíveis.");
  }

  var seen = {};

  for (var i = 0; i < picks.length; i++) {
    if (seen[picks[i]]) throw new Error("Não repita o mesmo brinde.");
    seen[picks[i]] = true;

    if (rule.gifts.indexOf(picks[i]) === -1) {
      throw new Error("Brinde não permitido para esta faixa: " + picks[i]);
    }
  }

  var sh = getSheet_();
  var lastRow = sh.getLastRow();
  var targetRow = lastRow + 1;

  if (lastRow >= 2) {
    var names = sh.getRange(2,1,lastRow-1,1).getDisplayValues();

    for (var r = 0; r < names.length; r++) {
      if (String(names[r][0]).trim() === employee) {
        targetRow = r + 2;
        break;
      }
    }
  }

  sh.getRange(targetRow,1,1,6).setValues([[
    employee,band,p1,p2,p3,new Date()
  ]]);

  sh.getRange(targetRow,6).setNumberFormat("dd/MM/yyyy HH:mm:ss");
  SpreadsheetApp.flush();

  return {ok:true,employee:employee,message:"Escolha salva com sucesso."};
}

function getReport_(pin) {
  if (String(pin || "") !== RH_PIN) throw new Error("PIN do RH inválido.");

  var sh = getSheet_();
  var lastRow = sh.getLastRow();

  if (lastRow < 2) return [];

  var values = sh.getRange(2,1,lastRow-1,6).getDisplayValues();
  var records = [];

  for (var i = 0; i < values.length; i++) {
    var r = values[i];
    if (!r[0]) continue;

    records.push({
      employee:r[0],band:r[1],p1:r[2],p2:r[3],p3:r[4],at:r[5]
    });
  }

  return records;
}

function deleteChoice_(employee, pin) {
  if (String(pin || "") !== RH_PIN) throw new Error("PIN do RH inválido.");

  employee = String(employee || "").trim();

  var sh = getSheet_();
  var lastRow = sh.getLastRow();

  if (lastRow < 2) return {ok:true,message:"Nenhum registro para excluir."};

  var names = sh.getRange(2,1,lastRow-1,1).getDisplayValues();

  for (var i = 0; i < names.length; i++) {
    if (String(names[i][0]).trim() === employee) {
      sh.deleteRow(i + 2);
      SpreadsheetApp.flush();
      return {ok:true,message:"Registro excluído.",employee:employee};
    }
  }

  return {ok:true,message:"Registro não encontrado.",employee:employee};
}

function clearAllChoices_(pin) {
  if (String(pin || "") !== RH_PIN) throw new Error("PIN do RH inválido.");

  var sh = getSheet_();
  var lastRow = sh.getLastRow();

  if (lastRow >= 2) {
    sh.getRange(2,1,lastRow-1,6).clearContent();
    SpreadsheetApp.flush();
  }

  return {ok:true,message:"Todos os registros foram apagados."};
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (!ss) throw new Error("Este Apps Script precisa estar vinculado à planilha.");

  var sh = ss.getSheetByName(SHEET_NAME);

  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(["Colaborador","Faixa","Prioridade 1","Prioridade 2","Prioridade 3","Data/Hora"]);
    sh.getRange("A1:F1").setFontWeight("bold");
    sh.setFrozenRows(1);
  }

  return sh;
}

function maskEmail_(email) {
  var parts = String(email || "").split("@");
  if (parts.length !== 2) return email;

  var name = parts[0];
  var domain = parts[1];

  if (name.length <= 2) return name.charAt(0) + "***@" + domain;

  return name.substring(0,2) + "***" + name.charAt(name.length-1) + "@" + domain;
}

function safeCallback_(s) {
  s = String(s || "");
  return /^[A-Za-z_$][A-Za-z0-9_$.]*$/.test(s) ? s : "";
}

function respond_(obj, callback) {
  var text = JSON.stringify(obj);

  if (callback) {
    return ContentService
      .createTextOutput(callback + "(" + text + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(text)
    .setMimeType(ContentService.MimeType.JSON);
}

/* Execute uma vez manualmente para autorizar envio de e-mails */
function testarEnvioEmail() {
  MailApp.sendEmail(
    "piscioneriandrei@gmail.com",
    "Teste - Brindes 2026",
    "O envio de e-mails do Apps Script está autorizado."
  );
}
