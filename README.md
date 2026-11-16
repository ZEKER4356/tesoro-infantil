# La Búsqueda del Museo

Búsqueda del tesoro híbrida para museos: nueve escalones con QR, un dado de nueve
caras que nunca repite, nueve pergaminos con frente y espalda, y un rompecabezas
3×3 que revela el museo. SPA estática en HTML, CSS y JavaScript vanilla, lista para
Cloudflare Pages.

## Probar en local

La cámara necesita un contexto seguro. En `localhost` funciona sin HTTPS.

```bash
python -m http.server 8123
```

Abre `http://localhost:8123/`. Si prefieres Node: `npx serve .`.

Sin cámara, usa el modo prueba: `http://localhost:8123/?debug=1`.

> Abrir el `index.html` con doble clic (`file://`) muestra el juego, pero la cámara
> y el service worker quedan bloqueados por el navegador. Usa el servidor local.

## Desplegar en Cloudflare Pages

1. Sube esta carpeta a un repositorio (GitHub o GitLab).
2. En Cloudflare Pages, conecta el repositorio.
3. Framework preset: **None**. Build command: vacío. Output directory: `/` (la raíz).
4. Publica. La URL final será algo como `https://tu-proyecto.pages.dev/`.

También funciona con carga directa (direct upload) de la carpeta, sin build.

## Pasar a las fotos reales

En `js/data.js`:

```js
usarImagenesReales: false  ->  true
```

Guarda los archivos con estos nombres exactos:

```
assets/frente/pieza-1.webp   ...  assets/frente/pieza-9.webp
assets/espalda/espalda-1.webp ... assets/espalda/espalda-9.webp
```

Orden de las piezas del rompecabezas:

| Pieza | Posición |
|---|---|
| 1 | arriba a la izquierda |
| 2 | arriba al centro |
| 3 | arriba a la derecha |
| 4 | centro a la izquierda |
| 5 | centro |
| 6 | centro a la derecha |
| 7 | abajo a la izquierda |
| 8 | abajo al centro |
| 9 | abajo a la derecha |

Las nueve piezas deben ser recortes del mismo mural, sin margen entre sí, para que
al unirse formen la imagen completa. Si falta algún archivo, la app lo detecta y
vuelve sola a los diseños de prueba, con un aviso.

La espalda de cada pergamino se usa como fondo del reverso, detrás del dato curioso.
Puede tener cualquier proporción: se recorta en cuadrado. Conviene una imagen sin texto
importante en el centro, porque el dato se lee encima.

## Editar los datos curiosos

En `js/data.js`, cada pergamino tiene `dato` y `esPlaceholder`. Los textos actuales
son marcadores visibles, no contenido real del museo. Cuando tengas los nueve datos:

1. Reemplaza el texto de `dato`.
2. Cambia `esPlaceholder: true` a `false`.

El título de la aventura y el mensaje final también están en `js/data.js`.

## Voz y guía

San Juan Nepomuceno acompaña la partida con un globo de diálogo y voz. La voz usa la
Web Speech API del propio dispositivo (`speechSynthesis`), sin servicios externos ni
archivos de audio. Prefiere una voz en español de Colombia, Latinoamérica o España, en
ese orden.

- En el inicio da la bienvenida; si hay una partida guardada, recuerda cuántos
  pergaminos llevas.
- Narra el resultado del dado, los errores de escaneo, el dato curioso del pergamino y
  el mensaje de victoria.
- Cada globo tiene **Escuchar otra vez**. En los modales del pergamino y de la victoria
  el botón repite el texto correspondiente.
- Respeta el botón de sonido. Si está silenciado, **Escuchar otra vez** lo activa y
  vuelve a leer.
- En el tablero también comenta la pieza elegida, los aciertos y los errores.

Los textos se editan en `js/data.js`, dentro de `guia`. Los datos curiosos se narran
desde `pergaminos`; mientras `esPlaceholder` sea `true`, la voz avisa que el dato está
en prueba.

El navegador puede bloquear la bienvenida automática hasta el primer toque en la
pantalla. Los botones **Escuchar otra vez** siempre funcionan porque nacen de un toque.
En iPhone, la voz necesita ese primer toque; la calidad y disponibilidad de voces
dependen del sistema.

## Imprimir los QRs

Abre `https://tu-sitio/?admin=1`. Escribe la dirección pública del juego en el campo
del QR maestro y pulsa **Generar los QRs**. El botón **Imprimir** produce una hoja A4
con el QR de entrada y los nueve códigos de escalón, listos para recortar.

Los códigos de escalón son texto plano (`MUSEO_ESCALON_1` a `MUSEO_ESCALON_9`): se
leen dentro del juego, no con la cámara del sistema. El QR maestro sí es una URL y
abre la pantalla de inicio.

## Modo prueba

`?debug=1` activa dos botones para simular el escaneo correcto, uno en la vista del
dado y otro dentro del escáner. Sirve para recorrer los nueve turnos y la victoria sin
cámara. No aparece en la URL normal.

## PWA y caché

La app incluye `manifest.webmanifest`, iconos y un service worker (`sw.js`) que guarda
el juego para funcionar sin red después de la primera visita. El escáner y el generador
de QRs se descargan de CDN solo cuando se usan, y también quedan en caché.

Al publicar cambios, sube el número de `VERSION` en `sw.js` (por ejemplo `museo-v2`).
Si no lo haces, los teléfonos que ya jugaron pueden seguir viendo la versión anterior.

El icono es provisional. Para cambiarlo, reemplaza los cuatro PNG de `assets/icons/`
manteniendo los tamaños, y `icon.svg`.

## Estructura

```
index.html                vistas, modales y sprite SVG
css/styles.css            sistema visual, dado, flip 3D, tablero, confeti, impresión
js/data.js                contenido, textos de la guía y rutas de imágenes
js/app.js                 estado, dado, cámara, voz, tablero, admin
manifest.webmanifest      instalación como app
sw.js                     caché offline
assets/frente/            piezas del rompecabezas
assets/espalda/           reversos de los pergaminos
assets/icons/             iconos PWA
```

## Límites conocidos

- `navigator.vibrate` no existe en iOS. El juego funciona igual, sin vibración.
- La voz usa las voces instaladas en el dispositivo. En iOS suele necesitar un primer
  toque; si no hay ninguna voz en español, el sistema usa la voz por defecto.
- La cámara requiere HTTPS o `localhost`.
- El progreso vive en `localStorage` del dispositivo. Dos niños en el mismo teléfono
  comparten partida; usa **Reiniciar partida** al prestarlo.
- El service worker tarda una visita en activarse y otra en servir la copia offline.
- Los QRs impresos deben conservar la zona blanca alrededor del código.
