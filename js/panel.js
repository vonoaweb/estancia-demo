/* ==========================================================================
   ESTANCIA — Panel del anfitrión
   Vonoa Web

   La misma agenda que alimenta el sitio público, vista desde el otro lado:
   las seis propiedades juntas, quién llega hoy, cuánto lleva el mes.

   Todo sale de agendaDe() en data.js, o sea de las mismas reservas que
   bloquean el calendario del huésped. En la version real esa agenda es el
   iCal de cada anuncio de Airbnb; aquí se genera para poder enseñar el flujo
   sin pedirle accesos al cliente.
   ========================================================================== */

/* plural() de data.js ya devuelve el número pegado a la palabra. Aquí las
   cifras casi siempre van en su propio elemento, así que hace falta la
   variante que solo concuerda la palabra. */
const palabra = (n, uno, varios) => (n === 1 ? uno : varios);

/* Mes que se está viendo: 0 = mes en curso, 1 = el siguiente... */
const panel = { desplazamiento: 0 };

/* --------------------------------------------------------------------------
   Lectura de la agenda
   -------------------------------------------------------------------------- */

/* Todas las reservas de la cartera, con su propiedad colgada, ordenadas por
   fecha de llegada. */
function reservasCartera() {
  const todas = [];
  PROPIEDADES.forEach((prop) => {
    agendaDe(prop).reservas.forEach((r) => todas.push({ prop, ...r }));
  });
  return todas.sort((a, b) => a.entrada - b.entrada);
}

/* Primer y último día del mes que se está viendo. */
function mesEnVista() {
  const hoy = Fechas.hoy();
  const primero = new Date(hoy.getFullYear(), hoy.getMonth() + panel.desplazamiento, 1);
  const ultimo = new Date(primero.getFullYear(), primero.getMonth() + 1, 0);
  return { primero, ultimo, dias: ultimo.getDate() };
}

/* Ingreso de una reserva prorrateado por noche: una estancia que cruza de mes
   deja en cada mes lo que realmente durmió ahí. La limpieza se cobra completa
   en el mes de la llegada, que es como se factura. */
function ingresoEnRango(reserva, desde, hasta) {
  let monto = 0;
  let nochesDentro = 0;

  for (let i = 0; i < reserva.noches; i++) {
    const noche = Fechas.suma(reserva.entrada, i);
    if (noche >= desde && noche <= hasta) {
      monto += precioNoche(reserva.prop, noche);
      nochesDentro++;
    }
  }

  if (nochesDentro === 0) return { monto: 0, noches: 0 };

  // El descuento semanal se reparte en proporción a las noches que caen dentro.
  if (reserva.noches >= 7) monto -= Math.round(monto * 0.1);
  if (reserva.entrada >= desde && reserva.entrada <= hasta) monto += reserva.prop.limpieza;

  return { monto, noches: nochesDentro };
}

/* Cifras de un rango: ocupación, ingreso y noches vendidas. */
function metricas(desde, hasta) {
  const totalNoches = Fechas.noches(desde, hasta) + 1;
  let noches = 0;
  let ingreso = 0;
  let reservas = 0;
  let porAirbnb = 0;

  reservasCartera().forEach((r) => {
    const { monto, noches: n } = ingresoEnRango(r, desde, hasta);
    if (n > 0) {
      noches += n;
      ingreso += monto;
      reservas++;
      if (r.canal === 'Airbnb') porAirbnb++;
    }
  });

  const capacidad = PROPIEDADES.length * totalNoches;
  return {
    noches,
    ingreso,
    reservas,
    porAirbnb,
    ocupacion: capacidad ? Math.round((noches / capacidad) * 100) : 0,
    tarifaMedia: noches ? Math.round(ingreso / noches) : 0
  };
}

/* --------------------------------------------------------------------------
   Indicadores
   -------------------------------------------------------------------------- */

function pintarKpis() {
  const { primero, ultimo } = mesEnVista();
  const m = metricas(primero, ultimo);
  const etiquetaMes = Fechas.mes(primero);

  const tarjetas = [
    {
      cifra: `${m.ocupacion}%`,
      etiqueta: 'Ocupación',
      pie: `${m.noches} ${palabra(m.noches, 'noche vendida', 'noches vendidas')} de ${
        PROPIEDADES.length * ultimo.getDate()
      } disponibles`
    },
    {
      cifra: pesos(m.ingreso),
      etiqueta: 'Ingreso del mes',
      pie: `${etiquetaMes} · incluye limpieza`
    },
    {
      cifra: pesos(m.tarifaMedia),
      etiqueta: 'Tarifa media',
      pie: 'Por noche vendida, ya con recargo de fin de semana'
    },
    {
      cifra: String(m.reservas),
      etiqueta: 'Reservas',
      pie: `${m.porAirbnb} por Airbnb · ${m.reservas - m.porAirbnb} ${palabra(
        m.reservas - m.porAirbnb,
        'directa',
        'directas'
      )}`
    }
  ];

  $('#panelKpis').innerHTML = tarjetas
    .map(
      (t) => `
      <article class="kpi">
        <p class="kpi__etiqueta">${t.etiqueta}</p>
        <p class="kpi__cifra">${t.cifra}</p>
        <p class="kpi__pie">${t.pie}</p>
      </article>`
    )
    .join('');
}

/* --------------------------------------------------------------------------
   Movimientos de hoy
   -------------------------------------------------------------------------- */

function pintarHoy() {
  const hoy = Fechas.hoy();
  const claveHoy = Fechas.clave(hoy);

  const llegadas = [];
  const salidas = [];
  const enCasa = [];

  reservasCartera().forEach((r) => {
    if (Fechas.clave(r.entrada) === claveHoy) llegadas.push(r);
    if (Fechas.clave(r.salida) === claveHoy) salidas.push(r);
    if (r.entrada < hoy && r.salida > hoy) enCasa.push(r);
  });

  const lista = (arr, vacio) =>
    arr.length
      ? `<ul class="mov__lista">${arr
          .map(
            (r) =>
              `<li>${r.prop.nombre} · ${r.huespedes} ${palabra(
                r.huespedes,
                'huésped',
                'huéspedes'
              )}</li>`
          )
          .join('')}</ul>`
      : `<p class="mov__txt tenue">${vacio}</p>`;

  $('#panelHoy').innerHTML = `
    <article class="mov">
      <p class="mov__num">${llegadas.length}</p>
      <p class="mov__txt">${palabra(llegadas.length, 'llegada', 'llegadas')}</p>
      ${lista(llegadas, 'Sin entradas hoy.')}
    </article>
    <article class="mov">
      <p class="mov__num">${salidas.length}</p>
      <p class="mov__txt">${palabra(salidas.length, 'salida', 'salidas')}</p>
      ${lista(salidas, 'Sin salidas hoy.')}
    </article>
    <article class="mov">
      <p class="mov__num">${enCasa.length}</p>
      <p class="mov__txt">${palabra(enCasa.length, 'casa ocupada', 'casas ocupadas')}</p>
      ${lista(enCasa, 'Todas libres.')}
    </article>
  `;

  $('#panelFechaHoy').textContent = Fechas.larga(hoy);
}

/* --------------------------------------------------------------------------
   Calendario general
   Una fila por propiedad, una columna por noche del mes. Las reservas se
   pintan como barras continuas: la celda sabe si es el arranque o el cierre
   del bloque para redondear solo esos extremos.
   -------------------------------------------------------------------------- */

const DIA_LETRA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function pintarRejilla() {
  const { primero, dias } = mesEnVista();
  const claveHoy = Fechas.clave(Fechas.hoy());
  const rejilla = $('#rejilla');

  rejilla.style.setProperty('--dias', dias);

  let html = '<div class="rejilla__esquina"></div>';

  // Encabezado: letra del día y número
  for (let d = 0; d < dias; d++) {
    const fecha = Fechas.suma(primero, d);
    const finde = Fechas.esFinDeSemana(fecha);
    html += `
      <div class="rejilla__cab${finde ? ' rejilla__cab--finde' : ''}">
        <span>${DIA_LETRA[Fechas.columna(fecha)]}</span>
        <strong>${fecha.getDate()}</strong>
      </div>`;
  }

  // Una fila por propiedad
  PROPIEDADES.forEach((prop) => {
    html += `
      <div class="rejilla__prop">
        <a href="${enlacePropiedad(prop)}">${prop.nombre}</a>
        <span>${prop.zona}</span>
      </div>`;

    for (let d = 0; d < dias; d++) {
      const fecha = Fechas.suma(primero, d);
      const clave = Fechas.clave(fecha);
      const reserva = reservaEnNoche(prop, fecha);

      const clases = ['celda'];
      if (Fechas.esFinDeSemana(fecha)) clases.push('celda--finde');
      if (clave === claveHoy) clases.push('celda--hoy');

      let titulo = `${prop.nombre} — ${Fechas.larga(fecha)}: libre`;

      if (reserva) {
        clases.push('celda--ocupada');
        clases.push(reserva.canal === 'Airbnb' ? 'celda--airbnb' : 'celda--directa');
        if (Fechas.clave(reserva.entrada) === clave) clases.push('celda--inicio');
        if (Fechas.noches(reserva.entrada, fecha) === reserva.noches - 1) {
          clases.push('celda--fin');
        }
        titulo =
          `${prop.nombre} — ${reserva.canal}, ${reserva.noches} ` +
          `${palabra(reserva.noches, 'noche', 'noches')} ` +
          `(${Fechas.corta(reserva.entrada)} al ${Fechas.corta(reserva.salida)}), ` +
          `${reserva.huespedes} ${palabra(reserva.huespedes, 'huésped', 'huéspedes')}`;
      }

      html += `<div class="${clases.join(' ')}" title="${titulo}"></div>`;
    }
  });

  rejilla.innerHTML = html;
  $('#mesActual').textContent = Fechas.mes(primero);
  $('#mesAnterior').disabled = panel.desplazamiento <= 0;
  $('#mesSiguiente').disabled = panel.desplazamiento >= 8;
}

/* Indice noche -> reserva, una vez por propiedad. Sin esto cada celda del
   calendario recorreria la agenda entera. */
const indiceNoches = new Map();

function nochesDe(prop) {
  if (indiceNoches.has(prop.id)) return indiceNoches.get(prop.id);
  const mapa = new Map();
  agendaDe(prop).reservas.forEach((r) => {
    for (let i = 0; i < r.noches; i++) {
      mapa.set(Fechas.clave(Fechas.suma(r.entrada, i)), r);
    }
  });
  indiceNoches.set(prop.id, mapa);
  return mapa;
}

/* La reserva que ocupa esa noche en esa propiedad, o null. */
function reservaEnNoche(prop, fecha) {
  return nochesDe(prop).get(Fechas.clave(fecha)) || null;
}

/* --------------------------------------------------------------------------
   Próximas reservas
   -------------------------------------------------------------------------- */

function pintarProximas() {
  const hoy = Fechas.hoy();
  const limite = Fechas.suma(hoy, 30);

  const proximas = reservasCartera().filter((r) => r.salida >= hoy && r.entrada <= limite);

  $('#cuerpoReservas').innerHTML = proximas
    .map((r) => {
      const c = cotizar(r.prop, r.entrada, r.salida);
      const pastilla =
        r.canal === 'Airbnb'
          ? '<span class="pastilla pastilla--airbnb">Airbnb</span>'
          : '<span class="pastilla pastilla--directa">Directa</span>';
      return `
        <tr>
          <td><a href="${enlacePropiedad(r.prop)}">${r.prop.nombre}</a></td>
          <td>${Fechas.corta(r.entrada)}</td>
          <td>${Fechas.corta(r.salida)}</td>
          <td class="num">${r.noches}</td>
          <td class="num">${r.huespedes}</td>
          <td>${pastilla}</td>
          <td class="num">${pesos(c.total)}</td>
        </tr>`;
    })
    .join('');

  const suma = proximas.reduce((s, r) => s + cotizar(r.prop, r.entrada, r.salida).total, 0);
  $('#notaReservas').textContent = `${proximas.length} ${palabra(
    proximas.length,
    'reserva',
    'reservas'
  )} en los siguientes 30 días · ${pesos(suma)} comprometidos.`;
}

/* --------------------------------------------------------------------------
   Rendimiento por propiedad
   -------------------------------------------------------------------------- */

function pintarPropiedades() {
  const { primero, ultimo, dias } = mesEnVista();

  const filas = PROPIEDADES.map((prop) => {
    let noches = 0;
    let ingreso = 0;

    agendaDe(prop).reservas.forEach((r) => {
      const res = ingresoEnRango({ ...r, prop }, primero, ultimo);
      noches += res.noches;
      ingreso += res.monto;
    });

    return {
      prop,
      noches,
      ingreso,
      ocupacion: Math.round((noches / dias) * 100),
      media: noches ? Math.round(ingreso / noches) : 0
    };
  }).sort((a, b) => b.ingreso - a.ingreso);

  $('#cuerpoProps').innerHTML = filas
    .map(
      (f) => `
      <tr>
        <td><a href="${enlacePropiedad(f.prop)}">${f.prop.nombre}</a></td>
        <td class="tenue">${f.prop.zona}</td>
        <td class="num">${f.ocupacion}%</td>
        <td class="num">${f.noches}</td>
        <td class="num">${pesos(f.media)}</td>
        <td class="num">${pesos(f.ingreso)}</td>
      </tr>`
    )
    .join('');

  $('#rangoRendimiento').textContent = Fechas.mes(primero);
}

/* --------------------------------------------------------------------------
   Arranque
   -------------------------------------------------------------------------- */

function pintarTodo() {
  pintarKpis();
  pintarRejilla();
  pintarProximas();
  pintarPropiedades();
}

function montarPanel() {
  montarEsqueleto();

  $('#panelSincro').innerHTML =
    `${Icono.candado} Agenda sincronizada con Airbnb ${textoSincronizacion()} · ` +
    `${PROPIEDADES.length} propiedades conectadas`;

  $('#mesAnterior').addEventListener('click', () => {
    if (panel.desplazamiento > 0) {
      panel.desplazamiento--;
      pintarTodo();
    }
  });

  $('#mesSiguiente').addEventListener('click', () => {
    if (panel.desplazamiento < 8) {
      panel.desplazamiento++;
      pintarTodo();
    }
  });

  pintarHoy();
  pintarTodo();

  // El sello de sincronización se mueve solo, igual que en el sitio público.
  setInterval(() => {
    const s = $('#panelSincro');
    if (s) {
      s.innerHTML =
        `${Icono.candado} Agenda sincronizada con Airbnb ${textoSincronizacion()} · ` +
        `${PROPIEDADES.length} propiedades conectadas`;
    }
  }, 60000);
}

document.addEventListener('DOMContentLoaded', montarPanel);
