/* Contenido editable de La Búsqueda del Museo.
   Las fotos reales viven en la carpeta fichas/. Los PNG originales tenían
   fondo blanco, así que se usan las versiones con transparencia de
   fichas/transparentes/, nombradas por su posición en el tablero
   (ficha_arriba_izquierda_frente.png, ficha_medio_centro_espalda.png, etc.). */
window.MUSEO = (function () {
  'use strict';

  return {
    usarImagenesReales: true,

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
      fisicoVista:
        'Estas son las instrucciones y las reglas del juego físico. Toca «Escuchar las instrucciones» y te las leo completas.',
      fisicoInstrucciones:
        'Instrucciones del juego físico. ¿Cómo se juega? Uno: el adulto a cargo de los niños escanea el código QR para ver las instrucciones. ' +
        'Dos: ordena el rompecabezas en cada escalón. ' +
        'Tres: comienzan todos en la casilla de salida. ' +
        'Cuatro: por turnos lanzan el dado. ' +
        'Cinco: avanzan el número de casillas que indica el dado. ' +
        'Seis: cuando hay una pieza, la levantan y leen el dato histórico, con ayuda de un adulto si es necesario. ' +
        'Siete: el juego termina cuando se han conseguido todas las piezas y se completa el rompecabezas. ' +
        'Reglas generales. Uno: respetar los turnos. ' +
        'Dos: cuidar los materiales. ' +
        'Tres: escuchar las instrucciones. ' +
        'Cuatro: no correr ni empujar. ' +
        'Cinco: ninguno de los participantes podrá subir o bajar escaleras sin que esté acompañado de un adulto.',
      victoria: '¡Lo lograste, gran explorador! Completaste todo el rompecabezas del museo.'
    },

    prefijoQR: 'MUSEO_ESCALON_',
    etapas: 9,

    /* Cada ficha tiene un número de escalón, pero su posición en el tablero
       no coincide con ese número. Este mapa sale de los nombres reales de
       los archivos de fichas/transparentes/. */
    posiciones: {
      1: 'abajo_derecha',
      2: 'abajo_izquierda',
      3: 'abajo_centro',
      4: 'medio_centro',
      5: 'medio_derecha',
      6: 'arriba_derecha',
      7: 'arriba_izquierda',
      8: 'arriba_centro',
      9: 'medio_izquierda'
    },

    /* Orden de las casillas del tablero 3x3, de izquierda a derecha y de
       arriba hacia abajo. */
    ordenTablero: [
      'arriba_izquierda',
      'arriba_centro',
      'arriba_derecha',
      'medio_izquierda',
      'medio_centro',
      'medio_derecha',
      'abajo_izquierda',
      'abajo_centro',
      'abajo_derecha'
    ],

    rutas: {
      frente: 'fichas/transparentes/ficha_{posicion}_frente.png',
      espalda: 'fichas/transparentes/ficha_{posicion}_espalda.png',
      completo: 'fichas/transparentes/COMPLETO.png'
    },

    etiquetaPlaceholder: 'Texto de prueba',

    /* Los datos curiosos son contenido del museo y coinciden con el texto
       impreso en la espalda de cada ficha. Se narran al girar el pergamino. */
    pergaminos: [
      {
        id: 1,
        titulo: 'Pergamino del escalón 1',
        dato:
          'El Museo de Arte abrió el 13 de diciembre de 2003. ' +
          '¡Desde ese día las personas pueden venir a conocer sus obras de arte!',
        esPlaceholder: false
      },
      {
        id: 2,
        titulo: 'Pergamino del escalón 2',
        dato:
          'Este lugar hace parte de la Universidad del Magdalena. ' +
          '¡Aquí podemos conocer obras de arte y aprender historias de hace muchos años!',
        esPlaceholder: false
      },
      {
        id: 3,
        titulo: 'Pergamino del escalón 3',
        dato:
          'En este museo hay pinturas y otras obras hechas por artistas. ' +
          '¡Cada una puede mostrarnos algo diferente!',
        esPlaceholder: false
      },
      {
        id: 4,
        titulo: 'Pergamino del escalón 4',
        dato:
          'En el Claustro se hacen presentaciones de música, poesía y otras actividades artísticas. ' +
          '¡Es un lugar donde las personas pueden mostrar sus talentos!',
        esPlaceholder: false
      },
      {
        id: 5,
        titulo: 'Pergamino del escalón 5',
        dato:
          'Este edificio también fue una escuela. ' +
          '¡Muchas personas vinieron aquí para aprender cosas nuevas!',
        esPlaceholder: false
      },
      {
        id: 6,
        titulo: 'Pergamino del escalón 6',
        dato:
          'Este edificio comenzó a construirse en el año 1673. ' +
          '¡Hace muchísimos años! ¡Es más antiguo que nuestros abuelos!',
        esPlaceholder: false
      },
      {
        id: 7,
        titulo: 'Pergamino del escalón 7',
        dato:
          'Antes este lugar era una escuela donde estudiaban las personas que querían ser sacerdotes.',
        esPlaceholder: false
      },
      {
        id: 8,
        titulo: 'Pergamino del escalón 8',
        dato:
          'Terminaron de construir este edificio en 1811. ' +
          '¡Imagínate cuánto tiempo necesitaron para terminarlo!',
        esPlaceholder: false
      },
      {
        id: 9,
        titulo: 'Pergamino del escalón 9',
        dato:
          'En el año 2001 comenzaron a arreglar este edificio para que no se dañara ' +
          'y pudiéramos seguir disfrutándolo.',
        esPlaceholder: false
      }
    ]
  };
})();
