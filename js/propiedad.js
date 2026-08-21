/* ==========================================================================
   Pagina de propiedad: galeria, agenda y panel de reserva
   ========================================================================== */

const RESENAS = [
  ['Llegamos tarde y la entrada autónoma funcionó perfecto. La casa estaba impecable.', 'Rodrigo A.'],
  ['La comunicación fue rapidísima, contestaron cada duda antes de llegar.', 'Mariela T.'],
  ['Mejor que en las fotos. Volveríamos sin pensarlo.', 'Hugo C.'],
  ['Espacio cómodo, todo limpio y la cocina tenía lo necesario para cocinar de verdad.', 'Paulina G.'],
  ['La ubicación es inmejorable, hicimos todo caminando.', 'Ernesto V.'],
  ['Nos dejaron salir un poco más tarde sin problema. Muy buen trato.', 'Karla S.']
];

function iniciarPropiedad() {
  const params = new URLSearchParams(location.search);
  const prop = propiedadPorId(params.get('id')) || PROPIEDADES[0];

  const estado = {
    entrada: null,
    salida: null,
    huespedes: Math.min(2, prop.huespedes)
  };

  // Fechas que vienen del buscador de la portada
  const desde = params.get('entrada');
  const hasta = params.get('salida');
  if (desde && hasta) {
    const a = Fechas.desdeClave(desde);
    const b = Fechas.desdeClave(hasta);
    if (a >= Fechas.hoy() && rangoLibre(prop, a, b) && Fechas.noches(a, b) >= prop.minNoches) {
      estado.entrada = a;
      estado.salida = b;
    }
  }

  /* ---------- encabezado de la ficha ---------- */

  document.title = `${prop.nombre} — ${prop.zona} | Estancia`;
  $('#migaNombre').textContent = prop.nombre;
  $('#propNombre').textContent = prop.nombre;

  $('#propMeta').innerHTML = [
    `<span>${Icono.estrella} ${prop.rating} · ${prop.resenas} reseñas</span>`,
    `<span>${prop.zona}</span>`,
    `<span>${plural(prop.huespedes, 'huésped', 'huéspedes')} · ${plural(prop.recamaras, 'recámara', 'recámaras')} · ${plural(prop.camas, 'cama', 'camas')} · ${plural(prop.banos, 'baño', 'baños')}</span>`
  ].join('');

  $('#propTipo').textContent = `${prop.tipo} en ${prop.zona}`;
  $('#propResumen').textContent = prop.resumen;
  $('#propDescripcion').textContent = prop.descripcion;

  /* ---------- galeria ---------- */

  $('#galeria').innerHTML = prop.fotos
    .map(
      (id, i) => `
      <button type="button" data-indice="${i}" aria-label="Ver foto ${i + 1}">
        <img src="${foto(id, i === 0 ? 1400 : 700)}" alt="${prop.nombre} — foto ${i + 1}" loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async" />
        ${i === prop.fotos.length - 1 ? `<span class="galeria__mas">${prop.fotos.length} fotos</span>` : ''}
      </button>`
    )
    .join('');

  montarVisor(prop);

  /* ---------- listas ---------- */

  $('#propAmenidades').innerHTML = prop.amenidades
    .map((a) => `<li>${iconoAmenidad(a)}<span>${AMENIDADES[a] || a}</span></li>`)
    .join('');

  $('#propDetalles').innerHTML = prop.detalles.map((d) => `<li>${d}</li>`).join('');

  $('#propReglas').innerHTML = [
    'Llegada a partir de las 15:00 h · salida antes de las 12:00 h',
    `Estancia mínima de ${plural(prop.minNoches, 'noche', 'noches')}`,
    `Capacidad máxima de ${plural(prop.huespedes, 'huésped', 'huéspedes')}, sin excepciones`,
    prop.amenidades.includes('mascotas') ? 'Se admiten mascotas avisando antes de reservar' : 'No se admiten mascotas',
    'No se permiten fiestas ni eventos sin autorización previa',
    'Cancelación gratuita hasta cinco días antes de la llegada'
  ]
    .map((r) => `<li>${r}</li>`)
    .join('');

  const inicio = semilla(prop.id) % RESENAS.length;
  $('#propResenas').innerHTML = [RESENAS[inicio], RESENAS[(inicio + 3) % RESENAS.length]]
    .map(
      ([texto, autor]) => `
      <figure class="resena">
        <blockquote>&ldquo;${texto}&rdquo;</blockquote>
        <figcaption><strong>${autor}</strong> ${prop.nombre}</figcaption>
      </figure>`
    )
    .join('');

  /* ---------- panel de reserva ---------- */

  $('#precioNoche').textContent = pesos(prop.precio);
  $('#ratingPanel').innerHTML = `${Icono.estrella} ${prop.rating} · ${prop.resenas}`;
  $('#pieSincro').innerHTML = `${Icono.candado} <span id="textoSincro">Agenda sincronizada con Airbnb ${textoSincronizacion()}</span>`;

  const selHuespedes = $('#huespedesProp');
  selHuespedes.innerHTML = Array.from(
    { length: prop.huespedes },
    (_, i) => `<option value="${i + 1}">${plural(i + 1, 'huésped', 'huéspedes')}</option>`
  ).join('');
  selHuespedes.value = String(estado.huespedes);
  selHuespedes.addEventListener('change', () => {
    estado.huespedes = Number(selHuespedes.value);
  });

  const calendario = new Calendario($('#calProp'), {
    propiedad: prop,
    entrada: estado.entrada,
    salida: estado.salida,
    alCambiar: (entrada, salida) => {
      estado.entrada = entrada;
      estado.salida = salida;
      pintarReserva();
    }
  });

  function pintarReserva() {
    const txtEntrada = $('#txtEntrada');
    const txtSalida = $('#txtSalida');

    txtEntrada.textContent = estado.entrada ? Fechas.corta(estado.entrada) : 'Elegir';
    txtSalida.textContent = estado.salida ? Fechas.corta(estado.salida) : 'Elegir';
    txtEntrada.classList.toggle('vacia', !estado.entrada);
    txtSalida.classList.toggle('vacia', !estado.salida);

    const listo = estado.entrada && estado.salida;
    $('#btnReservar').disabled = !listo;

    if (!listo) {
      $('#desglose').innerHTML = `
        <li class="desglose__nota" style="display:block">
          Elige tus fechas en el calendario y aquí aparece el total exacto,
          sin cargos escondidos.
        </li>`;
      $('#btnWhats').href = enlaceWhatsApp(
        `Hola, me interesa ${prop.nombre} (${prop.zona}). ¿Qué fechas tienen libres?`
      );
      return;
    }

    const c = cotizar(prop, estado.entrada, estado.salida);
    $('#desglose').innerHTML = `
      <li><span>${pesos(c.promedio)} promedio × ${plural(c.noches, 'noche', 'noches')}</span><span>${pesos(c.alojamiento)}</span></li>
      ${c.descuento ? `<li class="descuento"><span>Descuento por semana (10%)</span><span>-${pesos(c.descuento)}</span></li>` : ''}
      <li><span>Limpieza</span><span>${pesos(c.limpieza)}</span></li>
      <li class="total"><span>Total</span><span>${pesos(c.total)}</span></li>
      ${c.hayFinDeSemana ? '<li class="desglose__nota" style="display:block">Incluye tarifa de viernes y sábado.</li>' : ''}
    `;

    $('#btnWhats').href = enlaceWhatsApp(mensajeReserva(prop, estado, c));
  }

  $('#btnReservar').addEventListener('click', () => {
    if (!estado.entrada || !estado.salida) return;
    const c = cotizar(prop, estado.entrada, estado.salida);
    const enlace = enlaceAirbnb(prop, estado.entrada, estado.salida, estado.huespedes);

    abrirModal(`
      <h3>Tu estancia</h3>
      <p>Así queda la reserva. Puedes confirmarla por WhatsApp o terminar el pago en Airbnb.</p>
      <ul class="resumen">
        <li><span>Propiedad</span><span>${prop.nombre}</span></li>
        <li><span>Llegada</span><span>${Fechas.larga(estado.entrada)}</span></li>
        <li><span>Salida</span><span>${Fechas.larga(estado.salida)}</span></li>
        <li><span>Huéspedes</span><span>${estado.huespedes}</span></li>
        <li><span>Total por ${plural(c.noches, 'noche', 'noches')}</span><span>${pesos(c.total)}</span></li>
      </ul>
      <p class="min tenue" style="margin-bottom:10px">
        En el sitio publicado, este botón abre el anuncio en Airbnb con las fechas ya cargadas:
      </p>
      <code class="enlace-demo">${enlace}</code>
      <div class="modal__acciones">
        <a class="btn btn--acento" href="${enlaceWhatsApp(mensajeReserva(prop, estado, c))}" target="_blank" rel="noopener">
          ${Icono.whatsapp} Confirmar por WhatsApp
        </a>
        <button type="button" class="btn btn--linea" id="btnCopiar">Copiar enlace</button>
      </div>
    `);

    $('#btnCopiar').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(enlace);
        avisar('Enlace copiado.');
      } catch (err) {
        avisar('Copia el enlace manualmente.');
      }
    });
  });

  pintarReserva();
  setInterval(() => {
    const t = $('#textoSincro');
    if (t) t.textContent = `Agenda sincronizada con Airbnb ${textoSincronizacion()}`;
  }, 60000);

  /* ---------- otras propiedades ---------- */

  const similares = PROPIEDADES.filter((p) => p.id !== prop.id)
    .sort((a, b) => (a.entorno === prop.entorno ? -1 : 1) - (b.entorno === prop.entorno ? -1 : 1))
    .slice(0, 3);

  $('#carteraSimilares').innerHTML = similares.map((p) => tarjeta(p, estado)).join('');
  $$('#carteraSimilares .ficha').forEach((el) => el.classList.add('visible'));
}

function mensajeReserva(prop, estado, c) {
  return (
    `Hola, quiero reservar ${prop.nombre} (${prop.zona}). ` +
    `Del ${Fechas.corta(estado.entrada)} al ${Fechas.corta(estado.salida)}, ` +
    `${plural(c.noches, 'noche', 'noches')}, ${plural(estado.huespedes, 'huésped', 'huéspedes')}. ` +
    `El sitio me marca ${pesos(c.total)} en total. ¿Me confirman disponibilidad?`
  );
}

/* --------------------------------------------------------------------------
   Visor de fotografías
   -------------------------------------------------------------------------- */

function montarVisor(prop) {
  const visor = $('#visor');
  const img = $('#visorImg');
  const cuenta = $('#visorCuenta');
  let indice = 0;

  function mostrar(i) {
    indice = (i + prop.fotos.length) % prop.fotos.length;
    img.src = foto(prop.fotos[indice], 1600);
    img.alt = `${prop.nombre} — foto ${indice + 1}`;
    cuenta.textContent = `${indice + 1} / ${prop.fotos.length}`;
  }

  function abrir(i) {
    mostrar(i);
    visor.classList.add('abierto');
    document.body.style.overflow = 'hidden';
  }

  function cerrar() {
    visor.classList.remove('abierto');
    document.body.style.overflow = '';
  }

  $('#galeria').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-indice]');
    if (btn) abrir(Number(btn.dataset.indice));
  });

  $('#visorCerrar').addEventListener('click', cerrar);
  visor.addEventListener('click', (e) => {
    if (e.target === visor) cerrar();
  });
  $$('[data-visor]').forEach((b) =>
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      mostrar(indice + Number(b.dataset.visor));
    })
  );

  document.addEventListener('keydown', (e) => {
    if (!visor.classList.contains('abierto')) return;
    if (e.key === 'Escape') cerrar();
    if (e.key === 'ArrowRight') mostrar(indice + 1);
    if (e.key === 'ArrowLeft') mostrar(indice - 1);
  });
}

document.addEventListener('DOMContentLoaded', iniciarPropiedad);
