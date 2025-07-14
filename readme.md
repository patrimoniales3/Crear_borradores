# Generador de Correos Gmail - Extensión Chrome

Una extensión de Google Chrome que automatiza la creación de correos electrónicos en Gmail utilizando datos de archivos Excel o CSV.

## 🚀 Características

- **Procesamiento de archivos**: Soporta Excel (.xlsx, .xls, .xlsm) y CSV
- **Automatización completa**: Llena automáticamente destinatarios, CC, CCO, asunto y cuerpo
- **Validación de datos**: Verifica emails y campos requeridos antes del procesamiento  
- **Interfaz intuitiva**: Drag & drop para cargar archivos
- **Progreso en tiempo real**: Muestra el avance del procesamiento
- **Plantilla incluida**: Descarga una plantilla de ejemplo
- **Guardado como borradores**: Los correos se guardan automáticamente como borradores

## 📋 Requisitos

- Google Chrome (versión 88 o superior)
- Acceso a Gmail (https://mail.google.com)
- Archivos de datos en formato Excel o CSV

## 🔧 Instalación

### Método 1: Instalación manual (Recomendado para desarrollo)

1. **Descargar los archivos**:
   - Crear una carpeta llamada `gmail-generator`
   - Guardar todos los archivos de la extensión en esta carpeta:
     - `manifest.json`
     - `popup.html` 
     - `popup.js`
     - `content.js`
     - `utils-js.js`

2. **Cargar en Chrome**:
   - Abrir Chrome y ir a `chrome://extensions/`
   - Activar el "Modo de desarrollador" (esquina superior derecha)
   - Hacer clic en "Cargar extensión sin empaquetar"
   - Seleccionar la carpeta `gmail-generator`
   - La extensión aparecerá en la lista de extensiones

3. **Verificar instalación**:
   - Buscar el ícono de la extensión en la barra de herramientas
   - Si no aparece, hacer clic en el ícono de extensiones (puzzle) y fijar la extensión

## 📊 Formato de datos

### Columnas requeridas:
- **Destinatario**: Email del destinatario (obligatorio)
- **Asunto**: Asunto del correo (obligatorio)

### Columnas opcionales:
- **CC**: Emails en copia (separados por comas)
- **CCO**: Emails en copia oculta (separados por comas)  
- **Cuerpo**: Contenido del correo
- **Adjuntos**: Rutas de archivos a adjuntar (separadas por comas)

### Ejemplo de archivo CSV:

```csv
Id,Destinatario,CC,CCO,Asunto,Cuerpo,Adjuntos
1,cliente1@ejemplo.com,supervisor@empresa.com,,Propuesta comercial,"Estimado cliente,\n\nAdjunto la propuesta solicitada.\n\nSaludos",C:\documentos\propuesta.pdf
2,cliente2@ejemplo.com,,,Seguimiento,Estimado cliente...,
```

## 🚀 Uso

1. **Abrir Gmail**:
   - Ir a https://mail.google.com
   - Asegurarse de estar en la bandeja de entrada

2. **Cargar archivo**:
   - Hacer clic en el ícono de la extensión
   - Arrastrar el archivo Excel/CSV o usar el botón "Seleccionar archivo"
   - Si es Excel con múltiples hojas, seleccionar la hoja deseada

3. **Validar datos**:
   - La extensión validará automáticamente los datos
   - Revisar que no haya errores en la sección de validación

4. **Procesar correos**:
   - Hacer clic en "🚀 Procesar"
   - La extensión comenzará a crear los correos automáticamente
   - Se puede detener el proceso en cualquier momento

5. **Verificar resultados**:
   - Los correos se guardarán como borradores en Gmail
   - Revisar la carpeta "Borradores" para ver los correos creados

## ⚠️ Consideraciones importantes

### Limitaciones técnicas:
- **Adjuntos**: Por seguridad del navegador, los adjuntos no se pueden agregar automáticamente. La extensión preparará el diálogo, pero deberás seleccionar los archivos manualmente.
- **Velocidad**: Se recomienda procesar lotes de máximo 50 correos para evitar problemas d