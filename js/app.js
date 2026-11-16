/* La Búsqueda del Museo
   Estado, dado, escáner, tablero, colección y modo administrador. */
(function () {
  'use strict';

  const DATA = window.MUSEO;
  const CLAVE = 'museo_v1';
  const ETAPAS = DATA.etapas;

  const PARAMS = new URLSearchParams(window.location.search);
  const ES_ADMIN = PARAMS.get('admin') === '1';
  const ES_DEBUG = PARAMS.get('debug') === '1';
  const REDUCIDO = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const URL_ESCANER = 'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js';
  const URL_ESCANER_ALT = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
  const URL_QR = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';
  const URL_QR_ALT = 'https://unpkg.com/qrcode-generator@1.4.4/qrcode.js';

  const $ = (sel, raiz) => (raiz || document).querySelector(sel);
  const $$ = (sel, raiz) => Array.from((raiz || document).querySelectorAll(sel));

  const el = {
    avatar: $('#avatarSanJuan'),
    guiaInicioTexto: $('#guia-inicio-texto'),
    guiaTableroTexto: $('#guia-tablero-texto'),
    guiaPergaminosTexto: $('#guia-pergaminos-texto'),
    btnOirPergamino: $('#btn-oir-pergamino'),
    btnOirVictoria: $('#btn-oir-victoria'),

    nav: $('#nav-inferior'),
    btnIniciar: $('#btn-iniciar'),
    btnContinuar: $('#btn-continuar'),
    continuarEtiqueta: $('#continuar-etiqueta'),
    continuarDetalle: $('#continuar-detalle'),
    btnReiniciar: $('#btn-reiniciar'),

    progreso: $('#lista-progreso'),
    dado: $('#dado'),
    dadoNumero: $('#dado-numero'),
    dadoParadas: $('#dado-paradas'),
    dadoEstado: $('#dado-estado'),
    btnLanzar: $('#btn-lanzar'),
    panelObjetivo: $('#panel-objetivo'),
    objetivoNumero: $('#objetivo-numero'),
    btnEscanear: $('#btn-escanear'),
    btnSimular: $('#btn-simular'),
    avisoPendiente: $('#aviso-pendiente'),
    btnAbrirPendiente: $('#btn-abrir-pendiente'),
    avisoArmar: $('#aviso-armar'),
    btnIrTablero: $('#btn-ir-tablero'),

    tablero: $('#tablero'),
    tableroCuenta: $('#tablero-cuenta'),
    inventario: $('#inventario'),
    inventarioVacio: $('#inventario-vacio'),
    btnVictoriaFinal: $('#btn-victoria-final'),

    coleccion: $('#coleccion'),
    coleccionCuenta: $('#coleccion-cuenta'),
    coleccionVacio: $('#coleccion-vacio'),

    escanerInstruccion: $('#escaner-instruccion'),
    escanerCargando: $('#escaner-cargando'),
    escanerError: $('#escaner-error'),
    escanerMarco: $('.escaner__marco'),
    btnReintentar: $('#btn-reintentar'),
    btnSimularModal: $('#btn-simular-modal'),

    pergaminoTitulo: $('#pergamino-titulo'),
    pergaminoSubtitulo: $('#pergamino-subtitulo'),
    pergaminoVisual: $('#pergamino-visual'),
    pergaminoDato: $('#pergamino-dato'),
    pergaminoPrueba: $('#pergamino-prueba'),
    pergaminoReverso: $('.pergamino'),
    flip: $('#pergamino-flip'),
    btnGirar: $('#btn-girar'),
    btnGuardar: $('#btn-guardar'),
    pergaminoAyuda: $('#pergamino-ayuda'),

    victoriaMensaje: $('#victoria-mensaje'),
    victoriaResumen: $('#victoria-resumen'),
    confeti: $('#confeti'),
    btnOtraVez: $('#btn-otra-vez'),
    btnVerPergaminos: $('#btn-ver-pergaminos'),
    btnCerrarVictoria: $('#btn-cerrar-victoria'),

    btnConfirmarSi: $('#btn-confirmar-si'),
    btnConfirmarNo: $('#btn-confirmar-no'),

    toasts: $('#toasts'),

    adminUrl: $('#admin-url'),
    btnGenerar: $('#btn-generar'),
    btnImprimir: $('#btn-imprimir'),
    adminEstado: $('#admin-estado'),
    qrMaestro: $('#qr-maestro'),
    qrMaestroUrl: $('#qr-maestro-url'),
    qrGrid: $('#qr-grid')
  };

  /* ---------- Estado ---------- */

  let estado = estadoNuevo();
  let almacenOk = true;
  let seleccion = null;
  let lanzando = false;
  let pergaminoActual = null;
  let pergaminoModo = 'nuevo';
  let imagenesOk = true;

  function estadoNuevo() {
    return {
      v: 1,
      iniciado: false,
      cola: [],
      ronda: 0,
      fase: 'inicio',
      recolectados: [],
      pendiente: null,
      colocadas: {},
      bloqueadas: [],
      terminado: false,
      sonido: true
    };
  }

  const esEscalon = (n) => Number.isInteger(n) && n >= 1 && n <= ETAPAS;
  const esSlot = (n) => Number.isInteger(n) && n >= 0 && n < ETAPAS;

  function barajarLista(lista) {
    const a = lista.slice();
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  function barajarEscalones() {
    const a = [];
    for (let n = 1; n <= ETAPAS; n += 1) a.push(n);
    return barajarLista(a);
  }

  function faltantesDe(recolectados) {
    const faltan = [];
    for (let n = 1; n <= ETAPAS; n += 1) {
      if (!recolectados.includes(n)) faltan.push(n);
    }
    return faltan;
  }

  function normalizar(obj) {
    const e = Object.assign(estadoNuevo(), obj);
    e.v = 1;
    e.iniciado = obj.iniciado === true;
    e.sonido = obj.sonido !== false;
    e.recolectados = unicos(obj.recolectados).filter(esEscalon);

    e.colocadas = {};
    if (obj.colocadas && typeof obj.colocadas === 'object') {
      Object.keys(obj.colocadas).forEach((clave) => {
        const slot = Number(clave);
        const pieza = Number(obj.colocadas[clave]);
        if (esSlot(slot) && esEscalon(pieza) && e.recolectados.includes(pieza)) {
          e.colocadas[slot] = pieza;
        }
      });
    }

    const usadas = new Set();
    Object.keys(e.colocadas).forEach((clave) => {
      const pieza = e.colocadas[clave];
      if (usadas.has(pieza)) delete e.colocadas[clave];
      else usadas.add(pieza);
    });

    e.bloqueadas = unicos(obj.bloqueadas).filter(
      (slot) => esSlot(slot) && e.colocadas[slot] === slot + 1
    );
    for (let slot = 0; slot < ETAPAS; slot += 1) {
      if (e.colocadas[slot] === slot + 1 && !e.bloqueadas.includes(slot)) e.bloqueadas.push(slot);
    }

    if (!e.iniciado) {
      e.cola = [];
      e.ronda = 0;
      e.fase = 'inicio';
      e.pendiente = null;
      e.terminado = false;
      return e;
    }

    const colaValida =
      Array.isArray(obj.cola) &&
      obj.cola.length === ETAPAS &&
      new Set(obj.cola).size === ETAPAS &&
      obj.cola.every(esEscalon);

    if (!colaValida) {
      e.cola = e.recolectados.concat(barajarLista(faltantesDe(e.recolectados)));
    } else {
      e.cola = obj.cola.map(Number);
    }

    e.ronda = Math.min(e.recolectados.length, ETAPAS);

    // Si la cola guardada no coincide con lo recolectado (por ejemplo, tras una
    // edición manual del almacenamiento), el escalón actual ya estaría recogido.
    // Reconstruimos la ruta: lo recogido primero y el resto barajado.
    if (e.ronda < ETAPAS && e.recolectados.includes(e.cola[e.ronda])) {
      e.cola = e.recolectados.concat(barajarLista(faltantesDe(e.recolectados)));
    }

    if (e.bloqueadas.length >= ETAPAS) {
      e.terminado = true;
      e.fase = 'victoria';
      e.ronda = ETAPAS;
      e.pendiente = null;
    } else if (e.recolectados.length >= ETAPAS) {
      e.terminado = false;
      e.fase = 'armar';
      e.ronda = ETAPAS;
      e.pendiente = null;
    } else if (
      Number(obj.pendiente) === e.cola[e.ronda] &&
      esEscalon(Number(obj.pendiente)) &&
      !e.recolectados.includes(Number(obj.pendiente))
    ) {
      e.terminado = false;
      e.pendiente = Number(obj.pendiente);
      e.fase = 'pendiente';
    } else if (obj.fase === 'buscar' && esEscalon(e.cola[e.ronda]) && !e.recolectados.includes(e.cola[e.ronda])) {
      e.terminado = false;
      e.pendiente = null;
      e.fase = 'buscar';
    } else {
      e.terminado = false;
      e.pendiente = null;
      e.fase = 'tirar';
    }

    return e;
  }

  function unicos(lista) {
    return Array.isArray(lista) ? Array.from(new Set(lista.map(Number))) : [];
  }

  function cargarEstado() {
    let crudo = null;
    try {
      crudo = window.localStorage.getItem(CLAVE);
    } catch (e) {
      almacenOk = false;
    }
    if (!crudo) return estadoNuevo();
    try {
      const obj = JSON.parse(crudo);
      if (!obj || obj.v !== 1) return estadoNuevo();
      return normalizar(obj);
    } catch (e) {
      return estadoNuevo();
    }
  }

  function guardar() {
    try {
      window.localStorage.setItem(CLAVE, JSON.stringify(estado));
    } catch (e) {
      if (almacenOk) {
        almacenOk = false;
        toast('Este navegador no guarda la partida. El avance dura mientras la pestaña siga abierta.', 'error');
      }
    }
  }

  function borrarPartida() {
    try {
      window.localStorage.removeItem(CLAVE);
    } catch (e) {
      /* el estado en memoria se reinicia igual */
    }
  }

  function iniciarPartida() {
    borrarPartida();
    const sonidoActivo = estado.sonido;
    estado = estadoNuevo();
    estado.iniciado = true;
    estado.fase = 'tirar';
    estado.cola = barajarEscalones();
    estado.sonido = sonidoActivo;
    seleccion = null;
    guardar();
    render();
    mostrarVista('juego');
    toast('Tu recorrido está listo. Lanza el dado.', 'exito');
    hablar('Tu recorrido está listo, explorador. Lanza el dado para saber a qué escalón ir.');
  }

  let motivoConfirmacion = 'reiniciar';

  function abrirConfirmacion(motivo) {
    motivoConfirmacion = motivo;
    const esNueva = motivo === 'nueva';
    $('#confirmar-titulo').textContent = esNueva ? '¿Empezar una búsqueda nueva?' : '¿Reiniciar la partida?';
    $('#confirmar-texto').textContent = esNueva
      ? 'Se borrarán los pergaminos y las piezas de la partida actual en este dispositivo. Empezarás con un recorrido nuevo.'
      : 'Se borrarán los pergaminos y las piezas guardadas en este dispositivo. No se puede deshacer.';
    el.btnConfirmarSi.textContent = esNueva ? 'Sí, empezar de nuevo' : 'Sí, borrar todo';
    abrirModal('confirmar');
  }

  function confirmarBorrado() {
    const accion = motivoConfirmacion;
    motivoConfirmacion = 'reiniciar';
    cerrarModal('confirmar');
    if (accion === 'nueva') {
      iniciarPartida();
      return;
    }
    reiniciarTotal();
  }

  function reiniciarTotal() {
    borrarPartida();
    estado = estadoNuevo();
    seleccion = null;
    cerrarModal('confirmar');
    render();
    mostrarVista('inicio');
    toast('Partida borrada. Lista para el siguiente explorador.');
  }

  /* ---------- Rutas e imágenes ---------- */

  function rutaCon(plantilla, n) {
    return plantilla.replace('{n}', String(n));
  }

  function usarReal() {
    return DATA.usarImagenesReales === true && imagenesOk;
  }

  function verificarImagenes() {
    if (DATA.usarImagenesReales !== true) return Promise.resolve();
    const rutas = [];
    for (let n = 1; n <= ETAPAS; n += 1) {
      rutas.push(rutaCon(DATA.rutas.frente, n));
      rutas.push(rutaCon(DATA.rutas.espalda, n));
    }
    return Promise.all(
      rutas.map(
        (ruta) =>
          new Promise((resolver) => {
            const img = new Image();
            img.onload = () => resolver(true);
            img.onerror = () => resolver(false);
            img.src = ruta;
          })
      )
    ).then((resultados) => {
      imagenesOk = resultados.every(Boolean);
      if (!imagenesOk) {
        toast('Faltan imágenes en assets. Mientras tanto se muestran los diseños de prueba.', 'error');
        render();
      }
    });
  }

  /* ---------- Vistas ---------- */

  const VISTAS = ['inicio', 'juego', 'tablero', 'pergaminos', 'admin'];
  const VISTAS_CON_NAV = ['juego', 'tablero', 'pergaminos'];

  function mostrarVista(nombre) {
    if (!VISTAS.includes(nombre)) nombre = 'inicio';
    VISTAS.forEach((vista) => {
      const seccion = document.getElementById('vista-' + vista);
      if (!seccion) return;
      const activa = vista === nombre;
      seccion.hidden = !activa;
      seccion.classList.toggle('is-activa', activa);
    });

    document.body.classList.toggle('modo-admin', nombre === 'admin');
    document.body.classList.toggle('con-nav', VISTAS_CON_NAV.includes(nombre));
    el.nav.hidden = !VISTAS_CON_NAV.includes(nombre);

    $$('.nav-btn', el.nav).forEach((btn) => {
      if (btn.dataset.ir === nombre) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });

    if (nombre !== 'tablero') seleccion = null;
    if (nombre === 'admin') generarQRs();
    montarAvatar(nombre);

    window.scrollTo({ top: 0, behavior: REDUCIDO ? 'auto' : 'smooth' });
  }

  /* ---------- Render ---------- */

  function objetivoActual() {
    if (estado.fase === 'buscar' || estado.fase === 'pendiente') {
      const n = estado.cola[estado.ronda];
      return esEscalon(n) ? n : null;
    }
    return null;
  }

  function render() {
    renderInicio();
    renderJuego();
    renderTablero();
    renderColeccion();
    sincronizarSonido();
  }

  function renderInicio() {
    const enCurso = estado.iniciado && !estado.terminado;
    const terminado = estado.terminado;
    const hayPartida = enCurso || terminado;

    el.btnContinuar.hidden = !hayPartida;
    el.btnIniciar.classList.toggle('btn--primario', !hayPartida);
    el.btnIniciar.classList.toggle('btn--secundario', hayPartida);
    el.btnContinuar.classList.toggle('btn--primario', hayPartida);
    el.btnContinuar.classList.toggle('btn--secundario', !hayPartida);

    if (enCurso) {
      el.continuarEtiqueta.textContent = 'Continuar la búsqueda';
      el.continuarDetalle.textContent =
        estado.recolectados.length + ' de ' + ETAPAS + ' pergaminos';
    } else if (terminado) {
      el.continuarEtiqueta.textContent = 'Ver mi mural';
      el.continuarDetalle.textContent = 'Rompecabezas completo';
    }

    el.btnIniciar.textContent = hayPartida ? 'Empezar una búsqueda nueva' : 'Iniciar juego';
    el.btnReiniciar.hidden = !estado.iniciado;

    if (el.guiaInicioTexto) {
      if (enCurso) {
        el.guiaInicioTexto.textContent =
          DATA.guia.regreso + ' Llevas ' + estado.recolectados.length + ' de ' + ETAPAS + ' pergaminos.';
      } else if (terminado) {
        el.guiaInicioTexto.textContent = DATA.guia.completo;
      } else {
        el.guiaInicioTexto.textContent = DATA.guia.bienvenida;
      }
    }
  }

  function renderJuego() {
    const objetivo = objetivoActual();

    el.progreso.innerHTML = '';
    for (let n = 1; n <= ETAPAS; n += 1) {
      const item = document.createElement('li');
      item.className = 'progreso__item';
      if (estado.recolectados.includes(n)) item.classList.add('is-encontrado');
      if (objetivo === n) item.classList.add('is-actual');
      item.textContent = String(n);
      item.setAttribute('aria-label', estado.recolectados.includes(n) ? 'Escalón ' + n + ' encontrado' : 'Escalón ' + n + ' pendiente');
      el.progreso.appendChild(item);
    }

    const enMarcha = estado.fase === 'buscar' || estado.fase === 'pendiente';
    el.panelObjetivo.hidden = !enMarcha;
    el.btnLanzar.hidden = estado.fase !== 'tirar';
    el.btnLanzar.disabled = estado.fase !== 'tirar' || lanzando;

    if (objetivo) {
      el.objetivoNumero.textContent = String(objetivo);
      el.btnEscanear.textContent = 'Escanear el QR del escalón ' + objetivo;
      el.btnEscanear.disabled = estado.fase !== 'buscar';
      el.btnEscanear.hidden = estado.fase === 'pendiente';
    }

    el.avisoPendiente.hidden = estado.fase !== 'pendiente';
    el.avisoArmar.hidden = estado.fase !== 'armar';

    if (estado.fase === 'inicio') {
      el.dadoEstado.textContent = 'Lanza el dado para saber a qué escalón ir.';
    } else if (estado.fase === 'tirar') {
      el.dadoEstado.textContent = 'Lanza el dado para saber a qué escalón ir.';
    } else if (estado.fase === 'buscar' && objetivo) {
      el.dadoEstado.innerHTML = 'Ve al <strong>escalón ' + objetivo + '</strong> y escanea su QR.';
    } else if (estado.fase === 'pendiente' && objetivo) {
      el.dadoEstado.textContent = 'Guarda el pergamino del escalón ' + objetivo + ' para continuar.';
    } else if (estado.fase === 'armar') {
      el.dadoEstado.textContent = 'Ya tienes los nueve pergaminos. Arma el rompecabezas.';
    } else if (estado.fase === 'victoria') {
      el.dadoEstado.textContent = 'Museo completado. Buen trabajo, explorador.';
    }

    renderDado();
  }

  let paradasCreadas = false;

  function crearParadas() {
    if (paradasCreadas) return;
    paradasCreadas = true;
    const fragmento = document.createDocumentFragment();
    for (let n = 1; n <= ETAPAS; n += 1) {
      const parada = document.createElement('div');
      parada.className = 'dado__parada';
      parada.style.setProperty('--ang', (n - 1) * 40 + 'deg');
      parada.dataset.parada = String(n);
      const cara = document.createElement('span');
      cara.className = 'dado__cara';
      cara.textContent = String(n);
      parada.appendChild(cara);
      fragmento.appendChild(parada);
    }
    el.dadoParadas.appendChild(fragmento);
  }

  function renderDado() {
    const n = objetivoActual() || (estado.fase === 'armar' || estado.fase === 'victoria' ? estado.cola[ETAPAS - 1] : null);

    if (n && esEscalon(n)) {
      el.dadoNumero.textContent = String(n);
      el.dado.style.setProperty('--apunta', (n - 1) * 40 + 'deg');
      if (!el.dado.classList.contains('is-girando')) el.dado.classList.add('is-quieto');
      marcarParada(n);
    } else {
      el.dadoNumero.textContent = '?';
      el.dado.classList.remove('is-quieto');
      el.dado.style.setProperty('--apunta', '0deg');
      marcarParada(null);
    }
  }

  function marcarParada(n) {
    $$('.dado__parada', el.dadoParadas).forEach((parada) => {
      parada.classList.toggle('is-elegido', Number(parada.dataset.parada) === n);
    });
  }

  function destelloAleatorio() {
    const paradas = $$('.dado__parada', el.dadoParadas);
    const parada = paradas[Math.floor(Math.random() * paradas.length)];
    if (!parada) return;
    parada.classList.add('is-destello');
    window.setTimeout(() => parada.classList.remove('is-destello'), 70);
  }

  /* ---------- Piezas ---------- */

  function htmlPieza(id) {
    if (usarReal()) {
      return (
        '<span class="pieza pieza--real" style="background-image:url(\'' +
        rutaCon(DATA.rutas.frente, id) +
        '\')" aria-hidden="true"></span>'
      );
    }
    const col = (id - 1) % 3;
    const fila = Math.floor((id - 1) / 3);
    return (
      '<span class="pieza" style="--col:' + col + ';--fila:' + fila + '" aria-hidden="true">' +
      '<svg class="pieza__mural" viewBox="0 0 900 900" aria-hidden="true" focusable="false"><use href="#mural"/></svg>' +
      '<span class="pieza__num">' + id + '</span>' +
      '</span>'
    );
  }

  function piezasColocadas() {
    return Object.keys(estado.colocadas).map((clave) => estado.colocadas[clave]);
  }

  function piezasDisponibles() {
    const puestas = piezasColocadas();
    return estado.recolectados.filter((id) => !puestas.includes(id));
  }

  function renderTablero() {
    const celdas = [];
    for (let slot = 0; slot < ETAPAS; slot += 1) {
      const pieza = estado.colocadas[slot];
      const fijada = estado.bloqueadas.includes(slot);
      const clases = ['casilla'];
      if (pieza) clases.push('is-ocupada');
      if (fijada) clases.push('is-fijada');

      let etiqueta = 'Casilla ' + (slot + 1) + ': vacía';
      if (pieza) {
        etiqueta = 'Casilla ' + (slot + 1) + ': pieza ' + pieza + (fijada ? ', en su sitio' : ', sin fijar');
      }

      const contenido = pieza ? htmlPieza(pieza) : usarReal() ? '' : '<span class="casilla__num">' + (slot + 1) + '</span>';

      celdas.push(
        '<button type="button" class="' + clases.join(' ') + '" data-casilla="' + slot + '" aria-label="' + etiqueta + '"' +
        (fijada ? ' aria-disabled="true"' : '') + '>' + contenido + '</button>'
      );
    }
    el.tablero.innerHTML = celdas.join('');
    el.tablero.classList.toggle('is-completo', estado.terminado);
    el.tableroCuenta.textContent = estado.bloqueadas.length + ' de ' + ETAPAS + ' piezas en su sitio';

    const disponibles = piezasDisponibles();
    el.inventario.innerHTML = disponibles
      .map(
        (id) =>
          '<button type="button" class="pieza-boton' + (seleccion === id ? ' is-elegida' : '') + '" data-pieza="' + id +
          '" aria-pressed="' + (seleccion === id) + '" aria-label="Pieza ' + id + '"><span class="pieza-boton__visual">' +
          htmlPieza(id) + '</span></button>'
      )
      .join('');

    if (estado.recolectados.length === 0) {
      el.inventarioVacio.hidden = false;
      el.inventarioVacio.textContent = 'Todavía no tienes piezas. Escanea el QR de un escalón para conseguir la primera.';
    } else if (disponibles.length === 0) {
      el.inventarioVacio.hidden = false;
      el.inventarioVacio.textContent = 'Todas tus piezas están en el tablero.';
    } else {
      el.inventarioVacio.hidden = true;
    }

    el.btnVictoriaFinal.hidden = !estado.terminado;

    if (el.guiaTableroTexto) {
      if (estado.terminado) el.guiaTableroTexto.textContent = DATA.guia.tableroCompleto;
      else if (estado.recolectados.length === 0) el.guiaTableroTexto.textContent = DATA.guia.tableroVacio;
      else el.guiaTableroTexto.textContent = DATA.guia.tablero;
    }
  }

  function renderColeccion() {
    el.coleccionCuenta.textContent = estado.recolectados.length + ' de ' + ETAPAS + ' pergaminos reunidos';
    el.coleccionVacio.hidden = estado.recolectados.length > 0;

    const fichas = [];
    for (let id = 1; id <= ETAPAS; id += 1) {
      if (estado.recolectados.includes(id)) {
        fichas.push(
          '<button type="button" class="coleccion__item" data-pergamino="' + id + '" aria-label="Abrir el pergamino del escalón ' + id + '">' +
          '<span class="coleccion__visual">' + htmlPieza(id) + '</span>' +
          '<span class="marca-ok"><svg class="icono" aria-hidden="true"><use href="#i-check"/></svg></span>' +
          '<span class="coleccion__nombre">Escalón ' + id + '</span>' +
          '</button>'
        );
      } else {
        fichas.push(
          '<div class="coleccion__item is-bloqueado">' +
          '<span class="coleccion__visual"><svg class="icono" aria-hidden="true"><use href="#i-lock"/></svg></span>' +
          '<span class="coleccion__nombre">Escalón ' + id + '</span>' +
          '</div>'
        );
      }
    }
    el.coleccion.innerHTML = fichas.join('');

    if (el.guiaPergaminosTexto) {
      el.guiaPergaminosTexto.textContent = estado.recolectados.length
        ? DATA.guia.pergaminos
        : DATA.guia.pergaminosVacio;
    }
  }

  /* ---------- Dado ---------- */

  function vibrar(patron) {
    if (typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(patron);
      } catch (e) {
        /* sin vibración disponible */
      }
    }
  }

  function lanzarDado() {
    if (lanzando || estado.fase !== 'tirar') return;
    const n = estado.cola[estado.ronda];
    if (!esEscalon(n)) return;

    lanzando = true;
    el.btnLanzar.disabled = true;
    el.dado.classList.remove('is-quieto');
    el.dado.classList.add('is-girando');
    reproducir('dado');
    vibrar([25, 40, 25]);

    const duracion = REDUCIDO ? 160 : 900;
    const inicio = performance.now();
    const intervalo = window.setInterval(() => {
      destelloAleatorio();
      if (performance.now() - inicio > duracion - 140) window.clearInterval(intervalo);
    }, 80);

    window.setTimeout(() => {
      window.clearInterval(intervalo);
      el.dado.classList.remove('is-girando');
      el.dado.classList.add('is-quieto');
      el.dado.style.setProperty('--apunta', (n - 1) * 40 + 'deg');
      el.dadoNumero.textContent = String(n);
      marcarParada(n);
      vibrar([40, 60, 80]);
      estado.fase = 'buscar';
      lanzando = false;
      guardar();
      renderJuego();
      const frase = '¡Te salió el ' + n + '! Ve al escalón ' + n + ' y escanea su código.';
      anunciar(frase);
      hablar(frase);
      window.setTimeout(() => {
        el.panelObjetivo.scrollIntoView({
          behavior: REDUCIDO ? 'auto' : 'smooth',
          block: 'center'
        });
      }, 90);
    }, duracion);
  }

  /* ---------- Escáner ---------- */

  const cargas = new Map();
  let escaner = null;
  let escanerAbierto = false;
  let procesandoLectura = false;
  let camaraCargando = false;

  function cargarScript(src, global) {
    if (window[global]) return Promise.resolve();
    if (cargas.has(src)) return cargas.get(src);
    const promesa = new Promise((resolver, rechazar) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        if (window[global]) resolver();
        else rechazar(new Error('La librería no quedó disponible.'));
      };
      script.onerror = () => rechazar(new Error('No se pudo descargar la librería.'));
      document.head.appendChild(script);
    }).catch((error) => {
      cargas.delete(src);
      throw error;
    });
    cargas.set(src, promesa);
    return promesa;
  }

  async function cargarLibreria(fuentes, global) {
    let ultimoError = null;
    for (const src of fuentes) {
      try {
        await cargarScript(src, global);
        return;
      } catch (error) {
        ultimoError = error;
      }
    }
    throw ultimoError || new Error('No se pudo descargar la librería.');
  }

  async function abrirEscaner() {
    const objetivo = objetivoActual();
    if (!objetivo) return;
    if (estado.fase !== 'buscar') return;

    escanerAbierto = true;
    limpiarErrorEscaner();
    el.escanerInstruccion.textContent = 'Apunta la cámara al QR del escalón ' + objetivo + '.';
    el.escanerCargando.hidden = false;
    el.escanerCargando.textContent = 'Preparando la cámara...';
    el.btnReintentar.hidden = true;
    el.escanerMarco.classList.remove('is-apagado');
    abrirModal('escaner', {
      alCerrar: () => {
        escanerAbierto = false;
        detenerCamara();
      }
    });
    await iniciarCamara();
  }

  async function iniciarCamara() {
    if (camaraCargando) return;
    camaraCargando = true;
    try {
      await iniciarCamaraInterna();
    } finally {
      camaraCargando = false;
    }
  }

  async function iniciarCamaraInterna() {
    limpiarErrorEscaner();
    el.escanerCargando.hidden = false;
    el.escanerCargando.textContent = 'Preparando la cámara...';
    el.btnReintentar.hidden = true;

    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      mostrarErrorEscaner(
        window.location.protocol === 'file:'
          ? 'La cámara necesita abrirse desde HTTPS o localhost. Usa el modo prueba con ?debug=1.'
          : 'Este navegador no puede abrir la cámara. Usa el modo prueba con ?debug=1.'
      );
      return;
    }

    try {
      await cargarLibreria([URL_ESCANER, URL_ESCANER_ALT], 'Html5Qrcode');
    } catch (error) {
      mostrarErrorEscaner('No pudimos cargar el escáner. Revisa la conexión y vuelve a intentarlo.');
      return;
    }

    if (!escanerAbierto) return;

    try {
      escaner = new window.Html5Qrcode('qr-lector', { verbose: false });
      await escaner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: (ancho, alto) => {
            const lado = Math.round(Math.min(ancho, alto) * 0.72);
            return { width: lado, height: lado };
          },
          aspectRatio: 1,
          experimentalFeatures: { useBarCodeDetectorIfSupported: true }
        },
        alLeerCodigo,
        () => {}
      );

      if (!escanerAbierto) {
        await detenerCamara();
        return;
      }

      el.escanerCargando.hidden = true;
      el.escanerMarco.classList.remove('is-apagado');
      reproducir('camara');
    } catch (error) {
      mostrarErrorEscaner(mensajeCamara(error));
    }
  }

  async function detenerCamara() {
    if (!escaner) return;
    const instancia = escaner;
    escaner = null;
    try {
      await instancia.stop();
    } catch (error) {
      /* ya estaba detenida */
    }
    try {
      instancia.clear();
    } catch (error) {
      /* sin nada que limpiar */
    }
  }

  async function alLeerCodigo(texto) {
    if (procesandoLectura) return;
    procesandoLectura = true;
    vibrar(60);
    await detenerCamara();
    validarCodigo(texto);
    procesandoLectura = false;
  }

  function validarCodigo(texto) {
    const objetivo = objetivoActual();
    if (!objetivo) {
      mostrarErrorEscaner('La partida no tiene un escalón pendiente. Vuelve al dado.');
      return;
    }

    const patron = new RegExp('^' + DATA.prefijoQR + '([1-9])$');
    const resultado = patron.exec(String(texto).trim());

    if (!resultado) {
      reproducir('error');
      mostrarErrorEscaner('Ese código no pertenece a esta búsqueda. Busca un QR que diga ' + DATA.prefijoQR + objetivo + '.');
      return;
    }

    const escaneado = Number(resultado[1]);

    if (escaneado !== objetivo) {
      reproducir('error');
      mostrarErrorEscaner(
        'Ese es el escalón ' + escaneado + '. Tu dado te manda al escalón ' + objetivo + '. Búscalo un poco más allá.'
      );
      return;
    }

    if (estado.recolectados.includes(escaneado)) {
      mostrarErrorEscaner('Ya tienes el pergamino del escalón ' + escaneado + '. Lanza el dado para seguir.');
      return;
    }

    cerrarModal('escaner');
    estado.pendiente = escaneado;
    estado.fase = 'pendiente';
    guardar();
    render();
    abrirPergamino(escaneado, 'nuevo');
  }

  function mensajeCamara(error) {
    const nombre = String((error && (error.name || error.message)) || error || '');
    if (/NotAllowed|Permission|Security/i.test(nombre)) {
      return 'No tenemos permiso para usar la cámara. Actívalo en los ajustes del navegador y vuelve a intentarlo.';
    }
    if (/NotFound|Overconstrained|DevicesNotFound/i.test(nombre)) {
      return 'No encontramos una cámara en este dispositivo.';
    }
    if (/NotReadable|TrackStart/i.test(nombre)) {
      return 'Otra aplicación está usando la cámara. Ciérrala y vuelve a intentarlo.';
    }
    return 'No pudimos abrir la cámara. Revisa los permisos o usa el modo prueba con ?debug=1.';
  }

  function mostrarErrorEscaner(mensaje) {
    el.escanerError.textContent = mensaje;
    el.escanerError.hidden = false;
    el.escanerCargando.hidden = true;
    el.btnReintentar.hidden = false;
    el.escanerMarco.classList.add('is-apagado');
    hablar(mensaje, { avisar: true });
  }

  function limpiarErrorEscaner() {
    el.escanerError.hidden = true;
    el.escanerError.textContent = '';
    el.escanerMarco.classList.remove('is-apagado');
  }

  /* ---------- Pergamino ---------- */

  function abrirPergamino(id, modo) {
    const datos = DATA.pergaminos.find((p) => p.id === id);
    if (!datos) return;

    pergaminoActual = id;
    pergaminoModo = modo;

    el.pergaminoTitulo.textContent = datos.titulo;
    el.pergaminoSubtitulo.textContent = datos.titulo;
    el.pergaminoDato.textContent = datos.dato;
    el.pergaminoPrueba.hidden = !datos.esPlaceholder;
    el.pergaminoPrueba.textContent = DATA.etiquetaPlaceholder;
    el.pergaminoVisual.innerHTML = htmlPieza(id);

    if (el.pergaminoReverso) {
      if (usarReal()) {
        el.pergaminoReverso.style.setProperty(
          '--espalda',
          "url('" + rutaCon(DATA.rutas.espalda, id) + "')"
        );
        el.pergaminoReverso.classList.add('pergamino--real');
      } else {
        el.pergaminoReverso.style.removeProperty('--espalda');
        el.pergaminoReverso.classList.remove('pergamino--real');
      }
    }

    el.flip.classList.remove('is-volteado');
    el.flip.setAttribute('aria-pressed', 'false');
    el.btnGirar.textContent = 'Ver la espalda';

    const esNuevo = modo === 'nuevo';
    el.btnGuardar.hidden = !esNuevo;
    el.pergaminoAyuda.hidden = !esNuevo;

    abrirModal('pergamino');

    const voz = datos.esPlaceholder ? DATA.guia.datoEnPrueba : datos.dato;
    hablar('Escalón ' + id + '. ' + voz);
  }

  function girarPergamino() {
    const volteado = el.flip.classList.toggle('is-volteado');
    el.flip.setAttribute('aria-pressed', String(volteado));
    el.btnGirar.textContent = volteado ? 'Ver el frente' : 'Ver la espalda';
    reproducir('papel');
  }

  function guardarPergamino() {
    const n = estado.pendiente;
    if (!n || pergaminoModo !== 'nuevo') return;

    if (!estado.recolectados.includes(n)) estado.recolectados.push(n);
    estado.recolectados.sort((a, b) => a - b);
    estado.pendiente = null;
    estado.ronda = Math.min(estado.ronda + 1, ETAPAS);

    if (estado.ronda >= ETAPAS) {
      estado.fase = 'armar';
    } else {
      estado.fase = 'tirar';
    }

    guardar();
    reproducir('guardar');
    vibrar(35);
    cerrarModal('pergamino');
    render();
    window.scrollTo({ top: 0, behavior: REDUCIDO ? 'auto' : 'smooth' });

    const mensaje =
      estado.fase === 'armar'
        ? 'Pergamino ' + n + ' guardado. Reuniste los nueve: ahora arma el rompecabezas.'
        : 'Pergamino ' + n + ' guardado. Ya puedes lanzar el dado otra vez.';

    anunciar(mensaje);
    toast(mensaje, 'exito');
    hablar(mensaje);
  }

  /* ---------- Tablero ---------- */

  function elegirPieza(id) {
    if (estado.terminado) return;
    seleccion = seleccion === id ? null : id;
    renderTableroConFoco('#inventario [data-pieza="' + id + '"]');
    const mensaje = seleccion
      ? 'Pieza ' + id + ' elegida. Toca una casilla del tablero.'
      : 'Pieza ' + id + ' guardada en el morral.';
    decirTablero(mensaje);
  }

  function tocarCasilla(slot) {
    if (estado.terminado) return;

    if (estado.bloqueadas.includes(slot)) {
      reproducir('error');
      toast('Esa pieza ya está en su sitio y no se mueve.');
      decirTablero('Esa pieza ya está en su sitio y no se mueve.');
      return;
    }

    const ocupante = estado.colocadas[slot];

    if (seleccion === null) {
      if (!ocupante) {
        toast('Primero toca una pieza de tu morral.');
        decirTablero('Primero toca una pieza de tu morral.');
        return;
      }
      delete estado.colocadas[slot];
      seleccion = ocupante;
      guardar();
      renderTableroConFoco('#inventario [data-pieza="' + ocupante + '"]');
      decirTablero('Pieza ' + ocupante + ' recogida. Toca otra casilla para colocarla.');
      return;
    }

    const pieza = seleccion;
    seleccion = null;
    if (ocupante) delete estado.colocadas[slot];
    estado.colocadas[slot] = pieza;

    const acierto = pieza === slot + 1;
    if (acierto) {
      estado.bloqueadas.push(slot);
      reproducir('acierto');
      vibrar([30, 45, 70]);
    } else {
      reproducir('error');
    }

    guardar();
    renderTableroConFoco('#tablero [data-casilla="' + slot + '"]');

    const casilla = $('#tablero [data-casilla="' + slot + '"]');
    if (casilla) {
      casilla.classList.add(acierto ? 'is-acierto' : 'is-error');
      window.setTimeout(() => casilla.classList.remove('is-acierto', 'is-error'), 700);
    }

    if (acierto) {
      decirTablero('Pieza ' + pieza + ' en su sitio.');
      if (estado.bloqueadas.length >= ETAPAS) window.setTimeout(celebrar, 720);
    } else {
      decirTablero('La pieza ' + pieza + ' no va en la casilla ' + (slot + 1) + '.');
      toast('Esa pieza todavía no va en esa casilla. Prueba en otra.');
    }
  }

  function renderTableroConFoco(selector) {
    const activo = document.activeElement;
    const estabaDentro = !!(activo && activo.closest && activo.closest('#vista-tablero'));
    renderTablero();
    if (!estabaDentro) return;
    const destino =
      $(selector) ||
      $('#inventario [data-pieza]') ||
      $('#tablero [data-casilla]');
    if (destino) destino.focus({ preventScroll: true });
  }

  function celebrar() {
    estado.terminado = true;
    estado.fase = 'victoria';
    estado.ronda = ETAPAS;
    guardar();
    render();
    abrirVictoria();
  }

  function abrirVictoria() {
    el.victoriaMensaje.textContent = DATA.mensajeFinal;
    el.victoriaResumen.textContent = ETAPAS + ' escalones, ' + ETAPAS + ' pergaminos y el museo completo.';
    abrirModal('victoria');
    reproducir('victoria');
    lanzarConfeti();
    hablar(DATA.mensajeFinal);
  }

  /* ---------- Confeti ---------- */

  let confetiFrame = null;

  function lanzarConfeti() {
    if (REDUCIDO || !el.confeti) return;
    const lienzo = el.confeti;
    const ctx = lienzo.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const ancho = lienzo.clientWidth || window.innerWidth;
    const alto = lienzo.clientHeight || window.innerHeight;
    lienzo.width = Math.max(1, Math.round(ancho * dpr));
    lienzo.height = Math.max(1, Math.round(alto * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, ancho, alto);

    const colores = ['#D4AF37', '#F4EBD0', '#2E7D32', '#E9CB63', '#A8862A'];
    const piezas = [];
    for (let i = 0; i < 130; i += 1) {
      piezas.push({
        x: Math.random() * ancho,
        y: -20 - Math.random() * alto * 0.6,
        vx: (Math.random() - 0.5) * 1.6,
        vy: 1.6 + Math.random() * 2.6,
        ancho: 5 + Math.random() * 6,
        alto: 8 + Math.random() * 8,
        giro: Math.random() * Math.PI * 2,
        velocidadGiro: (Math.random() - 0.5) * 0.18,
        color: colores[Math.floor(Math.random() * colores.length)],
        forma: Math.random() > 0.35 ? 'rect' : 'circulo'
      });
    }

    const inicio = performance.now();
    if (confetiFrame) cancelAnimationFrame(confetiFrame);

    function pintar(ahora) {
      const transcurrido = ahora - inicio;
      ctx.clearRect(0, 0, ancho, alto);

      piezas.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.035;
        p.vx *= 0.998;
        p.giro += p.velocidadGiro;

        if (p.y > alto + 30) {
          p.y = -20;
          p.x = Math.random() * ancho;
          p.vy = 1.6 + Math.random() * 2.2;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.giro);
        ctx.globalAlpha = transcurrido > 5200 ? Math.max(0, 1 - (transcurrido - 5200) / 800) : 1;
        ctx.fillStyle = p.color;
        if (p.forma === 'rect') {
          ctx.fillRect(-p.ancho / 2, -p.alto / 2, p.ancho, p.alto);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.ancho / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      if (transcurrido < 6000) {
        confetiFrame = requestAnimationFrame(pintar);
      } else {
        ctx.clearRect(0, 0, ancho, alto);
        confetiFrame = null;
      }
    }

    confetiFrame = requestAnimationFrame(pintar);
  }

  function detenerConfeti() {
    if (confetiFrame) cancelAnimationFrame(confetiFrame);
    confetiFrame = null;
    if (el.confeti) {
      const ctx = el.confeti.getContext('2d');
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, el.confeti.width, el.confeti.height);
      }
    }
  }

  /* ---------- Sonido ---------- */

  let audioCtx = null;

  function contextoAudio() {
    const Constructor = window.AudioContext || window.webkitAudioContext;
    if (!Constructor) return null;
    if (!audioCtx) audioCtx = new Constructor();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function nota(ctx, frecuencia, cuando, duracion, volumen, tipo) {
    const osc = ctx.createOscillator();
    const ganancia = ctx.createGain();
    osc.type = tipo || 'sine';
    osc.frequency.setValueAtTime(frecuencia, cuando);
    ganancia.gain.setValueAtTime(0.0001, cuando);
    ganancia.gain.exponentialRampToValueAtTime(volumen, cuando + 0.012);
    ganancia.gain.exponentialRampToValueAtTime(0.0001, cuando + duracion);
    osc.connect(ganancia);
    ganancia.connect(ctx.destination);
    osc.start(cuando);
    osc.stop(cuando + duracion + 0.03);
  }

  function reproducir(tipo) {
    if (!estado.sonido) return;
    const ctx = contextoAudio();
    if (!ctx) return;
    const t = ctx.currentTime;

    if (tipo === 'dado') {
      nota(ctx, 180, t, 0.08, 0.05, 'triangle');
      nota(ctx, 120, t + 0.1, 0.09, 0.04, 'triangle');
      nota(ctx, 240, t + 0.24, 0.07, 0.035, 'triangle');
    } else if (tipo === 'acierto') {
      nota(ctx, 784, t, 0.16, 0.05);
      nota(ctx, 1175, t + 0.11, 0.22, 0.045);
    } else if (tipo === 'guardar') {
      nota(ctx, 587, t, 0.12, 0.045);
      nota(ctx, 880, t + 0.09, 0.18, 0.04);
    } else if (tipo === 'papel') {
      nota(ctx, 420, t, 0.06, 0.03, 'triangle');
    } else if (tipo === 'camara') {
      nota(ctx, 660, t, 0.08, 0.03);
    } else if (tipo === 'error') {
      nota(ctx, 200, t, 0.16, 0.05, 'sawtooth');
      nota(ctx, 150, t + 0.12, 0.18, 0.04, 'sawtooth');
    } else if (tipo === 'victoria') {
      [523, 659, 784, 1047].forEach((f, i) => nota(ctx, f, t + i * 0.12, 0.3, 0.045));
    }
  }

  function sincronizarSonido() {
    $$('[data-accion="sonido"]').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(estado.sonido));
      btn.setAttribute('aria-label', estado.sonido ? 'Silenciar los sonidos' : 'Activar los sonidos');
      const uso = $('use', btn);
      if (uso) uso.setAttribute('href', estado.sonido ? '#i-sonido' : '#i-silencio');
    });
  }

  function alternarSonido() {
    estado.sonido = !estado.sonido;
    guardar();
    sincronizarSonido();
    if (estado.sonido) {
      reproducir('camara');
      const globo = $('.vista.is-activa .guia');
      const texto = textoDelGlobo(globo);
      if (texto) hablar(texto);
    } else {
      detenerVoz();
    }
    toast(estado.sonido ? 'Sonidos activados.' : 'Sonidos silenciados.');
  }

  /* ---------- Voz y guía ---------- */

  const CODIGOS_VOZ = ['es-CO', 'es-419', 'es-MX', 'es-US', 'es-ES'];
  let vozElegida = null;
  let vozToken = 0;
  let vozTemporizador = null;
  let vozEspera = null;

  function vozDisponible() {
    return 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
  }

  function cargarVoces() {
    if (!vozDisponible()) return;
    const lista = window.speechSynthesis.getVoices();
    if (!lista || !lista.length) return;

    vozElegida = null;
    for (const codigo of CODIGOS_VOZ) {
      const encontrada = lista.find((voz) =>
        String(voz.lang || '').toLowerCase().startsWith(codigo.toLowerCase())
      );
      if (encontrada) {
        vozElegida = encontrada;
        return;
      }
    }
    vozElegida = lista.find((voz) => /^es/i.test(String(voz.lang || ''))) || null;
  }

  if (vozDisponible()) {
    cargarVoces();
    window.speechSynthesis.onvoiceschanged = cargarVoces;
  }

  function detenerVoz() {
    vozToken += 1;
    if (vozDisponible()) {
      try {
        window.speechSynthesis.cancel();
      } catch (error) {
        /* sin voz disponible */
      }
    }
    if (vozTemporizador) {
      window.clearTimeout(vozTemporizador);
      vozTemporizador = null;
    }
    if (vozEspera) {
      window.clearTimeout(vozEspera);
      vozEspera = null;
    }
    if (el.avatar) el.avatar.classList.remove('is-hablando');
  }

  function hablar(texto, opciones) {
    const limpio = String(texto || '').replace(/\s+/g, ' ').trim();
    if (!limpio) return;

    const ajustes = opciones || {};
    if (!vozDisponible()) {
      if (ajustes.avisar) toast('Este navegador no puede leer en voz alta.');
      return;
    }
    if (!estado.sonido && !ajustes.forzar) return;

    vozToken += 1;
    const token = vozToken;

    try {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
      }

      const frase = new window.SpeechSynthesisUtterance(limpio);
      if (vozElegida) {
        frase.voice = vozElegida;
        frase.lang = vozElegida.lang;
      } else {
        frase.lang = 'es-CO';
      }
      frase.rate = 0.94;
      frase.pitch = 1.04;
      frase.volume = 1;

      const terminar = () => {
        if (token !== vozToken) return;
        if (el.avatar) el.avatar.classList.remove('is-hablando');
        if (vozTemporizador) {
          window.clearTimeout(vozTemporizador);
          vozTemporizador = null;
        }
        if (vozEspera) {
          window.clearTimeout(vozEspera);
          vozEspera = null;
        }
      };

      let arrancada = false;
      frase.onstart = () => {
        arrancada = true;
        if (vozEspera) {
          window.clearTimeout(vozEspera);
          vozEspera = null;
        }
        if (token === vozToken && el.avatar) el.avatar.classList.add('is-hablando');
      };
      frase.onend = terminar;
      frase.onerror = terminar;

      if (el.avatar) el.avatar.classList.add('is-hablando');
      if (vozTemporizador) window.clearTimeout(vozTemporizador);
      vozTemporizador = window.setTimeout(terminar, Math.min(30000, Math.max(3000, limpio.length * 95)));

      // Si el navegador bloquea la voz automática, la boca deja de moverse.
      vozEspera = window.setTimeout(() => {
        if (vozEspera) {
          window.clearTimeout(vozEspera);
          vozEspera = null;
        }
        if (!arrancada && token === vozToken && el.avatar) el.avatar.classList.remove('is-hablando');
      }, 1300);

      window.speechSynthesis.speak(frase);
    } catch (error) {
      if (el.avatar) el.avatar.classList.remove('is-hablando');
    }
  }

  function textoDelGlobo(globo) {
    const nodo = globo ? $('[data-guia-texto]', globo) : null;
    return nodo ? String(nodo.textContent || '').replace(/\s+/g, ' ').trim() : '';
  }

  function decirTablero(mensaje) {
    if (el.guiaTableroTexto) el.guiaTableroTexto.textContent = mensaje;
    hablar(mensaje);
  }

  function repetirTexto(texto) {
    const limpio = String(texto || '').replace(/\s+/g, ' ').trim();
    if (!limpio) return;
    if (!vozDisponible()) {
      toast('Este navegador no puede leer en voz alta.');
      return;
    }
    if (!estado.sonido) {
      estado.sonido = true;
      guardar();
      sincronizarSonido();
      toast('Sonidos activados.');
    }
    hablar(limpio, { forzar: true });
  }

  function repetirPergamino() {
    if (!pergaminoActual) return;
    const datos = DATA.pergaminos.find((p) => p.id === pergaminoActual);
    if (!datos) return;
    const voz = datos.esPlaceholder ? DATA.guia.datoEnPrueba : datos.dato;
    repetirTexto('Escalón ' + pergaminoActual + '. ' + voz);
  }

  function repetirVictoria() {
    repetirTexto(DATA.mensajeFinal);
  }

  function montarAvatar(vista) {
    if (!el.avatar) return;
    const seccion = document.getElementById('vista-' + vista);
    const hueco = seccion ? $('[data-guia-hueco]', seccion) : null;
    if (!hueco) return;
    if (el.avatar.parentElement !== hueco) hueco.appendChild(el.avatar);
  }

  /* ---------- Modales y avisos ---------- */

  let ultimoFoco = null;
  let modalActivo = null;

  const FOCALIZABLES =
    'button:not([disabled]):not([hidden]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function abrirModal(nombre, opciones) {
    const modal = document.getElementById('modal-' + nombre);
    if (!modal) return;
    ultimoFoco = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('modal-abierto');
    modalActivo = { nombre: nombre, modal: modal, alCerrar: opciones && opciones.alCerrar };
    const primero = $('[data-foco-inicial]', modal) || $(FOCALIZABLES, modal);
    if (primero) window.setTimeout(() => primero.focus({ preventScroll: true }), 40);
  }

  function cerrarModal(nombre) {
    const modal = document.getElementById('modal-' + nombre);
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    if (nombre === 'victoria') detenerConfeti();
    if (nombre === 'pergamino') {
      el.flip.classList.remove('is-volteado');
      el.flip.setAttribute('aria-pressed', 'false');
    }
    if (modalActivo && modalActivo.nombre === nombre) {
      const alCerrar = modalActivo.alCerrar;
      modalActivo = null;
      document.body.classList.remove('modal-abierto');
      if (alCerrar) alCerrar();
    }
    if (ultimoFoco && document.contains(ultimoFoco)) {
      ultimoFoco.focus({ preventScroll: true });
      ultimoFoco = null;
    }
  }

  function atraparFoco(evento, modal) {
    const focos = $$(FOCALIZABLES, modal).filter((nodo) => nodo.offsetParent !== null);
    if (focos.length === 0) return;
    const primero = focos[0];
    const ultimo = focos[focos.length - 1];
    if (evento.shiftKey && document.activeElement === primero) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primero.focus();
    }
  }

  function toast(mensaje, tipo) {
    if (!el.toasts) return;
    while (el.toasts.children.length >= 3) el.toasts.removeChild(el.toasts.firstElementChild);
    const caja = document.createElement('div');
    caja.className = 'toast' + (tipo ? ' toast--' + tipo : '');
    caja.textContent = mensaje;
    el.toasts.appendChild(caja);
    window.setTimeout(() => {
      caja.classList.add('is-saliendo');
      window.setTimeout(() => caja.remove(), 260);
    }, 3800);
  }

  function anunciar(mensaje) {
    const region = el.dadoEstado;
    if (!region) return;
    region.textContent = mensaje;
  }

  /* ---------- Admin ---------- */

  let adminGenerado = false;

  function urlPorDefecto() {
    const { origin, pathname } = window.location;
    if (!origin || origin === 'null') return decodeURIComponent(pathname);
    return origin + pathname.replace(/index\.html$/i, '').replace(/\/$/, '') + '/';
  }

  function crearQR(texto) {
    const qr = window.qrcode(0, 'M');
    qr.addData(texto);
    qr.make();
    return qr.createSvgTag({ cellSize: 4, margin: 3, scalable: true, alt: texto });
  }

  async function generarQRs() {
    if (!el.adminUrl) return;
    if (!el.adminUrl.value) el.adminUrl.value = urlPorDefecto();

    let url = el.adminUrl.value.trim();
    if (!url) {
      estadoAdmin('Escribe la dirección pública del juego.', true);
      return;
    }
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) url = 'https://' + url;

    let destino = null;
    try {
      destino = new URL(url);
    } catch (error) {
      destino = null;
    }
    if (!destino || (destino.protocol !== 'https:' && destino.protocol !== 'http:')) {
      estadoAdmin('Escribe una dirección completa, por ejemplo https://tu-sitio.pages.dev/.', true);
      return;
    }
    url = destino.href;
    el.adminUrl.value = url;

    estadoAdmin('Generando los códigos...');

    try {
      await cargarLibreria([URL_QR, URL_QR_ALT], 'qrcode');
    } catch (error) {
      estadoAdmin('No pudimos cargar el generador de QRs. Revisa la conexión y vuelve a intentarlo.', true);
      return;
    }

    try {
      el.qrMaestro.innerHTML = crearQR(url);
    } catch (error) {
      estadoAdmin('La dirección del QR maestro no es válida. Revísala.', true);
      return;
    }

    el.qrMaestroUrl.textContent = url;

    el.qrGrid.innerHTML = Array.from({ length: ETAPAS }, (_, indice) => {
      const n = indice + 1;
      const contenido = DATA.prefijoQR + n;
      return (
        '<article class="qr-tarjeta">' +
        '<p class="qr-tarjeta__num">' + n + '</p>' +
        '<div class="qr-tarjeta__codigo">' + crearQR(contenido) + '</div>' +
        '<p class="qr-tarjeta__texto">Escalón ' + n + '</p>' +
        '<p class="qr-tarjeta__url">' + contenido + '</p>' +
        '</article>'
      );
    }).join('');

    adminGenerado = true;
    estadoAdmin('Listo: el QR maestro y los nueve códigos de escalón.');
  }

  function estadoAdmin(mensaje, esError) {
    if (!el.adminEstado) return;
    el.adminEstado.textContent = mensaje;
    el.adminEstado.classList.toggle('is-error', !!esError);
  }

  async function imprimir() {
    if (!adminGenerado) await generarQRs();
    if (!adminGenerado) return;
    window.setTimeout(() => window.print(), 120);
  }

  /* ---------- Eventos ---------- */

  function conectarEventos() {
    el.btnIniciar.addEventListener('click', () => {
      if (estado.iniciado) {
        abrirConfirmacion('nueva');
      } else {
        iniciarPartida();
      }
    });

    el.btnContinuar.addEventListener('click', () => {
      if (estado.terminado) {
        mostrarVista('tablero');
      } else if (estado.fase === 'armar') {
        mostrarVista('tablero');
      } else {
        mostrarVista('juego');
      }
    });

    el.btnReiniciar.addEventListener('click', () => {
      if (!estado.iniciado) {
        toast('Todavía no hay una partida guardada en este dispositivo.');
        return;
      }
      abrirConfirmacion('reiniciar');
    });

    el.btnConfirmarSi.addEventListener('click', confirmarBorrado);
    el.btnConfirmarNo.addEventListener('click', () => cerrarModal('confirmar'));

    el.btnLanzar.addEventListener('click', lanzarDado);
    el.btnEscanear.addEventListener('click', abrirEscaner);
    el.btnSimular.addEventListener('click', simularEscaneo);
    el.btnSimularModal.addEventListener('click', simularEscaneo);
    el.btnReintentar.addEventListener('click', iniciarCamara);
    el.btnAbrirPendiente.addEventListener('click', () => {
      if (estado.pendiente) abrirPergamino(estado.pendiente, 'nuevo');
    });
    el.btnIrTablero.addEventListener('click', () => mostrarVista('tablero'));

    el.tablero.addEventListener('click', (evento) => {
      const casilla = evento.target.closest('[data-casilla]');
      if (!casilla) return;
      tocarCasilla(Number(casilla.dataset.casilla));
    });

    el.inventario.addEventListener('click', (evento) => {
      const pieza = evento.target.closest('[data-pieza]');
      if (!pieza) return;
      elegirPieza(Number(pieza.dataset.pieza));
    });

    el.coleccion.addEventListener('click', (evento) => {
      const ficha = evento.target.closest('[data-pergamino]');
      if (!ficha) return;
      abrirPergamino(Number(ficha.dataset.pergamino), 'leer');
    });

    el.flip.addEventListener('click', girarPergamino);
    el.flip.addEventListener('keydown', (evento) => {
      if (evento.key === 'Enter' || evento.key === ' ') {
        evento.preventDefault();
        girarPergamino();
      }
    });
    el.btnGirar.addEventListener('click', girarPergamino);
    el.btnGuardar.addEventListener('click', guardarPergamino);
    el.btnOirPergamino.addEventListener('click', repetirPergamino);
    el.btnOirVictoria.addEventListener('click', repetirVictoria);

    el.btnVictoriaFinal.addEventListener('click', abrirVictoria);
    el.btnOtraVez.addEventListener('click', () => {
      cerrarModal('victoria');
      iniciarPartida();
    });
    el.btnVerPergaminos.addEventListener('click', () => {
      cerrarModal('victoria');
      mostrarVista('pergaminos');
    });
    el.btnCerrarVictoria.addEventListener('click', () => cerrarModal('victoria'));

    el.btnGenerar.addEventListener('click', generarQRs);
    el.btnImprimir.addEventListener('click', imprimir);
    el.adminUrl.addEventListener('input', () => {
      adminGenerado = false;
    });
    el.adminUrl.addEventListener('keydown', (evento) => {
      if (evento.key === 'Enter') {
        evento.preventDefault();
        generarQRs();
      }
    });

    document.addEventListener('click', (evento) => {
      const cerrar = evento.target.closest('[data-cerrar]');
      if (cerrar) {
        cerrarModal(cerrar.dataset.cerrar);
        return;
      }
      const ir = evento.target.closest('[data-ir]');
      if (ir) mostrarVista(ir.dataset.ir);
      const oir = evento.target.closest('[data-guia-oir]');
      if (oir) {
        repetirTexto(textoDelGlobo(oir.closest('.guia')));
        return;
      }
      const sonido = evento.target.closest('[data-accion="sonido"]');
      if (sonido) alternarSonido();
    });

    document.addEventListener('keydown', (evento) => {
      if (evento.key === 'Escape' && modalActivo) {
        evento.preventDefault();
        cerrarModal(modalActivo.nombre);
        return;
      }
      if (evento.key === 'Tab' && modalActivo) atraparFoco(evento, modalActivo.modal);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        detenerVoz();
        detenerCamara();
      } else if (escanerAbierto && !escaner) {
        iniciarCamara();
      }
    });

    window.addEventListener('pagehide', () => {
      detenerVoz();
      detenerCamara();
    });
  }

  function simularEscaneo() {
    if (!ES_DEBUG) return;
    const objetivo = objetivoActual();
    if (!objetivo) {
      toast('Primero lanza el dado para saber a qué escalón ir.');
      return;
    }
    validarCodigo(DATA.prefijoQR + objetivo);
  }

  /* ---------- Arranque ---------- */

  function registrarServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    const seguro =
      window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
    if (!seguro) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {
        /* la app funciona igual sin caché offline */
      });
    });
  }

  function init() {
    estado = cargarEstado();
    crearParadas();

    if (ES_DEBUG) {
      $$('[data-debug]').forEach((nodo) => {
        nodo.hidden = false;
      });
    }

    if (el.adminUrl) el.adminUrl.value = urlPorDefecto();

    conectarEventos();
    render();

    if (ES_ADMIN) mostrarVista('admin');
    else mostrarVista('inicio');

    if (!ES_ADMIN && !estado.iniciado) {
      window.setTimeout(() => {
        if (estado.iniciado || document.hidden || modalActivo) return;
        hablar(DATA.guia.bienvenida);
      }, 900);
    }

    if (!almacenOk) {
      toast('Este navegador no permite guardar la partida. El avance dura mientras la pestaña siga abierta.', 'error');
    }

    verificarImagenes();
    registrarServiceWorker();
  }

  init();
})();
