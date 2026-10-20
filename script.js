/* + Vale Prevenir | Interacciones del prototipo */

(()=> {
  'use strict';
  let revistaActual = revistas.find((revista) => revista.id === "2026-03") || revistas[0];

  let total = revistaActual.paginas;

  let page = 1;
  let zoom = 1;
  let previousFocus = null;
  let bookMode = false;
  let animating = false;
  const rightImage = document.getElementById("readerImageRight");
  const pagesWrap = document.getElementById("readerPages");
  const bookBtn = document.getElementById("bookModeBtn");

  const $=id=>document.getElementById(id);
  const reader=$('reader'),image=$('readerImage'),stage=$('pageStage'),toc=$('toc'); 
  function cargarHemeroteca() {
    const contenedor = $('archiveGrid');

    if (!contenedor) return;

    contenedor.innerHTML = '';

    revistas.forEach((revista) => {
        const tarjeta = document.createElement('button');

        tarjeta.type = 'button';
        tarjeta.className = 'archive-card';
        tarjeta.dataset.revista = revista.id;

        tarjeta.innerHTML = `
            <img
                src="${revista.portada}"
                alt="Portada de ${revista.fecha}"
                loading="lazy"
            />

            <span class="archive-info">
                <strong>${revista.fecha}</strong>
                <small>${revista.paginas} páginas</small>
                <span>Leer edición <img class="flecha-svg" src="assets/icons/flecha-derecha.svg" alt="" aria-hidden="true"></span>
            </span>
        `;

        tarjeta.addEventListener('click', () => {
          open(1, revista);
        });

        contenedor.appendChild(tarjeta);
    });
  }

cargarHemeroteca();

  // Portada principal: utiliza la edición más reciente del catálogo.
  // Se ordena por año y mes para no depender del orden de revistas.js.
  const revistaMasReciente = [...revistas].sort((a, b) => b.id.localeCompare(a.id))[0];
  function actualizarPortadaPrincipal() {
    if (!revistaMasReciente) return;
    const imagen = $('heroCoverImage');
    imagen.src = revistaMasReciente.portada;
    imagen.alt = `Portada de + Vale Prevenir, ${revistaMasReciente.fecha}`;
    $('openCover').setAttribute('aria-label', `Leer edición de ${revistaMasReciente.fecha}`);
    $('heroEditionCaption').textContent = `EDICIÓN · ${revistaMasReciente.fecha.toUpperCase()}`;
    $('heroEditionName').textContent = revistaMasReciente.titulo || `Edición de ${revistaMasReciente.fecha}`;
    $('heroDescription').textContent = `Explora la edición de ${revistaMasReciente.fecha} de + Vale Prevenir, una publicación de la Subdirección de Prevención y Protección a la Salud del ISSSTE.`;
    $('heroDownload').href = revistaMasReciente.pdf;
    $('heroMeta').innerHTML = `<span>◫ ${revistaMasReciente.paginas} páginas</span><span>•</span><span>${revistaMasReciente.fecha}</span>`;
  }
  actualizarPortadaPrincipal();


  function pageSrc(n) { return revistaActual.carpetaPaginas + String(n).padStart(2, '0') + '.webp'; }
  function spreadStart(n) {
    if (!bookMode || n <= 1) return n;
    return n % 2 === 0 ? n : n - 1;
  }
  function size() {
    const pad = window.matchMedia("(max-width: 650px)").matches ? 20 : 48;
    const maxW = Math.max(1, stage.clientWidth - pad);
    const maxH = Math.max(1, stage.clientHeight - pad);
    const ratio = image.naturalWidth && image.naturalHeight ? image.naturalWidth / image.naturalHeight : 861/1100;
    const count = bookMode ? 2 : 1;
    const height = Math.min(maxH, maxW / (ratio * count));
    const width = Math.round(height * ratio * zoom);
    for (const img of [image, rightImage]) {
      img.style.width = width + 'px';
      img.style.height = Math.round(height * zoom) + 'px';
    }
    $('zoomLabel').textContent = Math.round(zoom * 100) + '%';
  }
  image.addEventListener('load', () => { if (!reader.hidden) size(); });
  rightImage.addEventListener('load', () => { if (!reader.hidden) size(); });
  // Etapa 14.7: animación opcional, aislada del lector estable.
  const flipButton = $('flipEffectBtn');
  let flip = null;
  let flipHost = null;
  let flipActive = false;
  let flipBusy = false;
  let flipResizeTimer = null;
  const flipContainer = $('flipBook');
  function destroyFlip() {
    // StPageFlip puede eliminar su elemento raíz; nunca usar readerPages como raíz.
    const old = flip;
    flip = null;
    flipActive = false;
    flipBusy = false;
    if (old) { try { old.destroy(); } catch (err) { console.warn('Limpieza del libro:', err); } }
    // Reconstruir un contenedor nuevo, aunque destroy() haya eliminado el anterior.
    if (flipHost && flipHost.parentNode) flipHost.remove();
    flipHost = null;
    flipContainer.replaceChildren();
    flipContainer.hidden = true;
    pagesWrap.hidden = false;
    flipButton.setAttribute('aria-pressed', 'false');
    flipButton.textContent = 'Animar hojas';
  }
  function disableFlip() {
    destroyFlip();
    if (!reader.hidden) show(page);
  }
  function flipDimensions() {
    const s = getComputedStyle(stage);
    const w = stage.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight) - 16;
    const h = stage.clientHeight - parseFloat(s.paddingTop) - parseFloat(s.paddingBottom) - 16;
    const ratio = image.naturalWidth && image.naturalHeight ? image.naturalWidth / image.naturalHeight : 861 / 1100;
    const ph = Math.floor(Math.min(h, w / (2 * ratio)));
    return {width: Math.floor(ph * ratio), height: ph};
  }
  function activateFlip() {
    if (!bookMode || reader.hidden) return;
    if (!window.St?.PageFlip) {
      alert('La animación necesita StPageFlip. Las páginas siguen disponibles en modo libro normal.');
      return;
    }
    const dims = flipDimensions();
    if (dims.width < 80 || dims.height < 100) return;
    try {
      destroyFlip();
      flipHost = document.createElement('div');
      flipHost.className = 'vp-flip-host';
      flipContainer.appendChild(flipHost);
      // Mostrar antes de inicializar: la biblioteca mide el DOM visible.
      flipContainer.hidden = false;
      const sheets = Array.from({length: total}, (_, i) => {
        const sheet = document.createElement('div');
        sheet.className = 'vp-flip-page';
        sheet.dataset.density = i === 0 || i === total - 1 ? 'hard' : 'soft';
        const img = document.createElement('img');
        img.src = pageSrc(i + 1);
        img.alt = `Página ${i + 1} de ${total}`;
        img.draggable = false;
        sheet.appendChild(img);
        flipHost.appendChild(sheet);
        return sheet;
      });
      const instance = new window.St.PageFlip(flipHost, {
        width: dims.width, height: dims.height, size: 'fixed',
        showCover: true, usePortrait: false, autoSize: false,
        mobileScrollSupport: false, flippingTime: 750,
        drawShadow: true, maxShadowOpacity: .25,
        useMouseEvents: true, startPage: Math.max(0, page - 1)
      });
      instance.loadFromHTML(sheets);
      flip = instance;
      flipActive = true;
      instance.on('flip', event => {
        if (!flipActive || flip !== instance) return;
        page = event.data + 1;
        $('pageInput').value = String(page);
        $('prevPage').disabled = page <= 1;
        $('nextPage').disabled = page >= total;
      });
      instance.on('changeState', event => { if (flip === instance) flipBusy = event.data === 'flipping'; });
      pagesWrap.hidden = true;
      flipButton.setAttribute('aria-pressed', 'true');
      flipButton.textContent = 'Sin animación';
    } catch (err) {
      console.error('Error al iniciar animación; se conserva el visor estable:', err);
      destroyFlip();
      show(page);
    }
  }
  flipButton.addEventListener('click', () => flipActive ? disableFlip() : activateFlip());
  function flipGo(n, direction) {
    if (!flipActive || !flip) return false;
    if (flipBusy) return true;
    try {
      if (direction === 'next') flip.flipNext();
      else if (direction === 'prev') flip.flipPrev();
      else flip.flip(Math.max(0, Math.min(total - 1, Math.round(Number(n) || 1) - 1)));
    } catch (err) { console.error('Error al pasar hoja:', err); disableFlip(); }
    return true;
  }
  // Etapa 14.6: modo libro estable con dos imágenes HTML nítidas.
  // No ocultar el lector individual esperando una inicialización externa.
  function refreshFlip() {
    flipContainer.hidden = !flipActive;
    pagesWrap.hidden = flipActive;
    flipButton.hidden = !bookMode;
    $('zoomIn').disabled = bookMode;
    $('zoomOut').disabled = bookMode;
    $('zoomIn').title = bookMode ? 'Zoom disponible en página individual' : 'Acercar';
    $('zoomOut').title = bookMode ? 'Zoom disponible en página individual' : 'Alejar';
    $('zoomLabel').textContent = bookMode ? 'Ajuste' : Math.round(zoom * 100) + '%';
    bookBtn.setAttribute('aria-pressed', String(bookMode));
    bookBtn.title = bookMode ? 'Desactivar modo libro' : 'Activar modo libro';
    return bookMode;
  }
  function scheduleFlipResize() {
    if (reader.hidden || !bookMode) return;
    clearTimeout(flipResizeTimer);
    flipResizeTimer = setTimeout(() => {
      if (reader.hidden || !bookMode) return;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!reader.hidden && bookMode) refreshFlip();
      }));
    }, 180);
  }
  function show(n, animate = false) {
    if (flipActive) { flipGo(n); return; }
    if (animating) return;
    const target = Math.max(1, Math.min(total, Math.round(Number(n) || 1)));
    const nextPage = spreadStart(target);
    const oldPage = page;

    pagesWrap.classList.remove('page-turn-next', 'page-turn-prev');
    if (animate && !bookMode && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && nextPage !== page) {
      void pagesWrap.offsetWidth;
      pagesWrap.classList.add(nextPage > page ? 'page-turn-next' : 'page-turn-prev');
    }
    page = nextPage;
    const right = bookMode && page > 1 && page + 1 <= total ? page + 1 : 0;
    pagesWrap.classList.toggle('book-spread', bookMode && page > 1);
    image.src = pageSrc(page);
    image.alt = 'Página ' + page + ' de ' + total;
    rightImage.hidden = !right;
    if (right) { rightImage.src = pageSrc(right); rightImage.alt = 'Página ' + right + ' de ' + total; }
    $('pageInput').value = String(target);
    $('prevPage').disabled = page <= 1;
    $('nextPage').disabled = bookMode ? (page === 1 ? total <= 1 : page + 2 > total) : page >= total;
    stage.scrollTop = 0; stage.scrollLeft = 0;
    size();
    refreshFlip();
    for (let d=1; d<=4; d++) if (page+d <= total) { const pre = new Image(); pre.src = pageSrc(page+d); }
  }
  bookBtn.addEventListener('click', () => {
    if (flipActive) destroyFlip();
    bookMode = !bookMode;
    if (bookMode) zoom = 1;
    show(page);
  });
  function actualizarLector() {
    total = revistaActual.paginas;
    const etiqueta = $('readerTitle')?.parentElement?.querySelector('small');
    if (etiqueta) etiqueta.textContent = revistaActual.fecha;
    $('pageInput').max = String(total);
    const contador = document.querySelector('.page-picker > span');
    if (contador) contador.textContent = 'de ' + total;
    const descargar = document.querySelector('.reader-tools a[download]');
    if (descargar) descargar.href = revistaActual.pdf;

    // El índice disponible en el HTML corresponde únicamente a marzo.
    toc.hidden = true;
    $('tocBtn').hidden = revistaActual.id !== '2026-03';
  }

  function open(n=1, edicion=revistaActual) {
    // Cada apertura comienza en modo página individual, incluso tras cerrar un libro.
    clearTimeout(flipResizeTimer);
    destroyFlip();
    bookMode = false;
    flipContainer.hidden = true;
    pagesWrap.hidden = false;
    bookBtn.setAttribute('aria-pressed', 'false');
    bookBtn.title = 'Activar modo libro';
    revistaActual = edicion;
    actualizarLector();
    previousFocus=document.activeElement;
    reader.hidden=false;
    document.body.classList.add('reader-open');
    zoom=1;
    show(n);
    $('closeReader').focus()
  }
  function close() {
    clearTimeout(flipResizeTimer);
    destroyFlip();
    bookMode = false;
    flipContainer.hidden = true;
    pagesWrap.hidden = false;
    bookBtn.setAttribute('aria-pressed', 'false');
    bookBtn.title = 'Activar modo libro';
    $('zoomIn').disabled = false;
    $('zoomOut').disabled = false;
    reader.hidden=true;
    document.body.classList.remove('reader-open');
    previousFocus?.focus()
  }
  $('readNow').addEventListener('click',()=>open(1, revistaMasReciente));
  $('openCover').addEventListener('click',()=>open(1, revistaMasReciente));
  
  document.querySelectorAll('[data-page]').forEach((button) => {
    button.addEventListener('click', () => {
        const targetPage = Number(button.dataset.page);
        open(targetPage, revistas.find(r => r.id === '2026-03') || revistas[0]);
    });
  });

  document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=> {
    show(Number(b.dataset.go));toc.hidden=true
  }
  ));
  $('closeReader').addEventListener('click',close);
  
  $('prevPage').addEventListener('click', (event) => {
      event.preventDefault();
      if (!flipGo(null, 'prev')) show(page - (bookMode && page > 1 ? 2 : 1), true);
  });

  $('nextPage').addEventListener('click', (event) => {
      event.preventDefault();
      if (!flipGo(null, 'next')) show(page + (bookMode && page > 1 ? 2 : 1), true);
  });

  $('pageInput').addEventListener('change',e=>show(e.target.value));
  $('tocBtn').addEventListener('click',()=>toc.hidden=!toc.hidden);
  $('zoomIn').addEventListener('click',()=> {
    if (bookMode) return; zoom=Math.min(2.5,+(zoom+.25).toFixed(2));size()
  }
  );
  $('zoomOut').addEventListener('click',()=> {
    if (bookMode) return; zoom=Math.max(.5,+(zoom-.25).toFixed(2));size()
  }
  );
  // Pantalla completa desactivada temporalmente (Etapa 14.4).
  document.addEventListener('keydown',e=> {
    if(reader.hidden)return;if(e.key==='Escape') {
      if(!toc.hidden) {
        toc.hidden=true
      }
      else close()
    }
    else if(e.key==='ArrowRight'&&e.target.tagName!=='INPUT') { if (!flipGo(null, 'next')) show(page + (bookMode && page > 1 ? 2 : 1), true); } else if(e.key==='ArrowLeft'&&e.target.tagName!=='INPUT') { if (!flipGo(null, 'prev')) show(page - (bookMode && page > 1 ? 2 : 1), true); }
  }
  );
  function onReaderViewportChange() {
    if (reader.hidden) return;
    size();
    if (flipActive) { disableFlip(); return; }
    if (!bookMode) return;
    clearTimeout(flipResizeTimer);
    flipResizeTimer = setTimeout(() => {
      if (!reader.hidden && bookMode && stage.clientWidth > 0 && stage.clientHeight > 0) {
        refreshFlip();
      }
    }, 160);
  }
  window.addEventListener('resize', onReaderViewportChange);
  // Navegación táctil: deslizar sobre las páginas sin bloquear el desplazamiento vertical.
  let touchStart = null;
  stage.addEventListener('touchstart', event => {
    if (event.touches.length !== 1) { touchStart = null; return; }
    touchStart = {x: event.touches[0].clientX, y: event.touches[0].clientY};
  }, {passive:true});
  stage.addEventListener('touchend', event => {
    if (!touchStart || reader.hidden || event.changedTouches.length !== 1) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) < 65 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    if (flipActive) { flipGo(null, dx < 0 ? 'next' : 'prev'); return; }
    const step = bookMode && page > 1 ? 2 : 1;
    show(page + (dx < 0 ? step : -step), true);
  }, {passive:true});
  $('menuBtn').addEventListener('click',()=> {
    const open=$('nav').classList.toggle('open');$('menuBtn').setAttribute('aria-expanded',String(open))
  }
  );
  document.querySelectorAll('#nav a').forEach(a=>a.addEventListener('click',()=> {
    $('nav').classList.remove('open');$('menuBtn').setAttribute('aria-expanded','false')
  }
  ));
}
)();
