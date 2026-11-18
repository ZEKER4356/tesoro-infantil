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

    /* El guía habla con la voz del dispositivo (Web Speech API).
       Estos textos se leen con el botón "Escuchar otra vez". */
    guia: {
      nombre: 'San Juan Nepomuceno',
      bienvenida:
        '¡Hola, pequeño explorador! Soy San Juan Nepomuceno. Elige cómo quieres jugar: ' +
        'con el dado virtual o con el dado físico del museo.',
      regreso: '¡Hola otra vez, pequeño explorador! Toca Continuar y seguimos la búsqueda.',
      completo: '¡Qué alegría verte otra vez! Tu museo ya está completo. Puedes verlo en el tablero.',
      dado: '¡Es tu turno! Toca el dado mágico para descubrir a qué escalón debes caminar.',
      dadoResultado: '¡Genial! Te salió el número {n}. Busca el escalón {n} y escanea su código.',
      fisico: '¡Lanza el dado físico! Luego toca aquí el número que te salió.',
      fisicoResultado: '¡Genial! Te salió el número {n}. Ve al escalón {n} y escanea su código QR.',
      fisicoRepetido: '¡Uy, te volvió a salir el número {n}! Como ya tienes ese pergamino en tu inventario, te quedas aquí y esperas tu siguiente turno para lanzar el dado otra vez.',
      guardarPergamino: 'Guarda el pergamino del escalón {n} para seguir con la aventura.',
      armar: '¡Ya tienes los nueve pergaminos! Ve al tablero a armar el rompecabezas del museo.',
      escaner: 'Apunta la cámara de tu teléfono hacia el código QR que está pegado en el escalón.',
      escanerError: '¡Ups! Ese es otro escalón. Sigue buscando el escalón {n}.',
      pergamino: '¡Lo encontraste! Toca el pergamino para darle la vuelta y descubrir un secreto del museo.',
      sabias: '¿Sabías que...?',
      tablero: '¡Vamos a armar el misterio! Toca una de tus piezas y luego toca el cuadrito donde crees que va.',
      tableroVacio: 'Todavía no tienes piezas. Escanea el código de un escalón para conseguir la primera.',
      tableroCompleto: 'El museo está completo. ¡Buen trabajo, explorador!',
      pergaminos: 'Aquí guardas tus pergaminos. Toca uno para volver a escucharlo.',
      pergaminosVacio: 'Todavía no tienes pergaminos. Escanea el código de un escalón para conseguir el primero.',
      datoEnPrueba: 'El dato curioso de este escalón todavía está en prueba.',
      victoria: '¡Lo lograste, gran explorador! Completaste todo el rompecabezas del museo.'
    },

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
