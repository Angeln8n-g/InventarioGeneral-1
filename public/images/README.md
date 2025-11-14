# Login Background Image

## Instrucciones para agregar la imagen

Para completar la implementación de la imagen de fondo del login, necesitas:

1. **Guardar la imagen** proporcionada como `login-background.jpg` en esta carpeta (`public/images/`)

2. **Optimizar la imagen** antes de guardarla:
   - Formato recomendado: JPEG o WebP
   - Resolución recomendada: 1920x1080px (Full HD)
   - Calidad de compresión: 80-85%
   - Tamaño objetivo: < 200KB

3. **Herramientas de optimización** (opcionales):
   - Online: [TinyPNG](https://tinypng.com/) o [Squoosh](https://squoosh.app/)
   - CLI: `npm install -g sharp-cli` y luego `sharp -i input.jpg -o login-background.jpg -q 85`

## Verificación

Una vez guardada la imagen, verifica que:
- La ruta sea exactamente: `public/images/login-background.jpg`
- El archivo sea accesible desde el navegador en: `http://localhost:3000/images/login-background.jpg`
- La página de login muestre la imagen de fondo correctamente

## Fallback

Si la imagen no está disponible, el sistema mostrará un gradiente CSS como respaldo (coral → púrpura → azul).
