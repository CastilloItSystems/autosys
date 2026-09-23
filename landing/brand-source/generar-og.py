"""Genera public/og.png (imagen para compartir en redes, 1200x630).

Composición propia, sin generación por IA: logotipo del cliente
(brand-source/camabar-iveco-recorte-transparente.png) sobre blanco, y banda en
el azul CAMABAR #286CC8 con texto en Michroma y Saira (Google Fonts, licencia OFL).
Ejecutar desde landing/:  python brand-source/generar-og.py
"""
from PIL import Image, ImageDraw, ImageFont

W, H, BANDA = 1200, 630, 250
AZUL, BLANCO = (40, 108, 200), (252, 252, 252)

img = Image.new("RGB", (W, H), BLANCO)
d = ImageDraw.Draw(img)
d.rectangle([0, H - BANDA, W, H], fill=AZUL)

logo = Image.open("brand-source/camabar-iveco-recorte-transparente.png")
lw = 640
lh = round(logo.height * lw / logo.width)
logo = logo.resize((lw, lh), Image.LANCZOS)
img.paste(logo, (80, (H - BANDA - lh) // 2), logo)

michroma = ImageFont.truetype("brand-source/fonts/Michroma-Regular.ttf", 40)
saira = ImageFont.truetype("brand-source/fonts/Saira-Variable.ttf", 32)
saira.set_variation_by_axes([500, 106])  # ejes: peso, ancho

d.text((80, H - BANDA + 58), "Repuestos y taller Iveco", font=michroma, fill=BLANCO)
d.text((80, H - BANDA + 132), "Concesionario autorizado en Barcelona, Anzoátegui", font=saira, fill=BLANCO)

img.save("public/og.png", optimize=True)
print("public/og.png generado")
