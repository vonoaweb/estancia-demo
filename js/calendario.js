/* ==========================================================================
   Calendario de disponibilidad
   Dibuja uno o dos meses, marca las noches que llegan de la agenda de Airbnb
   y permite elegir un rango de estancia con las mismas reglas del anfitrion:
   mínimo de noches, sin noches ocupadas en medio y salida permitida el dia
   en que entra el siguiente huésped.
   ========================================================================== */

const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

class Calendario {
  constructor(contenedor, opciones = {}) {
    this.el = contenedor;
    this.prop = opciones.propiedad || null;
    this.minNoches = opciones.minNoches || (this.prop ? this.prop.minNoches : 1);
    this.mesesPedidos = opciones.meses || 1;
    this.soloLectura = !!opciones.soloLectura;
    this.alCambiar = opciones.alCambiar || function () {};

    this.entrada = opciones.entrada || null;
    this.salida = opciones.salida || null;
    this.previo = null;   // dia bajo el cursor mientras se elige la salida
    this.aviso = '';

    const referencia = this.entrada || Fechas.hoy();
    this.mesBase = new Date(referencia.getFullYear(), referencia.getMonth(), 1);

    if (this.soloLectura && !this.entrada) {
      const finDeMes = new Date(referencia.getFullYear(), referencia.getMonth() + 1, 0).getDate();
      if (finDeMes - referencia.getDate() < 12) this.mesBase.setMonth(this.mesBase.getMonth() + 1);
    }

    this.el.classList.add('cal');
    if (this.soloLectura) this.el.classList.add('cal--lectura');
    this.conectar();
    this.dibujar();

    // Dos meses en escritorio, uno en movil: se vuelve a dibujar solo si cambia.
    if (this.mesesPedidos === 2) {
      let visibles = this.meses;
      window.addEventListener('resize', () => {
        if (this.meses !== visibles) {
          visibles = this.meses;
          this.dibujar();
        }
      });
    }
  }

  /* ---------- estado ---------- */

  get meses() {
    return this.mesesPedidos === 2 && window.innerWidth >= 880 ? 2 : 1;
  }

  ocupada(fecha) {
    return this.prop ? nocheOcupada(this.prop, fecha) : false;
  }

  limpiar() {
    this.entrada = null;
    this.salida = null;
    this.previo = null;
    this.aviso = '';
    this.dibujar();
    this.alCambiar(null, null);
  }

  fijar(entrada, salida) {
    this.entrada = entrada;
    this.salida = salida;
    this.previo = null;
    this.aviso = '';
    if (entrada) this.mesBase = new Date(entrada.getFullYear(), entrada.getMonth(), 1);
    this.dibujar();
  }

  /* ---------- interaccion ---------- */

  conectar() {
    if (this.soloLectura) return;

    this.el.addEventListener('click', (e) => {
      const nav = e.target.closest('[data-mover]');
      if (nav) {
        this.mover(Number(nav.dataset.mover));
        return;
      }
      const dia = e.target.closest('.cal__dia');
      if (dia && !dia.disabled) this.elegir(Fechas.desdeClave(dia.dataset.fecha));
    });

    this.el.addEventListener('mouseover', (e) => {
      const dia = e.target.closest('.cal__dia');
      if (!dia || !this.entrada || this.salida) return;
      const fecha = Fechas.desdeClave(dia.dataset.fecha);
      const alcanzable = fecha > this.entrada && (!this.prop || rangoLibre(this.prop, this.entrada, fecha));
      if (alcanzable !== !!this.previo || (alcanzable && +fecha !== +this.previo)) {
        this.previo = alcanzable ? fecha : null;
        this.pintarRango();
      }
    });

    this.el.addEventListener('mouseleave', () => {
      if (this.previo) {
        this.previo = null;
        this.pintarRango();
      }
    });
  }

  mover(paso) {
    const destino = new Date(this.mesBase.getFullYear(), this.mesBase.getMonth() + paso, 1);
    const primero = Fechas.hoy();
    const limite = new Date(primero.getFullYear(), primero.getMonth(), 1);
    const tope = Fechas.suma(primero, HORIZONTE);
    if (destino < limite) return;
    if (destino > new Date(tope.getFullYear(), tope.getMonth(), 1)) return;
    this.mesBase = destino;
    this.dibujar();
  }

  elegir(fecha) {
    const hoy = Fechas.hoy();
    if (fecha < hoy) return;

    // Empezar de nuevo: no hay entrada, ya hay rango completo, o se retrocede.
    if (!this.entrada || this.salida || fecha <= this.entrada) {
      if (this.ocupada(fecha)) {
        this.aviso = 'Esa noche ya está reservada.';
        this.previo = null;
        this.dibujar();
        return;
      }
      this.entrada = fecha;
      this.salida = null;
      this.previo = null;
      this.aviso = this.minNoches > 1
        ? `Elige la salida (mínimo ${plural(this.minNoches, 'noche', 'noches')}).`
        : 'Elige la fecha de salida.';
      this.dibujar();
      this.alCambiar(this.entrada, null);
      return;
    }

    const noches = Fechas.noches(this.entrada, fecha);

    if (this.prop && !rangoLibre(this.prop, this.entrada, fecha)) {
      this.aviso = 'Hay noches reservadas dentro de ese rango.';
      this.previo = null;
      this.dibujar();
      return;
    }
    if (noches < this.minNoches) {
      this.aviso = `La estancia mínima es de ${plural(this.minNoches, 'noche', 'noches')}.`;
      this.previo = null;
      this.dibujar();
      return;
    }

    this.salida = fecha;
    this.previo = null;
    this.aviso = '';
    this.dibujar();
    this.alCambiar(this.entrada, this.salida);
  }

  /* ---------- dibujo ---------- */

  dibujar() {
    const meses = [];
    for (let i = 0; i < this.meses; i++) {
      meses.push(this.dibujarMes(new Date(this.mesBase.getFullYear(), this.mesBase.getMonth() + i, 1)));
    }

    this.el.innerHTML = `
      <div class="cal__barra">
        <button type="button" class="cal__nav" data-mover="-1" aria-label="Mes anterior">${flecha('izq')}</button>
        <div class="cal__meses-titulo">${meses.map((m) => `<span>${m.titulo}</span>`).join('')}</div>
        <button type="button" class="cal__nav" data-mover="1" aria-label="Mes siguiente">${flecha('der')}</button>
      </div>
      <div class="cal__meses">${meses.map((m) => m.html).join('')}</div>
      ${this.soloLectura ? '' : `
        <div class="cal__pie">
          <ul class="cal__leyenda">
            <li><span class="punto punto--libre"></span>Disponible</li>
            <li><span class="muestra-ocupado">15</span>Reservado</li>
          </ul>
          <p class="cal__aviso" role="status">${this.aviso}</p>
        </div>`}
    `;
    this.pintarRango();
  }

  dibujarMes(mes) {
    const hoy = Fechas.hoy();
    const días = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
    const arranque = Fechas.columna(mes);
    const celdas = [];

    for (let i = 0; i < arranque; i++) celdas.push('<span class="cal__hueco"></span>');

    for (let d = 1; d <= días; d++) {
      const fecha = new Date(mes.getFullYear(), mes.getMonth(), d);
      const clave = Fechas.clave(fecha);
      const pasado = fecha < hoy;
      const ocupada = this.ocupada(fecha);
      const clases = ['cal__dia'];

      if (pasado) clases.push('cal__dia--pasado');
      if (ocupada) clases.push('cal__dia--ocupado');
      if (Fechas.clave(hoy) === clave) clases.push('cal__dia--hoy');

      if (this.soloLectura) {
        celdas.push(`<span class="${clases.join(' ')}" data-fecha="${clave}">${d}</span>`);
        continue;
      }

      // Un dia ocupado solo se puede pulsar como salida de una estancia en curso.
      const comoSalida = this.entrada && !this.salida && fecha > this.entrada;
      const inerte = pasado || (ocupada && !comoSalida);

      celdas.push(
        `<button type="button" class="${clases.join(' ')}" data-fecha="${clave}"` +
        `${inerte ? ' disabled' : ''} aria-label="${Fechas.larga(fecha)}${ocupada ? ', reservado' : ''}">${d}</button>`
      );
    }

    return {
      titulo: Fechas.mes(mes),
      html: `<div class="cal__mes">
        <div class="cal__semana">${DIAS_SEMANA.map((d, i) => `<span aria-hidden="true" class="${i > 4 ? 'es-finde' : ''}">${d}</span>`).join('')}</div>
        <div class="cal__grid">${celdas.join('')}</div>
      </div>`
    };
  }

  /* Marca entrada, salida y noches intermedias sin volver a construir el DOM */
  pintarRango() {
    if (this.soloLectura) return;
    const fin = this.salida || this.previo;

    this.el.querySelectorAll('.cal__dia').forEach((celda) => {
      const fecha = Fechas.desdeClave(celda.dataset.fecha);
      celda.classList.remove('cal__dia--entrada', 'cal__dia--salida', 'cal__dia--rango', 'cal__dia--tentativo');
      if (!this.entrada) return;

      const esEntrada = +fecha === +this.entrada;
      const esSalida = fin && +fecha === +fin;
      const enMedio = fin && fecha > this.entrada && fecha < fin;

      if (esEntrada) celda.classList.add('cal__dia--entrada');
      if (esSalida) celda.classList.add('cal__dia--salida');
      if (enMedio) celda.classList.add('cal__dia--rango');
      if (!this.salida && (esSalida || enMedio)) celda.classList.add('cal__dia--tentativo');
    });
  }
}

function flecha(dir) {
  const d = dir === 'izq' ? 'M14 5l-7 7 7 7' : 'M10 5l7 7-7 7';
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
}
