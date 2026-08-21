# Estancia — demo de sitio para propiedades en Airbnb

Demo funcional para mostrar a un cliente que administra propiedades en Airbnb y
quiere un sitio propio con la disponibilidad de cada casa. Hecho por **Vonoa Web**.

HTML, CSS y JavaScript planos: sin build, sin dependencias, sin backend.

Se publica en GitHub Pages desde `main`.

## Ver en local

```
python -m http.server 3005
```

Y abrir `http://localhost:3005`.

## Qué se puede enseñar en la junta

1. **Buscador por fechas** en la portada: se eligen llegada y salida y la cartera
   se reduce a las propiedades libres, con el total de la estancia en cada tarjeta.
2. **Panel "Disponibilidad en vivo"**: el calendario de cualquiera de las seis
   propiedades, con el sello de última sincronización.
3. **Ficha de propiedad**: galería, amenidades, reglas y el panel de reserva con
   calendario, desglose de precio y los dos caminos de cierre (WhatsApp o Airbnb).
4. **Reglas reales del calendario**: mínimo de noches, no se puede atravesar una
   noche ocupada, y sí se puede salir el mismo día en que entra el siguiente
   huésped.

## La agenda de Airbnb

Airbnb publica el calendario de cada anuncio en un enlace iCal privado
(Anuncio › Disponibilidad › Sincronizar calendarios). El sitio de producción lee
ese enlace cada pocos minutos y marca las noches ocupadas — reservas de Airbnb,
bloqueos manuales y fechas que vengan de otras plataformas.

Esta demo **no** está conectada a ninguna cuenta: `js/data.js` genera una
ocupación realista y estable a partir de la fecha de hoy, para poder mostrar el
flujo completo sin pedirle accesos al cliente. Al pasar a producción se cambia
el generador por la lectura del iCal; el resto del sitio no se toca.

Lo que sí requiere servidor en la versión real:

- Un proceso que baje los iCal y los guarde (Airbnb no permite leerlos desde el
  navegador por CORS).
- Tarifas por temporada, si se quieren distintas a la regla actual
  (fin de semana +18%, 10% de descuento a partir de siete noches).
- Cobro en línea, si se quiere reservar sin pasar por Airbnb.

## Personalizar

Casi todo vive en `js/data.js`:

- `CONFIG` — marca, **número de WhatsApp**, correo, ciudad y frecuencia de
  sincronización. El número apunta a Vonoa mientras el cliente no dé el suyo,
  para que el botón abra un chat real durante la demo.
- `PROPIEDADES` — las seis propiedades: nombre, zona, capacidad, tarifa, limpieza,
  mínimo de noches, amenidades, textos y fotos. `airbnbId` es el número del
  anuncio: con él se arma el enlace directo a Airbnb con las fechas ya cargadas.
- `AMENIDADES` — catálogo de servicios; los iconos están en `js/main.js`.

Las fotos son de muestra (Unsplash). Para usar las del cliente se copian los
archivos a `rentas/img/` y en `fotos` se pone la ruta, por ejemplo
`'img/loft-sala.jpg'`. Si alguna foto no carga, el marco se degrada a un bloque
con el nombre de la propiedad en lugar de romper la retícula.

## Archivos

```
├── index.html          portada, cartera, agenda, propietarios, FAQ, contacto
├── propiedad.html      ficha con galería y panel de reserva
├── css/styles.css      sistema de diseño completo
└── js/
    ├── data.js         propiedades, disponibilidad y precios
    ├── calendario.js   componente de calendario
    ├── main.js         piezas compartidas y portada
    └── propiedad.js    ficha de propiedad
```
