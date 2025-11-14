# Scripts de Utilidad

Este directorio contiene scripts útiles para el mantenimiento del sistema.

## 📋 Scripts Disponibles

### 1. Limpieza de Notificaciones de Prueba

**Archivo:** `cleanup-test-notifications.ts`

**Descripción:** Elimina todas las notificaciones de prueba de la base de datos.

**Uso:**
```bash
npm run cleanup:notifications
```

**Qué hace:**
- Busca notificaciones con palabras clave de prueba ("test", "prueba")
- Elimina las notificaciones encontradas
- Muestra un reporte antes/después

**Ejemplo de salida:**
```
🧹 Starting cleanup of test notifications...
📊 Total notifications before cleanup: 45
✅ Deleted 12 test notifications
📊 Total notifications after cleanup: 33
✨ Cleanup completed successfully!
```

**Requisitos:**
- Variables de entorno configuradas en `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

---

### 2. Importación de Herramientas

**Archivo:** `import-tools.js`

**Descripción:** Importa herramientas desde un archivo Excel.

**Uso:**
```bash
npm run import:tools
```

---

## 🔧 Agregar Nuevos Scripts

Para agregar un nuevo script:

1. Crear el archivo en `scripts/`
2. Agregar el comando en `package.json`:
   ```json
   "scripts": {
     "mi-script": "ts-node scripts/mi-script.ts"
   }
   ```
3. Documentar aquí

---

## 📝 Notas

- Los scripts TypeScript requieren `ts-node` instalado
- Siempre hacer backup antes de ejecutar scripts de limpieza
- Verificar las variables de entorno antes de ejecutar
