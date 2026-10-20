"""Prepara las ediciones de + Vale Prevenir y regenera revistas.js.
Uso: py -m pip install pymupdf pillow
     py actualizar_revistas.py
Colocar este archivo junto a index.html, revistas.js y la carpeta assets/.
"""
from pathlib import Path
from datetime import datetime
import json
import re
import sys

try:
    import fitz  # PyMuPDF
    from PIL import Image
except ImportError:
    sys.exit('Faltan dependencias. Ejecuta: py -m pip install pymupdf pillow')

RAIZ = Path(__file__).resolve().parent
CARPETA = RAIZ / 'assets' / 'revistas'
SALIDA = RAIZ / 'revistas.js'
MESES = ('Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
         'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre')
PATRON = re.compile(r'^\d{4}-(0[1-9]|1[0-2])$')
ESCALA = 1.5
CALIDAD_PAGINAS = 82
CALIDAD_PORTADA = 85


def guardar_webp(pagina, destino, escala, calidad):
    pix = pagina.get_pixmap(matrix=fitz.Matrix(escala, escala), alpha=False)
    imagen = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
    imagen.save(destino, 'WEBP', quality=calidad, method=4)


def procesar(carpeta):
    identificador = carpeta.name
    if not PATRON.fullmatch(identificador):
        return None
    pdf = carpeta / 'revista.pdf'
    if not pdf.is_file():
        print(f'  Aviso: {identificador} no tiene revista.pdf; se omite.')
        return None
    anio, mes = map(int, identificador.split('-'))
    fecha = f'{MESES[mes - 1]} {anio}'
    paginas_dir = carpeta / 'pages'
    paginas_dir.mkdir(exist_ok=True)
    portada = carpeta / 'portada.webp'
    with fitz.open(pdf) as documento:
        total = len(documento)
        if not total:
            print(f'  Aviso: {identificador} tiene un PDF sin páginas; se omite.')
            return None
        if not portada.exists():
            guardar_webp(documento[0], portada, 1.2, CALIDAD_PORTADA)
        generadas = 0
        for i in range(total):
            destino = paginas_dir / f'{i + 1:02d}.webp'
            if destino.exists():
                continue
            guardar_webp(documento[i], destino, ESCALA, CALIDAD_PAGINAS)
            generadas += 1
    print(f'  {fecha}: {total} páginas; {generadas} imágenes nuevas.')
    ruta = f'assets/revistas/{identificador}'
    return {
        'id': identificador,
        'mes': MESES[mes - 1],
        'anio': anio,
        'fecha': fecha,
        'titulo': f'Edición de {MESES[mes - 1].lower()} de {anio}',
        'paginas': total,
        'portada': f'{ruta}/portada.webp',
        'pdf': f'{ruta}/revista.pdf',
        'carpetaPaginas': f'{ruta}/pages/',
        'secciones': None,
    }


def main():
    if not CARPETA.is_dir():
        sys.exit(f'No se encontró la carpeta {CARPETA}. Coloca el script en la raíz del proyecto.')
    catalogo = []
    errores = []
    for carpeta in sorted(CARPETA.iterdir(), reverse=True):
        if not carpeta.is_dir():
            continue
        try:
            entrada = procesar(carpeta)
            if entrada:
                catalogo.append(entrada)
        except Exception as exc:
            errores.append(f'{carpeta.name}: {exc}')
    if errores:
        print('\nErrores encontrados; revistas.js NO se modificó:')
        for error in errores:
            print(' -', error)
        sys.exit(1)
    if not catalogo:
        sys.exit('No se encontraron revistas válidas. revistas.js no se modificó.')
    contenido = ('/* Catálogo generado automáticamente por actualizar_revistas.py. */\n'
                 'const revistas = ' + json.dumps(catalogo, ensure_ascii=False, indent=2) + ';\n')
    temporal = SALIDA.with_suffix('.js.tmp')
    temporal.write_text(contenido, encoding='utf-8')
    temporal.replace(SALIDA)
    print(f'\nListo: {len(catalogo)} ediciones en {SALIDA.name}.')
    print('Recarga manualmente la página en el navegador.')


if __name__ == '__main__':
    main()
