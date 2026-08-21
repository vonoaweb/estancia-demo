/* ==========================================================================
   Comportamiento compartido + pagina de inicio
   ========================================================================== */

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const Icono = {
  estrella: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2l2.9 6.3 6.8.8-5 4.6 1.4 6.7-6.1-3.5-6.1 3.5 1.4-6.7-5-4.6 6.8-.8z"/></svg>',
  flecha: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15l-1.3 4.8 5-1.3A10 10 0 1012 2zm0 2a8 8 0 11-4.2 14.8l-.4-.2-2.6.7.7-2.5-.3-.4A8 8 0 0112 4zm-3.4 4c-.2 0-.5.1-.7.4-.3.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.7 2.8 4.3 3.8 2.1.8 2.6.7 3 .6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2l-.5-.3-1.6-.8c-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.5 6.5 0 01-1.9-1.2 7.3 7.3 0 01-1.4-1.7c-.1-.2 0-.4.1-.5l.4-.5.3-.5v-.5l-.8-1.9c-.2-.4-.4-.4-.6-.4z"/></svg>',
  calendario: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  candado: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 118 0v3"/></svg>'
};

/* Iconos de amenidades (trazo simple, se heredan del CSS) */
const IconoAmenidad = {
  wifi: '<path d="M2 8.5a15 15 0 0120 0M5 12a10 10 0 0114 0M8.5 15.5a5 5 0 017 0"/><circle cx="12" cy="19" r="1"/>',
  cocina: '<path d="M4 3v7a2 2 0 002 2h1v9M7 3v6M18 3c-1.5 2-2 4-2 6s.5 3 2 3v9"/>',
  alberca: '<path d="M3 16c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2M3 11c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2M8 13V5a2 2 0 014 0M16 13V5"/>',
  asador: '<path d="M5 4h14l-3 8H8zM9 12l-2 8M15 12l2 8"/>',
  aire: '<path d="M3 6h18v6H3zM7 16v3M12 16v4M17 16v3"/>',
  chimenea: '<path d="M12 3c3 3 4 5 4 8a4 4 0 01-8 0c0-2 1-3 2-4 0 1.5 1 2 2 2-1-2 0-4 0-6z"/>',
  lavadora: '<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="14" r="4"/><path d="M8 6.5h.01"/>',
  estacionamiento: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 17V7h3.5a3 3 0 010 6H9"/>',
  tv: '<rect x="2" y="5" width="20" height="13" rx="2"/><path d="M8 21h8"/>',
  gym: '<path d="M4 9v6M8 6v12M16 6v12M20 9v6M8 12h8"/>',
  mascotas: '<circle cx="7" cy="9" r="2"/><circle cx="12" cy="6.5" r="2"/><circle cx="17" cy="9" r="2"/><path d="M12 12c-3 0-5 2.5-5 4.5S9 20 12 20s5-1.5 5-3.5S15 12 12 12z"/>',
  vista: '<path d="M3 19l6-8 4 5 3-3 5 6z"/><circle cx="8" cy="6" r="2"/>',
  terraza: '<path d="M3 20h18M5 20V10h14v10M9 20v-6h6v6"/>',
  escritorio: '<rect x="3" y="5" width="18" height="11" rx="2"/><path d="M8 20h8M12 16v4"/>'
};

function iconoAmenidad(clave) {
  return `<svg viewBox="0 0 24 24">${IconoAmenidad[clave] || '<circle cx="12" cy="12" r="4"/>'}</svg>`;
}

/* --------------------------------------------------------------------------
   Enlaces
   -------------------------------------------------------------------------- */

function enlaceWhatsApp(texto) {
  return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(texto)}`;
}

function enlaceAirbnb(prop, entrada, salida, huéspedes) {
  const base = `https://www.airbnb.mx/rooms/${prop.airbnbId}`;
  if (!entrada || !salida) return base;
  const params = new URLSearchParams({
    check_in: Fechas.clave(entrada),
    check_out: Fechas.clave(salida),
    adults: String(huéspedes || 2)
  });
  return `${base}?${params}`;
}

function enlacePropiedad(prop, entrada, salida) {
  const params = new URLSearchParams({ id: prop.id });
  if (entrada && salida) {
    params.set('entrada', Fechas.clave(entrada));
    params.set('salida', Fechas.clave(salida));
  }
  return `propiedad.html?${params}`;
}

/* --------------------------------------------------------------------------
   Piezas de interfaz compartidas
   -------------------------------------------------------------------------- */

/* Si una foto de muestra no carga, el marco queda como bloque con el nombre. */
document.addEventListener(
  'error',
  (e) => {
    const img = e.target;
    if (!img || img.tagName !== 'IMG') return;
    const marco = img.parentElement;
    if (!marco) return;
    marco.classList.add('sin-foto');
    if (!marco.dataset.nombre) marco.dataset.nombre = img.alt || '';
  },
  true
);

function montarFotos(ctx = document) {
  $$('img[data-foto]', ctx).forEach((img) => {
    img.src = foto(img.dataset.foto, Number(img.dataset.ancho) || 1200);
  });
}

function avisar(texto) {
  const caja = $('#avisoFlotante');
  if (!caja) return;
  caja.textContent = texto;
  caja.classList.add('visible');
  clearTimeout(avisar._t);
  avisar._t = setTimeout(() => caja.classList.remove('visible'), 2600);
}

function abrirModal(html) {
  const modal = $('#modal');
  if (!modal) return;
  $('#modalCuerpo').innerHTML = html;
  modal.classList.add('abierto');
  document.body.style.overflow = 'hidden';
}

function cerrarModal() {
  const modal = $('#modal');
  if (!modal) return;
  modal.classList.remove('abierto');
  document.body.style.overflow = '';
}

document.addEventListener('click', (e) => {
  if (e.target.closest('[data-cierra-modal]') || e.target.id === 'modal') cerrarModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') cerrarModal();
});

/* Encabezado, menu y animacion de entrada */
function montarEsqueleto() {
  const encabezado = $('#encabezado');
  const alSalir = () => {
    if (encabezado) encabezado.classList.toggle('encabezado--solido', window.scrollY > 12);
  };
  alSalir();
  window.addEventListener('scroll', alSalir, { passive: true });

  const btn = $('#menuBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      const abierto = document.body.classList.toggle('menu-abierto');
      btn.setAttribute('aria-expanded', String(abierto));
    });
    $$('#nav a').forEach((a) =>
      a.addEventListener('click', () => {
        document.body.classList.remove('menu-abierto');
        btn.setAttribute('aria-expanded', 'false');
      })
    );
  }

  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('visible');
          observador.unobserve(entrada.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px' }
  );
  $$('.revelar').forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i % 4, 3) * 70}ms`;
    observador.observe(el);
  });

  const anio = $('#anio');
  if (anio) anio.textContent = new Date().getFullYear();

  montarFotos();
}

/* Minutos desde la ultima sincronización (se mueve solo con el reloj) */
function minutosDesdeSincronizacion() {
  return Math.floor((Date.now() / 60000) % CONFIG.minutosSincronizacion);
}

function textoSincronizacion() {
  const m = minutosDesdeSincronizacion();
  return m < 1 ? 'hace un momento' : `hace ${m} min`;
}

/* --------------------------------------------------------------------------
   Tarjeta de propiedad
   -------------------------------------------------------------------------- */

function tarjeta(prop, estado) {
  const conFechas = estado && estado.entrada && estado.salida;
  const cotizacion = conFechas ? cotizar(prop, estado.entrada, estado.salida) : null;

  const etiqueta = conFechas
    ? `<span class="ficha__etiqueta ficha__etiqueta--libre">Libre estas fechas</span>`
    : prop.destacado
      ? `<span class="ficha__etiqueta">Más reservada</span>`
      : '';

  const precio = cotizacion
    ? `<strong>${pesos(cotizacion.total)}</strong> <span class="tenue">total · ${plural(cotizacion.noches, 'noche', 'noches')}</span>`
    : `<strong>${pesos(prop.precio)}</strong> <span class="tenue">por noche</span>`;

  return `
    <a class="ficha revelar" href="${enlacePropiedad(prop, estado.entrada, estado.salida)}" data-id="${prop.id}">
      <div class="ficha__marco">
        <img src="${foto(prop.fotos[0], 900)}" alt="${prop.nombre}" loading="lazy" decoding="async" />
        ${etiqueta}
      </div>
      <div class="ficha__cuerpo">
        <div class="ficha__titulo">
          <h3>${prop.nombre}</h3>
          <span class="ficha__rating">${Icono.estrella} ${prop.rating}</span>
        </div>
        <p class="ficha__zona">${prop.zona}</p>
        <p class="ficha__meta">${prop.tipo} · ${plural(prop.huespedes, 'huésped', 'huéspedes')} · ${prop.recamaras} rec · ${plural(prop.banos, 'baño', 'baños')}</p>
        <p class="ficha__precio">${precio}</p>
      </div>
    </a>`;
}

/* --------------------------------------------------------------------------
   Pagina de inicio
   -------------------------------------------------------------------------- */

function montarInicio() {
  const contenedorCartera = $('#cartera');
  if (!contenedorCartera) return;

  const estado = { entrada: null, salida: null, huespedes: 0, filtro: 'todas' };

  /* ---- cifras ---- */
  const resumen = resumenCartera();
  $('#cifras').innerHTML = [
    [resumen.propiedades, 'Propiedades administradas'],
    [resumen.ocupacion + '%', 'Ocupación a 90 días'],
    [resumen.reservas, 'Reservas sincronizadas'],
    [resumen.rating, 'Calificación promedio']
  ]
    .map(([valor, texto]) => `<div class="cifra"><strong>${valor}</strong><span>${texto}</span></div>`)
    .join('');

  /* ---- cartera ---- */
  function coincideFiltro(prop) {
    switch (estado.filtro) {
      case 'ciudad':
      case 'sierra':
        return prop.entorno === estado.filtro;
      case 'alberca':
      case 'mascotas':
        return prop.amenidades.includes(estado.filtro);
      default:
        return true;
    }
  }

  function pintarCartera() {
    const conFechas = estado.entrada && estado.salida;
    const visibles = PROPIEDADES.filter(
      (p) =>
        coincideFiltro(p) &&
        (!estado.huespedes || p.huespedes >= estado.huespedes) &&
        (!conFechas || disponible(p, estado.entrada, estado.salida))
    );

    contenedorCartera.innerHTML = visibles.length
      ? visibles.map((p) => tarjeta(p, estado)).join('')
      : `<div class="vacio">
           <p><strong>No hay propiedades libres con esos criterios.</strong></p>
           <p class="min" style="margin-top:8px">Prueba con otras fechas o quita el filtro de huéspedes.</p>
         </div>`;

    $$('.ficha', contenedorCartera).forEach((el) => el.classList.add('visible'));
    pintarResultado(visibles.length, conFechas);
  }

  function pintarResultado(cuantas, conFechas) {
    const caja = $('#resultadoBusqueda');
    if (!conFechas) {
      caja.innerHTML = estado.huespedes
        ? `${cuantas} de ${PROPIEDADES.length} propiedades para ${plural(estado.huespedes, 'huésped', 'huéspedes')}.`
        : '';
      return;
    }
    const noches = Fechas.noches(estado.entrada, estado.salida);
    caja.innerHTML =
      `<span><strong>${cuantas}</strong> de ${PROPIEDADES.length} propiedades libres del ` +
      `${Fechas.corta(estado.entrada)} al ${Fechas.corta(estado.salida)} · ${plural(noches, 'noche', 'noches')}</span>` +
      `<button type="button" id="limpiarBusqueda">Quitar fechas</button>`;

    const limpiar = $('#limpiarBusqueda');
    if (limpiar) limpiar.addEventListener('click', reiniciarFechas);
  }

  /* ---- filtros ---- */
  $$('#filtros .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      $$('#filtros .chip').forEach((c) => c.classList.remove('activo'));
      chip.classList.add('activo');
      estado.filtro = chip.dataset.filtro;
      pintarCartera();
    });
  });

  $('#huespedes').addEventListener('change', (e) => {
    estado.huespedes = Number(e.target.value);
    pintarCartera();
  });

  /* ---- buscador de fechas ---- */
  const popover = $('#popoverFechas');
  const calBuscador = new Calendario($('#calBuscador'), {
    meses: 2,
    minNoches: 1,
    alCambiar: (entrada, salida) => {
      estado.entrada = entrada;
      estado.salida = salida;
      etiquetarFechas();
      if (entrada && salida) pintarCartera();
    }
  });

  function etiquetarFechas() {
    const l = $('#etiquetaLlegada');
    const s = $('#etiquetaSalida');
    l.textContent = estado.entrada ? Fechas.corta(estado.entrada) : 'Elegir fecha';
    s.textContent = estado.salida ? Fechas.corta(estado.salida) : 'Elegir fecha';
    l.classList.toggle('puesto', !!estado.entrada);
    s.classList.toggle('puesto', !!estado.salida);
  }

  function abrirFechas(abrir) {
    popover.classList.toggle('abierto', abrir);
    $$('[data-abre="fechas"]').forEach((b) => b.classList.toggle('activo', abrir));
  }

  function reiniciarFechas() {
    calBuscador.limpiar();
    estado.entrada = null;
    estado.salida = null;
    etiquetarFechas();
    pintarCartera();
  }

  $$('[data-abre="fechas"]').forEach((b) =>
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      abrirFechas(!popover.classList.contains('abierto'));
    })
  );
  $('#cerrarFechas').addEventListener('click', () => abrirFechas(false));
  $('#limpiarFechas').addEventListener('click', reiniciarFechas);
  popover.addEventListener('click', (e) => e.stopPropagation());
  document.addEventListener('click', () => abrirFechas(false));

  $('#btnBuscar').addEventListener('click', (e) => {
    e.stopPropagation();
    abrirFechas(false);
    pintarCartera();
    document.getElementById('propiedades').scrollIntoView({ behavior: 'smooth' });
  });

  /* ---- panel de agenda en vivo ---- */
  let propPanel = PROPIEDADES[0];
  const calPanel = new Calendario($('#calPanel'), { propiedad: propPanel, soloLectura: true });

  function pintarPanel() {
    $('#panelZona').textContent = `${propPanel.nombre} · ${propPanel.zona}`;
    $('#panelSincro').textContent = `Sincronizado ${textoSincronizacion()}`;

    const hoy = Fechas.hoy();
    let ocupadas = 0;
    for (let i = 0; i < 90; i++) if (nocheOcupada(propPanel, Fechas.suma(hoy, i))) ocupadas++;
    $('#panelOcupacion').textContent = `${Math.round((ocupadas / 90) * 100)}% de ocupación a 90 días`;

    const prox = proximaDisponibilidad(propPanel);
    $('#panelProxima').textContent = prox
      ? `Próxima entrada libre: ${Fechas.corta(prox.entrada)}`
      : 'Sin fechas libres próximas';

    $$('#selectorProp button').forEach((b) => b.classList.toggle('activo', b.dataset.id === propPanel.id));
  }

  $('#selectorProp').innerHTML = PROPIEDADES.map(
    (p) => `<button type="button" data-id="${p.id}">${p.nombre}</button>`
  ).join('');

  $('#selectorProp').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    propPanel = propiedadPorId(btn.dataset.id);
    calPanel.prop = propPanel;
    calPanel.dibujar();
    pintarPanel();
  });

  pintarPanel();
  $('#selloSincro').textContent = textoSincronizacion();
  setInterval(() => {
    $('#panelSincro').textContent = `Sincronizado ${textoSincronizacion()}`;
    $('#selloSincro').textContent = textoSincronizacion();
  }, 60000);

  /* ---- contacto ---- */
  $('#enlaceWhats').href = enlaceWhatsApp('Hola, vi el sitio y me interesa reservar una propiedad.');
  $('#enlaceCorreo').href = `mailto:${CONFIG.correo}`;
  $('#enlaceCorreo').textContent = CONFIG.correo;
  $('#datoCiudad').textContent = CONFIG.ciudad;

  $('#propiedadInteres').innerHTML =
    '<option value="">Aún no lo decido</option>' +
    PROPIEDADES.map((p) => `<option value="${p.nombre}">${p.nombre} — ${p.zona}</option>`).join('');

  $('#formContacto').addEventListener('submit', (e) => {
    e.preventDefault();
    const datos = new FormData(e.target);
    const partes = [
      `Hola, soy ${datos.get('nombre')}.`,
      datos.get('propiedad') ? `Me interesa: ${datos.get('propiedad')}.` : 'Quiero información de sus propiedades.',
      datos.get('llegada') && datos.get('salida')
        ? `Fechas: ${Fechas.corta(Fechas.desdeClave(datos.get('llegada')))} al ${Fechas.corta(Fechas.desdeClave(datos.get('salida')))}.`
        : '',
      datos.get('mensaje') ? String(datos.get('mensaje')) : '',
      `Mi teléfono: ${datos.get('telefono')}.`
    ].filter(Boolean);

    window.open(enlaceWhatsApp(partes.join(' ')), '_blank', 'noopener');
    avisar('Abrimos WhatsApp con tu mensaje listo.');
  });

  /* ---- primer pintado ---- */
  etiquetarFechas();
  pintarCartera();
}

document.addEventListener('DOMContentLoaded', () => {
  montarEsqueleto();
  montarInicio();
});
