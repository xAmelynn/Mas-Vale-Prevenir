
from pathlib import Path
import fitz

# Carpeta donde están las seis revistas
BASE = Path(__file__).resolve().parent / "assets" / "revistas"

# Calidad y resolución de las páginas
RESOLUCION = 1.5
CALIDAD = 82

def generar_paginas(carpeta_revista):
    archivo_pdf = carpeta_revista / "revista.pdf"
    carpeta_salida = carpeta_revista / "pages"

    if not archivo_pdf.exists():
        print(f"No se encontró: {archivo_pdf}")
        return

    carpeta_salida.mkdir(exist_ok=True)

    with fitz.open(archivo_pdf) as documento:
        total = len(documento)

        # Generar automáticamente la portada
        archivo_portada = carpeta_revista / "portada.webp"

        if not archivo_portada.exists() and total >0:
            primera_pagina = documento[0]

            pixmap = primera_pagina.get_pixmap(
                matrix=fitz.Matrix(1.2, 1.2),
                alpha=False
            )

            from PIL import Image

            portada = Image.frombytes(
                "RGB",
                (pixmap.width, pixmap.height),
                pixmap.samples
            )

            portada.save(
                archivo_portada,
                "WEBP",
                quality=85,
                method=4
            )

            print(" Portada generada correctamente")

        print(f"\nProcesando {carpeta_revista.name}: {total} páginas")

        for indice, pagina in enumerate(documento):
            numero = indice + 1
            destino = carpeta_salida / f"{numero:02d}.webp"

            # Evitar repetir conversiones existentes
            if destino.exists():
                continue

            pixmap = pagina.get_pixmap(
                matrix=fitz.Matrix(RESOLUCION, RESOLUCION),
                alpha=False
            )

            from PIL import Image

            imagen = Image.frombytes(
                "RGB",
                (pixmap.width, pixmap.height),
                pixmap.samples
            )

            imagen.save(
                destino,
                "WEBP",
                quality=CALIDAD,
                method=4
            )

            print(f"  Página {numero}/{total}", end="\r")

        print(f"\nFinalizado: {carpeta_revista.name}")


for carpeta in sorted(BASE.iterdir()):
    if carpeta.is_dir():
        generar_paginas(carpeta)

print("\n¡Todas las revistas están listas!")
