console.log("GMAIL CONTENT SCRIPT INJECTED");

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// Toast amigable
function showToast(msg, ms=3500) {
  let t = document.createElement("div");
  t.textContent = msg;
  t.style.position = "fixed";
  t.style.left = "50%";
  t.style.top = "70%";
  t.style.transform = "translate(-50%,0)";
  t.style.background = "#323232";
  t.style.color = "#fff";
  t.style.fontSize = "16px";
  t.style.padding = "14px 28px";
  t.style.borderRadius = "8px";
  t.style.boxShadow = "0 4px 20px #0005";
  t.style.zIndex = "99999";
  t.style.opacity = "0.96";
  document.body.appendChild(t);
  setTimeout(()=>{t.remove();}, ms);
}

// Hace clic en el botón Redactar
async function clickRedactar() {
  const redactarBtn = document.querySelector("div.T-I.T-I-KE.L3[role=button], div[role=button][gh='cm']");
  if (redactarBtn) {
    redactarBtn.click();
    return true;
  }
  return false;
}

// Espera a que aparezca el redactor de Gmail
async function esperarRedactor() {
  for (let i = 0; i < 30; i++) {
    const redactDiv = document.querySelector("div[role=region][aria-label*='Mensaje nuevo'],div[role=region][aria-label*='New Message']");
    if (redactDiv) return redactDiv;
    await sleep(200);
  }
  return null;
}

// Acorta strings largos
function acortar(txt, len=160) {
  return (txt && txt.length > len) ? txt.slice(0, len-3) + "..." : txt || "";
}

// Rellena todos los campos del correo
function rellenarCampos(redactDiv, email) {
  // DESTINATARIO
  let toInput = redactDiv.querySelector("input[aria-label*='Destinatarios'],input[aria-label*='To']");
  if (!toInput) {
    toInput = redactDiv.querySelector("div[aria-label='Para'] input") || redactDiv.querySelector("input[aria-label]");
  }
  if (toInput) {
    toInput.value = acortar(email["destinatario"], 160);
    toInput.dispatchEvent(new Event('input', { bubbles: true }));
    toInput.blur();
  }
  // CC
  if (email["cc"]) {
    let ccBtn = redactDiv.querySelector("span[aria-label*='Cc'],span[aria-label*='CC']");
    if (ccBtn) ccBtn.click();
    for (let i = 0; i < 10; i++) {
      let ccInput = redactDiv.querySelector("input[aria-label*='Cc'],input[aria-label*='CC']");
      if (ccInput) {
        ccInput.value = acortar(email["cc"], 160);
        ccInput.dispatchEvent(new Event('input', { bubbles: true }));
        ccInput.blur();
        break;
      }
    }
  }
  // CCO
  if (email["cco"]) {
    let ccoBtn = redactDiv.querySelector("span[aria-label*='Cco'],span[aria-label*='BCC']");
    if (ccoBtn) ccoBtn.click();
    for (let i = 0; i < 10; i++) {
      let ccoInput = redactDiv.querySelector("input[aria-label*='Cco'],input[aria-label*='BCC']");
      if (ccoInput) {
        ccoInput.value = acortar(email["cco"], 160);
        ccoInput.dispatchEvent(new Event('input', { bubbles: true }));
        ccoInput.blur();
        break;
      }
    }
  }
  // ASUNTO
  let subjectInput = redactDiv.querySelector("input[name='subjectbox'],input[aria-label='Asunto'],input[placeholder='Asunto']");
  if (subjectInput) {
    subjectInput.value = acortar(email["asunto"], 160);
    subjectInput.dispatchEvent(new Event('input', { bubbles: true }));
    subjectInput.blur();
  }
  // CUERPO
  let bodyDiv = redactDiv.querySelector("div[aria-label='Cuerpo del mensaje'][contenteditable='true']");
  if (bodyDiv) {
    bodyDiv.innerHTML = (email["cuerpo"] || "").replace(/\n/g, "<br>");
    bodyDiv.dispatchEvent(new Event('input', { bubbles: true }));
    bodyDiv.blur();
  }
}

// Cierra el redactor (guardar y cerrar, o ESC)
async function cerrarRedactor(redactDiv) {
  let cerrarBtn = redactDiv.querySelector("img[aria-label*='Cerrar'],img[aria-label*='Close'],img[alt*='Cerrar'],img[alt*='Close']");
  if (cerrarBtn) {
    cerrarBtn.click();
    await sleep(500);
    return true;
  }
  // Si no encuentra, intenta ESC en el redactor
  redactDiv.focus();
  let evt = new KeyboardEvent("keydown", {key:"Escape", code:"Escape", keyCode:27, which:27, bubbles:true});
  redactDiv.dispatchEvent(evt);
  await sleep(500);
  return true;
}

// Cierra TODOS los redactores abiertos
function cerrarTodosRedactores() {
  document.querySelectorAll("div[role=region][aria-label*='Mensaje nuevo'],div[role=region][aria-label*='New Message']")
    .forEach(redactDiv => {
      let cerrarBtn = redactDiv.querySelector("img[aria-label*='Cerrar'],img[alt*='Cerrar']");
      if (cerrarBtn) cerrarBtn.click();
      else {
        redactDiv.focus();
        let evt = new KeyboardEvent("keydown", {key:"Escape", code:"Escape", keyCode:27, which:27, bubbles:true});
        redactDiv.dispatchEvent(evt);
      }
    });
}

async function adjuntarArchivoSiHay(redactDiv, adjuntos) {
  if (!adjuntos) return;
  let rutas = adjuntos.split(",").map(x => x.trim());
  let rutaAdjuntar = rutas[0];

  // Copiar al portapapeles
  let copiado = false;
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(rutaAdjuntar);
      copiado = true;
    } catch (e) {}
  }
  if (!copiado) {
    try {
      const tempInput = document.createElement("input");
      tempInput.style.position = "fixed";
      tempInput.style.top = "-1000px";
      tempInput.value = rutaAdjuntar;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      document.body.removeChild(tempInput);
      copiado = true;
    } catch (e) {}
  }

  // NO intentes hacer click programático.
  if (copiado) {
    showToast("Haz clic en el botón de adjuntar archivos, pega (Ctrl+V) y presiona ENTER para adjuntar: " + rutaAdjuntar);
  } else {
    showToast("No se pudo copiar. Haz clic en el botón de adjuntar archivos, pega (Ctrl+V) y presiona ENTER: " + rutaAdjuntar);
  }
  await sleep(4000); // Da tiempo al usuario
}


// PROCESO PRINCIPAL
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if(request.action === 'create_drafts' && Array.isArray(request.emails)) {
    let emails = request.emails;
    let resultados = [];
    for(let i=0; i<emails.length; i++) {
    cerrarTodosRedactores();
    await sleep(500);
    let email = emails[i];
    let exito = false;
    try {
        await clickRedactar();
        let redactDiv = await esperarRedactor();
        if (!redactDiv) throw "No se pudo abrir el redactor";
        rellenarCampos(redactDiv, email);
        if (email.adjuntos) await adjuntarArchivoSiHay(redactDiv, email.adjuntos);
        await sleep(500);
        await cerrarRedactor(redactDiv);
        exito = true;
    } catch(e) {
        exito = false;
    }
      // Feedback por cada correo
      chrome.runtime.sendMessage({
        action: 'draft_progress',
        index: i,
        estado: exito ? "ok" : "error"
      });
      resultados.push({
        id: email.id,
        asunto: email.asunto,
        destinatario: email.destinatario,
        ok: exito
      });
    }
    // Notifica cuando termina todo
    chrome.runtime.sendMessage({
      action: 'draft_finish',
      resultados: resultados
    });
    sendResponse({resultados: resultados});
  }
});
