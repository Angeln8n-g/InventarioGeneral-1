# 🧹 Plan de Limpieza de Archivos

**Fecha**: 4 de octubre, 2025  
**Objetivo**: Organizar y limpiar archivos de documentación

---

## 📋 Archivos a Mantener en Raíz

### Esenciales
- ✅ `README.md` - Documentación principal del proyecto
- ✅ `CHANGELOG.md` - Historial de cambios
- ✅ `package.json` - Configuración del proyecto
- ✅ `.gitignore` - Archivos ignorados por Git

### Guías Principales (Mantener en raíz para fácil acceso)
- ✅ `CLARO_THEME_GUIDE.md` - Guía principal del tema
- ✅ `CLARO_ICON_INTEGRATION_COMPLETE.md` - Estado actual de iconos
- ✅ `QUICK_ICON_SETUP.md` - Inicio rápido de iconos

---

## 📁 Archivos a Mover

### A `docs/claro-theme/`
- [ ] `CLARO_THEME_SESSION_SUMMARY.md`
- [ ] `CLARO_THEME_COMMITS_SUMMARY.md`
- [ ] `CLARO_THEME_COMPLETION_REPORT.md`
- [ ] `CLARO_THEME_IMPLEMENTATION_SUMMARY.md`
- [ ] `CLARO_THEME_PHASE_2_COMPLETE.md`
- [ ] `CLARO_THEME_PHASE_2_PENDING.md`
- [ ] `CLARO_THEME_TESTING_GUIDE.md`
- [ ] `RESUMEN_TEMA_CLARO.md`
- [ ] `CONSUMABLES_THEME_FIX.md`
- [ ] `MY_LOANS_THEME_FIX.md`
- [ ] `NEON_THEME_GUIDE.md` (obsoleto, pero mantener por referencia)
- [ ] `NEON_THEME_IMPLEMENTATION.md` (obsoleto)
- [ ] `TEMA_NEON_PAGINAS_ADICIONALES.md` (obsoleto)
- [ ] `THEME_PREVIEW.md` (obsoleto)
- [ ] `RESUMEN_IMPLEMENTACION.md` (obsoleto)

### A `docs/icons/`
- [ ] `CLARO_ICON_INTEGRATION_GUIDE.md`
- [ ] `ICON_CUSTOMIZATION_NEEDED.md`
- [ ] `ICON_INTEGRATION_SUMMARY.md`

### A `docs/features/`
- [ ] `MULTI_SCAN_FEATURE_README.md`
- [ ] `MULTI_SCAN_IMPLEMENTATION_STATUS.md`
- [ ] `MULTI_SCAN_EXAMPLES.md`
- [ ] `MOBILE_DASHBOARD_IMPLEMENTATION.md`
- [ ] `NOTIFICATIONS_IMPLEMENTATION.md`
- [ ] `RESUMEN_NOTIFICACIONES.md`
- [ ] `CONSUMABLE_QR_SCANNER.md`

### A `docs/testing/`
- [ ] `TASK_11_COMPLETION_SUMMARY.md`
- [ ] `TASK_12_VISUAL_TESTING_SUMMARY.md`
- [ ] `ACCESSIBILITY_TESTING_REPORT.md`
- [ ] `ACCESSIBILITY_IMPROVEMENTS_NEEDED.md`

### A `docs/fixes/`
- [ ] `FIXES_APPLIED.md`
- [ ] `FINAL_FIXES_SUMMARY.md`
- [ ] `QR_CODE_FIX.md`
- [ ] `SCANNER_LOOP_FIX.md`
- [ ] `DUPLICATE_VALIDATION_FIX.md`
- [ ] `NEXTJS15_PARAMS_FIX.md`
- [ ] `SCRIPT_FIX_APPLIED.md`

### A `docs/setup/`
- [ ] `SETUP_QR_CODES.md`
- [ ] `SETUP_STOCK_MOVEMENTS.md`
- [ ] `IMPORT_TOOLS_README.md`
- [ ] `SCRIPT_IMPORTACION_RESUMEN.md`

### A `docs/archived/` (Obsoletos o duplicados)
- [ ] `BUILD_SUCCESS_REPORT.md`
- [ ] `COMPLETION_REPORT.md`
- [ ] `EXECUTIVE_SUMMARY.md`
- [ ] `FEATURE_SUMMARY.md`
- [ ] `FINAL_SUMMARY.md`
- [ ] `IMPLEMENTATION_COMPLETE_SUMMARY.md`

---

## 🗑️ Archivos a Eliminar

### Duplicados o Redundantes
- [ ] Archivos de resumen duplicados
- [ ] Reportes de completación antiguos
- [ ] Documentación de tema neón (ya reemplazado por Claro)

### Temporales
- [ ] Archivos de prueba
- [ ] Reportes de sesión antiguos

---

## 📊 Resumen

### Totales
- **Archivos en raíz**: ~50 archivos .md
- **Mantener en raíz**: 6 archivos
- **Mover a docs/**: ~35 archivos
- **Archivar**: ~9 archivos

### Estructura Final
```
/
├── README.md
├── CHANGELOG.md
├── CLARO_THEME_GUIDE.md
├── CLARO_ICON_INTEGRATION_COMPLETE.md
├── QUICK_ICON_SETUP.md
├── docs/
│   ├── README.md
│   ├── claro-theme/
│   ├── icons/
│   ├── features/
│   ├── testing/
│   ├── fixes/
│   ├── setup/
│   └── archived/
├── scripts/
└── [otros directorios del proyecto]
```

---

## ✅ Beneficios

1. **Organización**: Documentación estructurada por categoría
2. **Mantenibilidad**: Fácil encontrar documentos específicos
3. **Limpieza**: Raíz del proyecto más limpia
4. **Profesionalismo**: Estructura estándar de proyecto

---

## 🚀 Ejecución

### Opción 1: Manual
Mover archivos uno por uno según el plan

### Opción 2: Script (Recomendado)
Crear un script PowerShell para automatizar el proceso

---

**Estado**: 📋 Plan Creado  
**Próximo Paso**: Ejecutar la limpieza
