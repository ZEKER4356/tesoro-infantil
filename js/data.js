/* Contenido editable de La Búsqueda del Museo.
   Para pasar a las fotos reales, cambia usarImagenesReales a true y guarda
   los archivos en assets/frente y assets/espalda con los nombres indicados.
   No hace falta tocar js/app.js. */
window.MUSEO = (function () {
  'use strict';

  return {
    usarImagenesReales: false,

    titulo: 'La Búsqueda del Museo',
    subtitulo: 'Nueve escalones, nueve pergaminos y un museo por descubrir.',

    mensajeFinal:
      'Lo lograste. Recorriste los nueve escalones, reuniste los nueve pergaminos ' +
      'y armaste el museo pieza por pieza. Cada rincón que viste guarda una historia, ' +
      'y ahora forma parte de la tuya. Vuelve cuando quieras, explorador.',

    prefijoQR: 'MUSEO_ESCALON_',
    etapas: 9,

    /* pieza-1.webp es la esquina superior izquierda, pieza-2 la de su derecha
       y pieza-9 la esquina inferior derecha. El tablero usa ese mismo orden. */
    rutas: {
      frente: 'assets/frente/pieza-{n}.webp',
      espalda: 'assets/espalda/espalda-{n}.webp'
    },

    etiquetaPlaceholder: 'Texto de prueba',

    /* Los datos curiosos son contenido del museo: no se inventan.
       Mientras esPlaceholder sea true, la app muestra la etiqueta de prueba. */
    pergaminos: [
      {
        id: 1,
        titulo: 'Pergamino del escalón 1',
        dato: 'Escribe aquí el dato curioso real del escalón 1. Reemplaza este texto en js/data.js.',
        esPlaceholder: true
      },
      {
        id: 2,
        titulo: 'Pergamino del escalón 2',
        dato: 'Escribe aquí el dato curioso real del escalón 2. Reemplaza este texto en js/data.js.',
        esPlaceholder: true
      },
      {
        id: 3,
        titulo: 'Pergamino del escalón 3',
        dato: 'Escribe aquí el dato curioso real del escalón 3. Reemplaza este texto en js/data.js.',
        esPlaceholder: true
      },
      {
        id: 4,
        titulo: 'Pergamino del escalón 4',
        dato: 'Escribe aquí el dato curioso real del escalón 4. Reemplaza este texto en js/data.js.',
        esPlaceholder: true
      },
      {
        id: 5,
        titulo: 'Pergamino del escalón 5',
        dato: 'Escribe aquí el dato curioso real del escalón 5. Reemplaza este texto en js/data.js.',
        esPlaceholder: true
      },
      {
        id: 6,
        titulo: 'Pergamino del escalón 6',
        dato: 'Escribe aquí el dato curioso real del escalón 6. Reemplaza este texto en js/data.js.',
        esPlaceholder: true
      },
      {
        id: 7,
        titulo: 'Pergamino del escalón 7',
        dato: 'Escribe aquí el dato curioso real del escalón 7. Reemplaza este texto en js/data.js.',
        esPlaceholder: true
      },
      {
        id: 8,
        titulo: 'Pergamino del escalón 8',
        dato: 'Escribe aquí el dato curioso real del escalón 8. Reemplaza este texto en js/data.js.',
        esPlaceholder: true
      },
      {
        id: 9,
        titulo: 'Pergamino del escalón 9',
        dato: 'Escribe aquí el dato curioso real del escalón 9. Reemplaza este texto en js/data.js.',
        esPlaceholder: true
      }
    ]
  };
})();
