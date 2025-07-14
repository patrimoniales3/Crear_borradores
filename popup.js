let emailData = null;
let estadosCorreos = []; // [{estado: "..."/"ok"/"error"}]
let progreso = 0;
let total = 0;

const fileInput = document.getElementById('fileInput');
const dragDropArea = document.getElementById('dragDropArea');
const fileInfo = document.getElementById('fileInfo');
const fileNameSpan = document.getElementById('fileName');
const preview = document.getElementById('preview');
const processBtn = document.getElementById('processBtn');
const msg = document.getElementById('msg');
const refreshBtn = document.getElementById('refreshBtn');

// Persistencia archivo
chrome.storage.local.get(['archivoNombre'], result => {
  if(result.archivoNombre) {
    fileNameSpan.textContent = result.archivoNombre;
    refreshBtn.style.display = "";
  } else {
    refreshBtn.style.display = "none";
  }
});

refreshBtn.addEventListener('click', () => {
  fileInput.value = "";
  fileInput.click();
});

dragDropArea.addEventListener('click', () => fileInput.click());
dragDropArea.addEventListener('dragover', e => { e.preventDefault(); dragDropArea.style.background='#dde8fb'; });
dragDropArea.addEventListener('dragleave', e => { e.preventDefault(); dragDropArea.style.background='#eef5fd'; });
dragDropArea.addEventListener('drop', e => {
  e.preventDefault(); dragDropArea.style.background='#eef5fd';
  if(e.dataTransfer.files.length>0) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', e => {
  if(e.target.files.length>0) handleFile(e.target.files[0]);
});

function normalizaCampo(txt) {
  if (!txt) return "";
  return txt.toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s_]+/g, "");
}

function handleFile(file) {
  if(!file.name.match(/\.(xlsx|xls)$/i)) {
    msg.textContent = "Solo se permiten archivos Excel (.xlsx, .xls).";
    msg.className = "msg error";
    return;
  }
  fileNameSpan.textContent = file.name;
  refreshBtn.style.display = "";
  chrome.storage.local.set({ archivoNombre: file.name });

  const reader = new FileReader();
  reader.onload = evt => {
    let wb;
    try {
      wb = XLSX.read(evt.target.result, {type:'binary'});
      const ws = wb.Sheets[wb.SheetNames[0]];
      let tempData = XLSX.utils.sheet_to_json(ws, {defval:""});
      emailData = tempData.map(row => {
        let nrow = {};
        Object.keys(row).forEach(k => {
          nrow[normalizaCampo(k)] = row[k];
        });
        return nrow;
      });
      if(emailData.length===0) throw "Archivo vacío";
      estadosCorreos = emailData.map(() => ({ estado: "" })); // Limpia estados
      showPreview(emailData, estadosCorreos);
      processBtn.disabled = false;
      msg.textContent = '';
    } catch (err) {
      emailData=null;
      preview.style.display="none";
      processBtn.disabled = true;
      msg.textContent = "Error: archivo inválido o vacío.";
      msg.className = "msg error";
    }
  };
  reader.readAsBinaryString(file);
}

// --- NUEVO: Preview muestra todos, y el estado actual de cada uno ---
function showPreview(data, estados) {
  preview.style.display = 'flex';
  preview.innerHTML = "";
  data.forEach((row, i) => {
    let id = (row["id"] || "").toString().substring(0, 4);
    let asunto = (row["asunto"] || "");
    if(asunto.length > 26) asunto = asunto.substring(0, 23) + "...";
    let destinatario = (row["destinatario"] || "");
    if(destinatario.length > 26) destinatario = destinatario.substring(0, 23) + "...";
    let icono = "";
    let color = "";
    if(estados && estados[i]) {
      if(estados[i].estado === "ok")   { icono = "✅"; color = "#388e3c";}
      else if(estados[i].estado === "error") { icono = "❌"; color = "#d32f2f";}
      else if(estados[i].estado === "...")   { icono = "..."; color = "#888"; }
    }
    preview.innerHTML += `
      <div class="preview-card" style="position:relative;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="preview-card-id">${id}</span>
          <span style="font-size:20px; font-weight:bold; color:${color}; min-width:24px; text-align:right;">${icono}</span>
        </div>
        <div class="preview-card-asunto">${asunto}</div>
        <div class="preview-card-dest">${destinatario}</div>
      </div>
    `;
  });
}

// --- Crear Borradores, progreso e iconos por tarjeta ---
processBtn.addEventListener('click', async () => {
  if(!emailData) return;
  // Estados iniciales:
  estadosCorreos = emailData.map(() => ({ estado: "..." }));
  showPreview(emailData, estadosCorreos);

  progreso = 0;
  total = emailData.length;
  updateMsgProgreso();

  let [tab] = await chrome.tabs.query({active:true, currentWindow:true});
  chrome.tabs.sendMessage(tab.id, {action:'create_drafts', emails: emailData}, response => {
    // Si no hay respuesta, termina con error global
    if(chrome.runtime.lastError) {
      msg.textContent = "No se pudo comunicar con Gmail. Asegúrate que Gmail está abierto y activo.";
      msg.className = "msg error";
    }
    // Espera que content.js mande estados parciales (ver abajo)
  });
});

// --- RECIBE ACTUALIZACIONES INDIVIDUALES desde content.js ---
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if(request.action === 'draft_progress') {
    // {index, estado: "ok"/"error", total}
    if(typeof request.index === "number") {
      estadosCorreos[request.index].estado = request.estado;
      progreso = request.index + 1;
      showPreview(emailData, estadosCorreos);
      updateMsgProgreso();
    }
  }
  if(request.action === 'draft_finish') {
    // {resultados: [...]} // opcional, si quieres mostrar un resumen
    progreso = total;
    updateMsgProgreso(true);
  }
});

// --- Muestra progreso abajo ---
function updateMsgProgreso(fin=false) {
  if(!fin)
    msg.textContent = `Enviando ${progreso}/${total}...`;
  else
    msg.textContent = `¡Listo! Enviados ${progreso}/${total} correos.`;
  msg.className = "msg";
}
