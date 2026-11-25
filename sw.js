/* Caché offline de La Búsqueda del Museo.
   Al publicar cambios en HTML, CSS o JS, sube el número de VERSION
   para que los teléfonos descarten la copia vieja. */
const VERSION = 'museo-v10';

const SHELL = [
  './',
  './index.html',
  './css/styles.css',
  './js/data.js',
  './js/app.js',
  './manifest.webmanifest',
  './fichas/transparentes/COMPLETO.png',
  './fichas/transparentes/ficha_1_frente.png',
  './fichas/transparentes/ficha_1_espalda.png',
  './fichas/transparentes/ficha_2_frente.png',
  './fichas/transparentes/ficha_2_espalda.png',
  './fichas/transparentes/ficha_3_frente.png',
  './fichas/transparentes/ficha_3_espalda.png',
  './fichas/transparentes/ficha_4_frente.png',
  './fichas/transparentes/ficha_4_espalda.png',
  './fichas/transparentes/ficha_5_frente.png',
  './fichas/transparentes/ficha_5_espalda.png',
  './fichas/transparentes/ficha_6_frente.png',
  './fichas/transparentes/ficha_6_espalda.png',
  './fichas/transparentes/ficha_7_frente.png',
  './fichas/transparentes/ficha_7_espalda.png',
  './fichas/transparentes/ficha_8_frente.png',
  './fichas/transparentes/ficha_8_espalda.png',
  './fichas/transparentes/ficha_9_frente.png',
  './fichas/transparentes/ficha_9_espalda.png',
  './assets/icons/icon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
  './assets/icons/apple-touch-icon-180.png'
];

const CDN = ['unpkg.com', 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(VERSION)
      .then((cache) =>
        Promise.all(
          SHELL.map((url) =>
            cache.add(new Request(url, { cache: 'reload' })).catch(() => null)
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) =>
        Promise.all(claves.filter((clave) => clave !== VERSION).map((clave) => caches.delete(clave)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;
  if (peticion.method !== 'GET') return;

  if (peticion.mode === 'navigate') {
    evento.respondWith(navegacion(peticion));
    return;
  }

  const url = new URL(peticion.url);
  const mismoOrigen = url.origin === self.location.origin;
  if (!mismoOrigen && !CDN.includes(url.hostname)) return;

  evento.respondWith(cachePrimeroConRed(evento));
});

async function navegacion(peticion) {
  try {
    const respuesta = await fetch(peticion);
    const cache = await caches.open(VERSION);
    cache.put('./index.html', respuesta.clone()).catch(() => null);
    return respuesta;
  } catch (error) {
    const guardada = await caches.match('./index.html');
    return guardada || Response.error();
  }
}

async function cachePrimeroConRed(evento) {
  const peticion = evento.request;
  const cache = await caches.open(VERSION);
  const guardada = await cache.match(peticion);

  const red = fetch(peticion)
    .then((respuesta) => {
      if (respuesta && (respuesta.ok || respuesta.type === 'opaque')) {
        cache.put(peticion, respuesta.clone()).catch(() => null);
      }
      return respuesta;
    })
    .catch(() => guardada);

  if (guardada) {
    evento.waitUntil(red);
    return guardada;
  }
  return red;
}
