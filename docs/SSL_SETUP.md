# Configuración de SSL/TLS con Let's Encrypt

Esta guía detalla cómo configurar certificados SSL/TLS gratuitos de Let's Encrypt para el dominio `inventario.hunykho.com` en Ubuntu 20.04.

## Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Instalación de Certbot](#instalación-de-certbot)
- [Obtención del Certificado](#obtención-del-certificado)
- [Configuración en Nginx](#configuración-en-nginx)
- [Renovación Automática](#renovación-automática)
- [Verificación](#verificación)
- [Troubleshooting](#troubleshooting)

---

## Requisitos Previos

Antes de comenzar, asegúrate de que:

1. ✅ El dominio `inventario.hunykho.com` está configurado en tu DNS
2. ✅ El registro A apunta a la IP de tu servidor
3. ✅ El DNS se ha propagado (verifica con `nslookup inventario.hunykho.com`)
4. ✅ Los puertos 80 y 443 están abiertos en el firewall
5. ✅ No hay ningún servicio corriendo en el puerto 80 (detener Nginx temporalmente)

### Verificar DNS

```bash
# Desde tu servidor o computadora local
nslookup inventario.hunykho.com

# Debería retornar la IP de tu servidor
```

### Verificar Puertos

```bash
# Verificar que los puertos están abiertos
sudo ufw status

# Deberían estar permitidos:
# 80/tcp                     ALLOW       Anywhere
# 443/tcp                    ALLOW       Anywhere
```

---

## Instalación de Certbot

### Método 1: Instalación desde Repositorios de Ubuntu 20.04

```bash
# Actualizar repositorios
sudo apt update

# Instalar Certbot
sudo apt install -y certbot

# Verificar instalación
certbot --version
```

### Método 2: Instalación con Snap (Recomendado por Let's Encrypt)

```bash
# Instalar snapd si no está instalado
sudo apt install -y snapd

# Actualizar snap
sudo snap install core
sudo snap refresh core

# Remover certbot de apt si existe
sudo apt remove certbot

# Instalar certbot con snap
sudo snap install --classic certbot

# Crear enlace simbólico
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Verificar instalación
certbot --version
```

---

## Obtención del Certificado

### Paso 1: Detener Servicios en Puerto 80

Certbot necesita usar el puerto 80 temporalmente para validar el dominio.

```bash
# Si Docker Compose está corriendo, detenerlo
cd /opt/inventory-app
docker-compose down

# O solo detener nginx
docker-compose stop nginx
```

### Paso 2: Obtener Certificado con Modo Standalone

```bash
# Obtener certificado para inventario.hunykho.com
sudo certbot certonly --standalone -d inventario.hunykho.com

# Certbot te pedirá:
# 1. Email (para notificaciones de expiración)
# 2. Aceptar términos de servicio (A)
# 3. Compartir email con EFF (Y/N - opcional)
```

**Salida esperada:**

```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/inventario.hunykho.com/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/inventario.hunykho.com/privkey.pem
This certificate expires on 2025-04-22.
```

### Paso 3: Verificar Certificados

```bash
# Listar certificados
sudo certbot certificates

# Ver archivos del certificado
sudo ls -la /etc/letsencrypt/live/inventario.hunykho.com/

# Deberías ver:
# - cert.pem       -> Certificado del servidor
# - chain.pem      -> Cadena de certificados intermedios
# - fullchain.pem  -> cert.pem + chain.pem (usar este en Nginx)
# - privkey.pem    -> Clave privada (mantener segura)
```

---

## Configuración en Nginx

### Paso 1: Copiar Certificados al Directorio de la Aplicación

```bash
# Crear directorio para SSL si no existe
mkdir -p /opt/inventory-app/nginx/ssl

# Copiar certificados
sudo cp /etc/letsencrypt/live/inventario.hunykho.com/fullchain.pem /opt/inventory-app/nginx/ssl/
sudo cp /etc/letsencrypt/live/inventario.hunykho.com/privkey.pem /opt/inventory-app/nginx/ssl/

# Cambiar permisos
sudo chown $USER:$USER /opt/inventory-app/nginx/ssl/*.pem
chmod 644 /opt/inventory-app/nginx/ssl/fullchain.pem
chmod 600 /opt/inventory-app/nginx/ssl/privkey.pem
```

### Paso 2: Verificar Configuración de Nginx

El archivo `nginx/nginx.conf` ya debe tener la configuración SSL:

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name inventario.hunykho.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    # ... resto de la configuración
}
```

### Paso 3: Iniciar Servicios

```bash
# Desde /opt/inventory-app
cd /opt/inventory-app

# Iniciar servicios
docker-compose up -d

# Verificar que están corriendo
docker-compose ps

# Ver logs
docker-compose logs -f nginx
```

### Paso 4: Verificar Configuración de Nginx

```bash
# Probar configuración de Nginx
docker exec nginx-proxy nginx -t

# Debería retornar:
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

---

## Renovación Automática

Los certificados de Let's Encrypt expiran cada 90 días. Es crucial configurar renovación automática.

### Método 1: Cron Job (Recomendado)

```bash
# Crear script de renovación
sudo nano /opt/inventory-app/renew-ssl.sh
```

Contenido del script:

```bash
#!/bin/bash

# Script de renovación de certificados SSL
# Ejecutar como root

# Detener nginx para liberar puerto 80
cd /opt/inventory-app
docker-compose stop nginx

# Renovar certificados
certbot renew --quiet

# Copiar certificados actualizados
cp /etc/letsencrypt/live/inventario.hunykho.com/fullchain.pem /opt/inventory-app/nginx/ssl/
cp /etc/letsencrypt/live/inventario.hunykho.com/privkey.pem /opt/inventory-app/nginx/ssl/

# Ajustar permisos
chown inventory:inventory /opt/inventory-app/nginx/ssl/*.pem
chmod 644 /opt/inventory-app/nginx/ssl/fullchain.pem
chmod 600 /opt/inventory-app/nginx/ssl/privkey.pem

# Reiniciar nginx
docker-compose start nginx

# Log
echo "$(date): Certificados SSL renovados" >> /var/log/ssl-renewal.log
```

Hacer el script ejecutable:

```bash
sudo chmod +x /opt/inventory-app/renew-ssl.sh
```

Crear cron job:

```bash
# Editar crontab de root
sudo crontab -e

# Agregar esta línea (ejecutar a las 3 AM todos los días)
0 3 * * * /opt/inventory-app/renew-ssl.sh
```

### Método 2: Systemd Timer (Alternativa)

Certbot instalado con snap incluye un timer automático:

```bash
# Verificar que el timer está activo
sudo systemctl status snap.certbot.renew.timer

# Si no está activo, habilitarlo
sudo systemctl enable snap.certbot.renew.timer
sudo systemctl start snap.certbot.renew.timer
```

Para este método, necesitas un hook de post-renovación:

```bash
# Crear hook
sudo nano /etc/letsencrypt/renewal-hooks/post/reload-nginx.sh
```

Contenido:

```bash
#!/bin/bash
cp /etc/letsencrypt/live/inventario.hunykho.com/*.pem /opt/inventory-app/nginx/ssl/
docker exec nginx-proxy nginx -s reload
```

Hacer ejecutable:

```bash
sudo chmod +x /etc/letsencrypt/renewal-hooks/post/reload-nginx.sh
```

### Probar Renovación

```bash
# Hacer dry-run (no renueva realmente)
sudo certbot renew --dry-run

# Si todo está bien, verás:
# Congratulations, all simulated renewals succeeded
```

---

## Verificación

### 1. Verificar Certificado en el Navegador

Visita: `https://inventario.hunykho.com`

- ✅ Debería mostrar candado verde
- ✅ Certificado válido
- ✅ Emitido por Let's Encrypt

### 2. Verificar con OpenSSL

```bash
# Verificar certificado
openssl s_client -connect inventario.hunykho.com:443 -servername inventario.hunykho.com

# Verificar fechas de expiración
echo | openssl s_client -connect inventario.hunykho.com:443 -servername inventario.hunykho.com 2>/dev/null | openssl x509 -noout -dates
```

### 3. Verificar con SSL Labs

Visita: https://www.ssllabs.com/ssltest/

Ingresa: `inventario.hunykho.com`

Deberías obtener calificación **A** o **A+**.

### 4. Verificar Headers de Seguridad

```bash
curl -I https://inventario.hunykho.com

# Deberías ver:
# Strict-Transport-Security: max-age=31536000; includeSubDomains
# X-Frame-Options: SAMEORIGIN
# X-Content-Type-Options: nosniff
```

---

## Troubleshooting

### Problema: "Failed to bind to port 80"

**Causa**: Otro servicio está usando el puerto 80.

**Solución**:

```bash
# Ver qué está usando el puerto 80
sudo lsof -i :80

# O con netstat
sudo netstat -tulpn | grep :80

# Detener el servicio (ejemplo: nginx en Docker)
docker-compose stop nginx

# Intentar de nuevo
sudo certbot certonly --standalone -d inventario.hunykho.com
```

### Problema: "DNS problem: NXDOMAIN"

**Causa**: El dominio no resuelve correctamente.

**Solución**:

```bash
# Verificar DNS
nslookup inventario.hunykho.com

# Si no resuelve, verificar configuración en tu proveedor DNS
# Esperar a que el DNS se propague (puede tomar hasta 48 horas)
```

### Problema: "Connection refused"

**Causa**: Firewall bloqueando puerto 80.

**Solución**:

```bash
# Verificar firewall
sudo ufw status

# Permitir puerto 80
sudo ufw allow 80/tcp

# Intentar de nuevo
sudo certbot certonly --standalone -d inventario.hunykho.com
```

### Problema: Certificado no se renueva automáticamente

**Solución**:

```bash
# Verificar logs de certbot
sudo journalctl -u snap.certbot.renew.service

# O si usas cron
sudo tail -f /var/log/syslog | grep certbot

# Probar renovación manual
sudo certbot renew --dry-run

# Verificar que el cron job existe
sudo crontab -l
```

### Problema: "Certificate has expired"

**Solución**:

```bash
# Renovar manualmente
sudo certbot renew --force-renewal

# Copiar certificados
sudo cp /etc/letsencrypt/live/inventario.hunykho.com/*.pem /opt/inventory-app/nginx/ssl/

# Recargar nginx
docker exec nginx-proxy nginx -s reload
```

### Problema: Nginx muestra "SSL certificate problem"

**Solución**:

```bash
# Verificar que los archivos existen
ls -la /opt/inventory-app/nginx/ssl/

# Verificar permisos
# fullchain.pem debe ser 644
# privkey.pem debe ser 600

# Verificar que Nginx puede leer los archivos
docker exec nginx-proxy ls -la /etc/nginx/ssl/

# Verificar configuración de Nginx
docker exec nginx-proxy nginx -t
```

---

## Comandos Útiles

```bash
# Listar todos los certificados
sudo certbot certificates

# Renovar todos los certificados
sudo certbot renew

# Renovar forzadamente (sin esperar a que expire)
sudo certbot renew --force-renewal

# Revocar certificado
sudo certbot revoke --cert-path /etc/letsencrypt/live/inventario.hunykho.com/cert.pem

# Eliminar certificado
sudo certbot delete --cert-name inventario.hunykho.com

# Ver logs de certbot
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

---

## Notas Importantes

1. **Límites de Rate Limiting**: Let's Encrypt tiene límites:
   - 50 certificados por dominio registrado por semana
   - 5 certificados duplicados por semana
   - Usa `--dry-run` para probar sin consumir límites

2. **Backup de Certificados**: Considera hacer backup de `/etc/letsencrypt/`

3. **Múltiples Dominios**: Puedes agregar múltiples dominios:
   ```bash
   sudo certbot certonly --standalone -d inventario.hunykho.com -d www.inventario.hunykho.com
   ```

4. **Wildcard Certificates**: Requieren validación DNS (no standalone):
   ```bash
   sudo certbot certonly --manual --preferred-challenges dns -d *.hunykho.com
   ```

---

## Referencias

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Certbot Documentation](https://certbot.eff.org/docs/)
- [SSL Labs Best Practices](https://github.com/ssllabs/research/wiki/SSL-and-TLS-Deployment-Best-Practices)

**Última actualización**: 2025-01-22
