/* ==========================================================================
   ESTANCIA — Demo de sitio para propiedades administradas en Airbnb
   Vonoa Web

   Este archivo concentra TODO lo que se cambia al personalizar la demo:
   datos de contacto, propiedades, fotos y tarifas.

   Sobre la agenda: Airbnb publica el calendario de cada anuncio en un enlace
   iCal (Anuncio › Disponibilidad › Sincronizar calendarios). El sitio real lee
   ese enlace cada pocos minutos y marca las noches ocupadas. Esta demo genera
   una ocupación realista y estable para poder mostrar el flujo completo sin
   conectar todavia las cuentas del cliente.
   ========================================================================== */

const CONFIG = {
  marca: 'Estancia',
  descriptor: 'Casas de temporada',
  // ↓↓↓ Reemplazar por el numero del cliente (52 + 1 + 10 dígitos, sin espacios) ↓↓↓
  // Mientras tanto apunta a Vonoa, para que el botón abra un chat real en la demo.
  whatsapp: '5215644645574',
  correo: 'hola@estancia.mx',
  telefono: '56 4464 5574',
  ciudad: 'Monterrey, Nuevo León',
  // Cada cuantos minutos corre la sincronización con Airbnb en el sitio real.
  minutosSincronizacion: 15
};

/* --------------------------------------------------------------------------
   Utilidades de fecha
   Todo se maneja a medianoche en hora local: las claves ISO se arman a mano
   para evitar el corrimiento de zona horaria de toISOString().
   -------------------------------------------------------------------------- */

const Fechas = {
  hoy() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  },

  clave(d) {
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mes}-${dia}`;
  },

  desdeClave(s) {
    const [a, m, d] = s.split('-').map(Number);
    return new Date(a, m - 1, d);
  },

  suma(d, días) {
    const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    r.setDate(r.getDate() + días);
    return r;
  },

  noches(a, b) {
    return Math.round((b - a) / 86400000);
  },

  esFinDeSemana(d) {
    const dia = d.getDay();
    return dia === 5 || dia === 6; // viernes y sábado
  },

  // Lunes = 0 ... Domingo = 6 (la semana en Mexico arranca en lunes)
  columna(d) {
    return (d.getDay() + 6) % 7;
  },

  corta(d) {
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', '');
  },

  larga(d) {
    return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'long' }).replace('.', '');
  },

  mes(d) {
    const t = d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }).replace(' de ', ' ');
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
};

/* --------------------------------------------------------------------------
   Generador determinista
   La misma propiedad produce siempre la misma agenda dentro del mismo dia,
   y como todo se calcula a partir de "hoy", la demo nunca se ve vencida.
   -------------------------------------------------------------------------- */

function semilla(texto) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function azar(estado) {
  let s = estado;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HORIZONTE = 300; // días de calendario que trae la sincronización

/* Arma las reservas de una propiedad: bloques de 2 a 6 noches separados por
   huecos de 1 a 6 días. Ronda un 55% de ocupación, como una propiedad sana. */
function generarReservas(prop) {
  const rnd = azar(semilla(prop.id));
  const reservas = [];
  // Arranca 45 dias antes de hoy: asi el mes en curso llega completo aunque la
  // demo se abra un dia 28. Con -12 los primeros dias del mes salian vacios en
  // las seis propiedades y el panel mostraba una ocupacion irreal.
  let cursor = -45;

  while (cursor < HORIZONTE) {
    cursor += 1 + Math.floor(rnd() * 6);
    const noches = 2 + Math.floor(rnd() * 5);
    if (cursor >= HORIZONTE) break;
    reservas.push({
      inicio: cursor,
      noches,
      canal: rnd() > 0.22 ? 'Airbnb' : 'Directa',
      huespedes: 1 + Math.floor(rnd() * prop.huespedes)
    });
    cursor += noches;
  }
  return reservas;
}

const cacheAgenda = new Map();

/* Devuelve { ocupadas: Set de claves de noche, reservas: [...] } */
function agendaDe(prop) {
  if (cacheAgenda.has(prop.id)) return cacheAgenda.get(prop.id);

  const hoy = Fechas.hoy();
  const reservas = generarReservas(prop);
  const ocupadas = new Set();

  reservas.forEach((r) => {
    r.entrada = Fechas.suma(hoy, r.inicio);
    r.salida = Fechas.suma(hoy, r.inicio + r.noches);
    for (let i = 0; i < r.noches; i++) {
      ocupadas.add(Fechas.clave(Fechas.suma(r.entrada, i)));
    }
  });

  const agenda = { ocupadas, reservas };
  cacheAgenda.set(prop.id, agenda);
  return agenda;
}

function nocheOcupada(prop, fecha) {
  return agendaDe(prop).ocupadas.has(Fechas.clave(fecha));
}

/* Un rango es valido si ninguna de sus NOCHES esta ocupada. El dia de salida
   puede caer sobre una noche ocupada: esa mañana sale un huésped y entra otro,
   igual que en Airbnb. */
function rangoLibre(prop, entrada, salida) {
  if (!entrada || !salida) return false;
  const noches = Fechas.noches(entrada, salida);
  if (noches < 1) return false;
  for (let i = 0; i < noches; i++) {
    if (nocheOcupada(prop, Fechas.suma(entrada, i))) return false;
  }
  return true;
}

function disponible(prop, entrada, salida) {
  if (!entrada || !salida) return true; // sin fechas, no se filtra
  if (Fechas.noches(entrada, salida) < prop.minNoches) return false;
  return rangoLibre(prop, entrada, salida);
}

/* Primer rango libre de al menos minNoches, para sugerir fechas */
function proximaDisponibilidad(prop) {
  const hoy = Fechas.hoy();
  for (let i = 0; i < HORIZONTE - prop.minNoches; i++) {
    const entrada = Fechas.suma(hoy, i);
    const salida = Fechas.suma(entrada, prop.minNoches);
    if (rangoLibre(prop, entrada, salida)) return { entrada, salida };
  }
  return null;
}

/* --------------------------------------------------------------------------
   Precios
   -------------------------------------------------------------------------- */

function precioNoche(prop, fecha) {
  return Fechas.esFinDeSemana(fecha) ? Math.round(prop.precio * 1.18) : prop.precio;
}

function cotizar(prop, entrada, salida) {
  const noches = Fechas.noches(entrada, salida);
  let alojamiento = 0;
  let hayFinDeSemana = false;

  for (let i = 0; i < noches; i++) {
    const dia = Fechas.suma(entrada, i);
    if (Fechas.esFinDeSemana(dia)) hayFinDeSemana = true;
    alojamiento += precioNoche(prop, dia);
  }

  const descuento = noches >= 7 ? Math.round(alojamiento * 0.1) : 0;
  const total = alojamiento - descuento + prop.limpieza;

  return {
    noches,
    alojamiento,
    promedio: Math.round(alojamiento / noches),
    descuento,
    limpieza: prop.limpieza,
    total,
    hayFinDeSemana
  };
}

function pesos(n) {
  return '$' + n.toLocaleString('es-MX');
}

function plural(n, uno, varios) {
  return `${n} ${n === 1 ? uno : varios}`;
}

/* --------------------------------------------------------------------------
   Fotos de muestra (Unsplash)
   Al personalizar se cambian por las fotos del cliente: basta con poner la
   ruta del archivo, por ejemplo 'img/loft-sala.jpg'.
   -------------------------------------------------------------------------- */

function foto(id, ancho = 1200) {
  if (id.includes('/')) return id; // ya es una ruta local
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${ancho}&q=70`;
}

/* --------------------------------------------------------------------------
   Propiedades
   -------------------------------------------------------------------------- */

const PROPIEDADES = [
  {
    id: 'loft-vasconcelos',
    nombre: 'Loft Vasconcelos',
    zona: 'San Pedro Garza García',
    entorno: 'ciudad',
    tipo: 'Loft entero',
    huespedes: 2,
    recamaras: 1,
    camas: 1,
    banos: 1,
    precio: 1850,
    limpieza: 450,
    minNoches: 2,
    rating: 4.94,
    resenas: 128,
    airbnbId: '48213907',
    destacado: false,
    resumen: 'Un piso alto sobre Vasconcelos, con luz de tarde y todo a pie: cafés, oficinas y el parque.',
    descripcion: 'Loft de 62 m² en piso 14, pensado para estancias de trabajo o escapadas de dos. Cocina completa, escritorio frente a la ventana, cama king y blackout en la recámara. El edificio tiene acceso con código, así que la entrada es autónoma a cualquier hora.',
    amenidades: ['wifi', 'cocina', 'escritorio', 'aire', 'lavadora', 'estacionamiento', 'tv', 'gym'],
    fotos: ['1600585154340-be6161a56a0c', '1522708323590-d24dbb6b0267', '1560448204-e02f11c3d0e2', '1584622650111-993a426fbf0a', '1507089947368-19c1da9775ae'],
    detalles: ['Piso 14 con vista a la sierra', 'Check-in autónomo con código', 'Elevador y acceso con vigilancia']
  },
  {
    id: 'casa-sierra-madre',
    nombre: 'Casa Sierra Madre',
    zona: 'Valle Alto, Monterrey',
    entorno: 'ciudad',
    tipo: 'Casa entera',
    huespedes: 8,
    recamaras: 4,
    camas: 5,
    banos: 3,
    precio: 4900,
    limpieza: 1200,
    minNoches: 2,
    rating: 4.89,
    resenas: 74,
    airbnbId: '51902884',
    destacado: false,
    resumen: 'Casa con alberca y jardín al pie de la sierra, hecha para reuniones familiares.',
    descripcion: 'Cuatro recámaras, sala de estar con chimenea y una terraza que da a la alberca. La cocina está equipada para cocinar de verdad y el asador queda junto al comedor exterior. Estacionamiento para tres autos dentro de la propiedad.',
    amenidades: ['wifi', 'alberca', 'asador', 'cocina', 'aire', 'lavadora', 'estacionamiento', 'chimenea', 'tv', 'mascotas'],
    fotos: ['1512917774080-9991f1c4c750', '1560448075-bb485b067938', '1600607687939-ce8a6c25118c', '1571003123894-1f0594d2b5d9', '1600573472550-8090b5e0745e'],
    detalles: ['Alberca climatizada de octubre a marzo', 'Jardín privado de 300 m²', 'Se admiten mascotas con aviso previo']
  },
  {
    id: 'cabana-los-cavazos',
    nombre: 'Cabaña Los Cavazos',
    zona: 'Santiago, Nuevo León',
    entorno: 'sierra',
    tipo: 'Cabaña entera',
    huespedes: 6,
    recamaras: 3,
    camas: 4,
    banos: 2,
    precio: 3200,
    limpieza: 800,
    minNoches: 2,
    rating: 4.97,
    resenas: 96,
    airbnbId: '39471522',
    destacado: true,
    resumen: 'Madera, chimenea y el ruido del río a cuarenta minutos de la ciudad.',
    descripcion: 'Cabaña de dos niveles entre nogales, con terraza cubierta y fogatero. Adentro: chimenea de leña, cocina completa y tres recámaras con edredones de invierno. El río queda a cinco minutos caminando y el pueblo de Santiago a diez en auto.',
    amenidades: ['wifi', 'chimenea', 'asador', 'cocina', 'estacionamiento', 'mascotas', 'vista', 'terraza'],
    fotos: ['1449158743715-0a90ebb6d2d8', '1502005229762-cf1b2da7c5d6', '1505693416388-ac5ce068fe85', '1441974231531-c6227db76b6e', '1506905925346-21bda4d32df4'],
    detalles: ['Leña y fogatero incluidos', 'Señal de celular limitada, wifi estable', 'Camino pavimentado hasta la puerta']
  },
  {
    id: 'suite-barrio-antiguo',
    nombre: 'Suite Barrio Antiguo',
    zona: 'Centro, Monterrey',
    entorno: 'ciudad',
    tipo: 'Suite entera',
    huespedes: 3,
    recamaras: 1,
    camas: 2,
    banos: 1,
    precio: 1450,
    limpieza: 400,
    minNoches: 1,
    rating: 4.86,
    resenas: 211,
    airbnbId: '27884310',
    destacado: false,
    resumen: 'Casona restaurada del Barrio Antiguo, a dos calles de la Macroplaza.',
    descripcion: 'Suite en planta baja de una casona de 1910, con techos altos, piso de pasta original y patio interior. Ideal para fines de semana en el centro: bares, museos y el paseo Santa Lucía a caminata corta.',
    amenidades: ['wifi', 'cocina', 'aire', 'tv', 'lavadora', 'terraza'],
    fotos: ['1600566753086-00f18fb6b3ea', '1493809842364-78817add7ffb', '1484154218962-a197022b5858', '1552321554-5fefe8c9ef14', '1616594039964-ae9021a400a0'],
    detalles: ['Patio interior privado', 'Una noche mínima entre semana', 'Estacionamiento público a media cuadra']
  },
  {
    id: 'villa-presa-la-boca',
    nombre: 'Villa Presa La Boca',
    zona: 'Santiago, Nuevo León',
    entorno: 'sierra',
    tipo: 'Villa entera',
    huespedes: 10,
    recamaras: 5,
    camas: 7,
    banos: 4,
    precio: 7400,
    limpieza: 1800,
    minNoches: 2,
    rating: 4.92,
    resenas: 43,
    airbnbId: '60113745',
    destacado: true,
    resumen: 'Vista abierta a la presa, alberca infinita y espacio para diez personas.',
    descripcion: 'Villa de dos plantas sobre la ladera, con ventanales de piso a techo hacia la presa. Alberca desbordante, sala exterior con asador y cocina de isla. Se renta completa; recibimos grupos y eventos pequeños con acuerdo previo.',
    amenidades: ['wifi', 'alberca', 'asador', 'cocina', 'aire', 'lavadora', 'estacionamiento', 'vista', 'terraza', 'tv'],
    fotos: ['1586528116311-ad8dd3c8310d', '1613490493576-7fde63acd811', '1600607687920-4e2a09cf159d', '1540518614846-7eded433c457', '1590490360182-c33d57733427'],
    detalles: ['Alberca desbordante con vista a la presa', 'Capacidad para 10 huéspedes', 'Eventos pequeños previa autorización']
  },
  {
    id: 'depto-valle-oriente',
    nombre: 'Depto Valle Oriente',
    zona: 'San Pedro Garza García',
    entorno: 'ciudad',
    tipo: 'Departamento entero',
    huespedes: 4,
    recamaras: 2,
    camas: 3,
    banos: 2,
    precio: 2300,
    limpieza: 550,
    minNoches: 2,
    rating: 4.9,
    resenas: 157,
    airbnbId: '44560218',
    destacado: false,
    resumen: 'Dos recámaras en Valle Oriente, con roof garden y alberca del edificio.',
    descripcion: 'Departamento de 95 m² a cinco minutos de los corporativos de Valle Oriente. Dos recámaras con baño cada una, sala amplia y cocina integral. El edificio suma roof garden, alberca y gimnasio, incluidos en la estancia.',
    amenidades: ['wifi', 'alberca', 'cocina', 'aire', 'lavadora', 'estacionamiento', 'gym', 'tv', 'escritorio'],
    fotos: ['1502672260266-1c1ef2d93688', '1560185893-a55cbc8c57e8', '1600210492486-724fe5c67fb0', '1556911220-bff31c812dba', '1571896349842-33c89424de2d'],
    detalles: ['Roof garden y alberca del edificio', 'Un cajón de estacionamiento techado', 'Recepción 24 horas']
  }
];

const AMENIDADES = {
  wifi: 'Wifi de fibra',
  cocina: 'Cocina equipada',
  alberca: 'Alberca',
  asador: 'Asador',
  aire: 'Aire acondicionado',
  chimenea: 'Chimenea',
  lavadora: 'Lavadora y secadora',
  estacionamiento: 'Estacionamiento',
  tv: 'Smart TV',
  gym: 'Gimnasio',
  mascotas: 'Pet friendly',
  vista: 'Vista panorámica',
  terraza: 'Terraza',
  escritorio: 'Espacio de trabajo'
};

function propiedadPorId(id) {
  return PROPIEDADES.find((p) => p.id === id) || null;
}

/* Resumen de la cartera para el panel de sincronización */
function resumenCartera() {
  const hoy = Fechas.hoy();
  let nochesOcupadas = 0;
  let reservas = 0;
  let porAirbnb = 0;

  PROPIEDADES.forEach((prop) => {
    const { reservas: lista } = agendaDe(prop);
    lista.forEach((r) => {
      if (r.inicio >= 0 && r.inicio < 90) {
        reservas++;
        if (r.canal === 'Airbnb') porAirbnb++;
      }
    });
    for (let i = 0; i < 90; i++) {
      if (nocheOcupada(prop, Fechas.suma(hoy, i))) nochesOcupadas++;
    }
  });

  return {
    propiedades: PROPIEDADES.length,
    reservas,
    porAirbnb,
    ocupacion: Math.round((nochesOcupadas / (PROPIEDADES.length * 90)) * 100),
    rating: (PROPIEDADES.reduce((s, p) => s + p.rating, 0) / PROPIEDADES.length).toFixed(2)
  };
}
