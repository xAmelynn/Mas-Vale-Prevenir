/* + Vale Prevenir | Índices editoriales, tomados de la página 2 de cada PDF.
   Archivo independiente para que actualizar_revistas.py no sobrescriba los índices. */
const indicesRevistas = {
  '2026-02': [
    ['Carta del Subdirector de Prevención y Protección a la Salud',3],
    ['El Sabor del ISSSTE',4],['Sarampión',11],
    ['Febrero, mes de la salud del hombre',19],['Efemérides',31],['Galería',43]
  ],
  '2026-03': [
    ['Carta del Subdirector de Prevención y Protección a la Salud',3],
    ['El Sabor del ISSSTE',4],['Sarampión',10],
    ['Marzo, mes de la salud de la mujer',16],['Efemérides',26],
    ['Galería',39],['Concurso de dibujo infantil',49]
  ],
  '2026-04': [
    ['Carta del Subdirector de Prevención y Protección a la Salud',3],
    ['El Sabor del ISSSTE',4],['Vacunación',10],
    ['Abril, mes de las infancias',19],['Efemérides',28],
    ['Galería',42],['Diplomado de Micobacteriosis',56]
  ],
  '2026-05': [
    ['Carta del Subdirector de Prevención y Protección a la Salud',3],
    ['El Sabor del ISSSTE',4],
    ['Mayo, mes de fortalecimiento de la higiene de manos y prevención de infecciones',10],
    ['Ola de calor',23],['Semana Nacional de Salud Pública 2026',29],
    ['Efemérides',37],['Galería',52],
    ['Convocatoria de ilustración «Manitas Limpias»',61]
  ],
  '2026-06': [
    ['Carta del Subdirector de Prevención y Protección a la Salud',3],
    ['El Sabor del ISSSTE',4],['+ Nutrición',10],
    ['Junio, mes de las pruebas de tamizaje',15],
    ['Mundial Social 2026',23],['Efemérides',36],['Galería',43]
  ],
  '2026-07': [
    ['Carta del Subdirector de Prevención y Protección a la Salud',3],
    ['El Sabor del ISSSTE',4],
    ['Julio, mes de la prevención integral del VIH (PrEP-PEP) y las hepatitis virales',11],
    ['Mundial Social 2026',21],['Efemérides',35],['Galería',39]
  ]
};

(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const catalogo = (typeof revistas !== 'undefined' && Array.isArray(revistas)) ? revistas : [];
  const ultima = [...catalogo].sort((a,b)=>b.id.localeCompare(a.id))[0];
  const toc = $('toc');
  const tocBtn = $('tocBtn');
  const lista = document.querySelector('.sections-list');
  if (!toc || !tocBtn || !ultima) return;
  let edicionSeleccionada = ultima.id;

  function irAPagina(numero) {
    const entrada = $('pageInput');
    if (!entrada) return;
    entrada.value = String(numero);
    entrada.dispatchEvent(new Event('change', {bubbles:true}));
  }

  function construirIndice(id) {
    const edicion = catalogo.find(r=>r.id===id);
    if (!edicion) return;
    edicionSeleccionada=id;
    const items = [['Portada',1],['Índice',2],...(indicesRevistas[id]||[])];
    toc.replaceChildren();
    const encabezado=document.createElement('strong');
    encabezado.textContent='Índice de contenidos · '+edicion.fecha;
    toc.appendChild(encabezado);
    for (const [nombre,pagina] of items) {
      if (pagina>edicion.paginas) continue;
      const boton=document.createElement('button');
      boton.type='button';
      boton.dataset.indicePagina=String(pagina);
      boton.append(document.createTextNode(nombre));
      const numero=document.createElement('span');
      numero.textContent=String(pagina);
      boton.appendChild(numero);
      boton.addEventListener('click',()=>{
        irAPagina(pagina);
        // El índice permanece abierto hasta que se pulse Índice de nuevo.
      });
      toc.appendChild(boton);
    }
    toc.hidden=true;
    // El script anterior oculta este botón en ediciones distintas de marzo.
    tocBtn.hidden=false;
  }

  function abrirEdicion(id,pagina) {
    const tarjeta=document.querySelector('#archiveGrid [data-revista="'+id+'"]');
    if (!tarjeta) return;
    tarjeta.click();
    if (pagina && pagina!==1) irAPagina(pagina);
  }

  // El lector original procesa el clic antes de que llegue al documento.
  document.addEventListener('click', e=>{
    const tarjeta=e.target.closest?.('#archiveGrid [data-revista]');
    if (tarjeta) {
      construirIndice(tarjeta.dataset.revista);
      return;
    }
    if (e.target.closest?.('#readNow, #openCover')) {
      construirIndice(ultima.id);
      return;
    }
    const enlaceSeccion=e.target.closest?.('[data-index-edicion][data-index-page]');
    if (enlaceSeccion) {
      abrirEdicion(enlaceSeccion.dataset.indexEdicion,Number(enlaceSeccion.dataset.indexPage));
    }
  });

  // Índice actualizado de la edición más reciente en la página principal.
  if (lista) {
    lista.replaceChildren();
    const items=(indicesRevistas[ultima.id]||[]).filter(([,pagina])=>pagina>=4);
    const colores=['#9d2449','#761738','#b76a88','#b38e5d','#4d0c27'];
    const iconos={
      'El Sabor del ISSSTE':'cubiertos.svg',
      'Efemérides':'efemerides.svg',
      'Galería':'galeria.svg',
      'Mundial Social 2026':'balonfutbol.svg'
    };
    for (const [i,[nombre,pagina]] of items.entries()) {
      const boton=document.createElement('button');
      boton.type='button';
      boton.className='section-card';
      boton.dataset.indexEdicion=ultima.id;
      boton.dataset.indexPage=String(pagina);
      boton.setAttribute('aria-label',`Abrir ${nombre}, página ${pagina}`);
      const color=colores[i%colores.length];
      boton.style.setProperty('--section-color',color);
      boton.style.setProperty('--section-image',`url('${ultima.carpetaPaginas}${String(pagina).padStart(2,'0')}.webp')`);
      const icono=iconos[nombre]||'calendario.svg';
      boton.style.setProperty('--section-icon',`url('assets/icons/${icono}')`);
      const visual=document.createElement('span');visual.className='section-icon';visual.setAttribute('aria-hidden','true');
      const cuerpo=document.createElement('span');cuerpo.className='section-card-body';
      const titulo=document.createElement('strong');titulo.textContent=nombre;
      const subtitulo=document.createElement('small');subtitulo.textContent=`Página ${pagina}`;
      cuerpo.append(titulo,subtitulo);
      const flecha=document.createElement('span');flecha.className='section-arrow';flecha.setAttribute('aria-hidden','true');flecha.innerHTML='<img class="flecha-svg" src="assets/icons/flecha-derecha.svg" alt="" aria-hidden="true">';
      boton.append(visual,cuerpo,flecha);
      lista.appendChild(boton);
    }
    const intro=document.querySelector('.sections-intro p');
    if (intro) intro.textContent=`Descubre los temas de ${ultima.fecha} y accede directamente a cada sección.`;
    const verCompleta=document.querySelector('.sections-intro [data-page]');
    if (verCompleta) {
      // Sustituir botón antiguo para evitar su evento fijo que abría marzo.
      const reemplazo=verCompleta.cloneNode(true);
      reemplazo.removeAttribute('data-page');
      reemplazo.addEventListener('click',()=>abrirEdicion(ultima.id,1));
      verCompleta.replaceWith(reemplazo);
    }
  }
  construirIndice(ultima.id);
})();
