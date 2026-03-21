# Plur — Stitch Prompts
> Prompts para recrear el sitio web de Plur (moda circular) con Stitch o cualquier AI design tool.
> Cada prompt es autocontenido y listo para copiar y pegar.

---

## DESIGN SYSTEM DE REFERENCIA

Antes de usar cualquier prompt, tené en cuenta estos valores. Todos los prompts los incluyen, pero sirve como referencia rápida.

```
PALETA:
  Negro principal:  #0A0A0A
  Blanco:           #F5F5F5
  Gray-100:         #E8E8E8
  Gray-200:         #D0D0D0
  Gray-300:         #A0A0A0
  Gray-400:         #707070
  Gray-500:         #505050
  Gray-600:         #303030
  Gray-700:         #1A1A1A
  Accent lime:      #C8FF00
  Accent lime dim:  #A0CC00
  Rojo:             #FF4D6A
  Verde:            #00E676

TIPOGRAFÍA:
  Display: Syne (400, 500, 600, 700, 800) — titulares, logo
  Body:    Manrope (300, 400, 500, 600, 700, 800) — texto UI

ESTILO:
  - Sin border-radius (elementos cuadrados, estética brutalist)
  - Grain overlay (textura de ruido sobre todo)
  - Fondo negro con gradientes oscuros
  - Labels: UPPERCASE + letter-spacing amplio
  - Hover: translateY(-2px o -3px) + box-shadow lime
  - Animaciones: scroll reveal con opacity 0→1 + translateY 50px→0

EASING:
  ease-out:    cubic-bezier(0.16, 1, 0.3, 1)
  ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)
  ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)
```

---

## PROMPT 0 — DESIGN SYSTEM BASE (CSS Variables + Reset)

```
Creá el CSS base completo para el sitio web de Plur, una plataforma de moda circular.

DESIGN SYSTEM:
Nombre: Plur
Estilo: Editorial dark-mode, brutalist, moda de lujo sostenible
Público: 18-35 años, tech-savvy, conscientes de la moda

VARIABLES CSS (:root):
  --pl-white: #F5F5F5
  --pl-black: #0A0A0A
  --pl-gray-100: #E8E8E8
  --pl-gray-200: #D0D0D0
  --pl-gray-300: #A0A0A0
  --pl-gray-400: #707070
  --pl-gray-500: #505050
  --pl-gray-600: #303030
  --pl-gray-700: #1A1A1A
  --pl-accent: #C8FF00
  --pl-accent-dim: #A0CC00
  --pl-red: #FF4D6A
  --pl-green: #00E676
  --pl-font-display: 'Syne', sans-serif
  --pl-font-body: 'Manrope', sans-serif
  --pl-ease-out: cubic-bezier(0.16, 1, 0.3, 1)
  --pl-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)
  --pl-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)

RESET:
  - box-sizing: border-box en todo
  - margin y padding a 0
  - font-size: 16px base
  - scroll-behavior: smooth
  - -webkit-font-smoothing: antialiased
  - body: font-family Manrope, background #0A0A0A, color #F5F5F5, overflow-x: hidden
  - ::selection: background #C8FF00, color #0A0A0A
  - a: color inherit, text-decoration none
  - button: cursor pointer, font-family inherit
  - img: display block, max-width 100%

FUENTES (Google Fonts):
  Manrope: wght@300;400;500;600;700;800
  Syne: wght@400;500;600;700;800

GRAIN OVERLAY (elemento .grain):
  - position: fixed, inset: 0, z-index: 9990
  - pointer-events: none
  - background-image: SVG con feTurbulence, fractalNoise, baseFrequency 0.85, 4 octaves, opacity 0.03

HELPERS de sección:
  .section: padding clamp(80px, 10vw, 160px) clamp(24px, 5vw, 80px), position: relative
  .section-dark: background #0A0A0A, color #F5F5F5
  .section-light: background #F5F5F5, color #0A0A0A
  .section-mid: background #1A1A1A, color #F5F5F5

TIPOGRAFÍA REUTILIZABLE:
  .section-eyebrow: font-size 10px, Manrope 500, letter-spacing 0.2em, UPPERCASE
    - en dark/mid: color #C8FF00
    - en light: color #707070
  .section-title: Syne 800, clamp(2.5rem, 5vw, 5rem), letter-spacing -0.05em, line-height 0.95, UPPERCASE
  .section-desc: Manrope 300, clamp(14px, 1.1vw, 17px), line-height 1.7, max-width 560px, opacity 0.6
  .section-counter: posición absolute top-right, font-size 11px, letter-spacing 0.1em, opacity 0.3

BOTONES:
  .btn-primary: Manrope 600, 11px, UPPERCASE, letter-spacing 0.14em, padding 16px 40px, background #C8FF00, color #0A0A0A, border none, sin border-radius. Hover: translateY(-3px) + box-shadow 0 12px 40px rgba(200,255,0,0.25)
  .btn-outline: mismo tamaño, background transparent, color #F5F5F5, border 1px solid #505050. Hover: border-color #F5F5F5 + translateY(-3px)

ANIMACIÓN REVEAL (scroll):
  .reveal: opacity 0, translateY(50px), transition 0.9s ease-out
  .reveal.visible: opacity 1, translateY(0)
  .reveal-delay-1/2/3/4: transition-delay 0.1s/0.2s/0.3s/0.4s
  Activar con IntersectionObserver threshold 0.15
```

---

## PROMPT 1 — PRELOADER

```
Creá el componente preloader de Plur con las siguientes especificaciones:

DESIGN SYSTEM PLUR:
  Fondo: #0A0A0A | Accent: #C8FF00 | Gray-700: #1A1A1A
  Font display: 'Syne', sans-serif | Font body: 'Manrope', sans-serif
  ease-out: cubic-bezier(0.16, 1, 0.3, 1) | ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)

COMPONENTE .preloader:
  - position: fixed, inset: 0, z-index: 9999
  - background: #0A0A0A
  - display flex, align-items center, justify-content center
  - flex-direction column, gap 24px
  - Transición de salida: opacity 0.8s + visibility 0.8s (cuando tiene clase .hidden)

LOGO ANIMADO (.preloader-logo):
  - Font: Syne 800
  - Font-size: clamp(3rem, 8vw, 7rem)
  - Text-transform: uppercase
  - Letter-spacing: -0.06em
  - Texto: "PLUR"
  - Efecto gradiente en el texto: linear-gradient(135deg, #F5F5F5 0%, #C8FF00 100%)
    usando -webkit-background-clip: text y -webkit-text-fill-color: transparent
  - Animación "preloaderPulse": keyframe 0%,100% opacity 0.6 → 50% opacity 1, duration 1.5s infinite

BARRA DE PROGRESO (.preloader-bar):
  - width: 200px, height: 2px
  - background: #1A1A1A, border-radius 1px, overflow hidden

FILL DE BARRA (.preloader-bar-fill):
  - height: 100%, width: 0 → 100% (animado)
  - background: #C8FF00
  - Animación "preloaderFill": keyframe to { width: 100% }, duration 2s ease-out forwards

JAVASCRIPT:
  - Al evento 'load', después de 2200ms, agregar clase .hidden al preloader
```

---

## PROMPT 2 — NAVIGATION

```
Creá la barra de navegación de Plur con las siguientes especificaciones:

DESIGN SYSTEM PLUR:
  Fondo overlay: rgba(10,10,10,0.6) con backdrop-filter blur(20px)
  Texto: #F5F5F5 | Accent: #C8FF00 | Border: rgba(245,245,245,0.06)
  Font display: 'Syne' 800 | Font body: 'Manrope'
  ease-out: cubic-bezier(0.16, 1, 0.3, 1)

ESTRUCTURA HTML:
  <nav class="nav">
    Logo | Links centrales | [Tokens PLR + CTA button]
  </nav>

ESTILOS .nav:
  - position: fixed, top: 0, left: 0, right: 0, z-index: 1000
  - display flex, justify-content space-between, align-items center
  - padding: 20px 32px
  - background: rgba(10,10,10,0.6)
  - backdrop-filter: blur(20px)
  - border-bottom: 1px solid rgba(245,245,245,0.06)
  - Transition: transform 0.5s (para hide on scroll)

LOGO (.nav-logo):
  - Font: Syne 800, font-size 14px
  - letter-spacing: 0.08em, UPPERCASE
  - Texto: "PLUR" con el punto "." en color #C8FF00

LINKS (.nav-links):
  - display flex, gap 32px, list-style none
  - Links: "Match", "AI Fitting", "Tokens", "Collection"
  - font-size 11px, Manrope 400, letter-spacing 0.1em, UPPERCASE
  - color #F5F5F5 opacity 0.6 → hover opacity 1
  - Underline animado al hover: ::after con width 0→100%, height 1px, background #C8FF00

DERECHA DE LA NAV:
  1. Balance PLR (.nav-tokens):
    - flex, gap 8px, font-size 11px, Manrope 500, color #C8FF00
    - Ícono SVG circular (coin/exchange), 16x16px
    - Texto: "240 PLR"
  2. Botón CTA (.nav-cta):
    - font-size 10px, Manrope 600, UPPERCASE, letter-spacing 0.12em
    - padding: 10px 24px
    - background: #C8FF00, color: #0A0A0A
    - border: none, sin border-radius
    - Hover: translateY(-2px) + box-shadow 0 8px 30px rgba(200,255,0,0.2)
    - Texto: "Join Plur"

HIDE ON SCROLL (JavaScript):
  - Al hacer scroll hacia abajo (> 100px): nav translateY(-100%)
  - Al hacer scroll hacia arriba: nav translateY(0)
  - Usar event scroll con passive: true

RESPONSIVE:
  - Móvil (max-width 768px): ocultar .nav-links y .nav-tokens
```

---

## PROMPT 3 — HERO SECTION

```
Creá la sección hero de Plur, página de moda circular.

DESIGN SYSTEM PLUR:
  Negro: #0A0A0A | Blanco: #F5F5F5 | Gray-200: #D0D0D0 | Accent: #C8FF00
  Font display: 'Syne' 800 | Font body: 'Manrope' 300
  ease-out: cubic-bezier(0.16, 1, 0.3, 1) | ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)

ESTRUCTURA:
  <section class="hero">
    [bg con imagen] → [overlay degradé] → [contenido] → [stats] → [scroll indicator]
  </section>

CONTENEDOR HERO (.hero):
  - height: 100vh, min-height: 800px
  - position relative, display flex, align-items center
  - overflow hidden

FONDO (.hero-bg):
  - position absolute, inset 0, z-index 0
  - Imagen: foto editorial de moda (mujer, ropa, estilo urbano)
  - filter: brightness(0.3) contrast(1.1)
  - Animación "heroZoom": keyframe from scale(1) → to scale(1.08), duration 20s ease-in-out infinite alternate

OVERLAY (.hero-overlay):
  - position absolute, inset 0, z-index 1
  - background: linear-gradient(180deg, rgba(10,10,10,0.4) 0%, rgba(10,10,10,0.9) 80%, #0A0A0A 100%)

CONTENIDO (.hero-content):
  - position relative, z-index 2
  - padding: 0 clamp(24px, 5vw, 80px)
  - max-width: 900px

  EYEBROW (.hero-eyebrow):
    - Manrope 500, 11px, letter-spacing 0.2em, UPPERCASE, color #C8FF00
    - margin-bottom: 24px
    - Texto: "Circular Fashion — Redefined"
    - animation fadeUp 1s ease-out 2.2s both

  TÍTULO (.hero-title):
    - Syne 800, clamp(3.5rem, 7vw, 8rem)
    - letter-spacing: -0.05em, line-height: 0.92, UPPERCASE
    - margin-bottom: 32px
    - animation fadeUp 1s ease-out 2.4s both
    - Contenido:
      Line 1: "Swipe" + "." en #C8FF00
      Line 2 (.italic): display block, font-weight 300, italic, letter-spacing -0.02em, font-size 0.65em, color #D0D0D0 → "Try on. Exchange."

  DESCRIPCIÓN (.hero-desc):
    - Manrope 300, clamp(14px, 1.2vw, 18px), line-height 1.7
    - max-width: 520px, opacity 0.6, margin-bottom: 48px
    - animation fadeUp 1s ease-out 2.6s both
    - Texto: "La moda circular reinventada. Descubrí prendas, probalas con IA y usá tokens para intercambiar ropa con otros. Sin desperdicio, puro estilo."

  ACCIONES (.hero-actions):
    - display flex, gap 16px, flex-wrap wrap
    - animation fadeUp 1s ease-out 2.8s both
    - Botón 1: .btn-primary → "Empezá a matchear"
    - Botón 2: .btn-outline → "Cómo funciona"

ESTADÍSTICAS (.hero-stats):
  - position absolute, bottom 60px, right clamp(24px, 5vw, 80px), z-index 2
  - display flex, gap 48px
  - animation fadeUp 1s ease-out 3s both
  - 3 stats con .hero-stat (text-align right):
    .hero-stat-number: Syne 800, clamp(2rem, 3vw, 3.5rem), letter-spacing -0.04em
      → "12K" / "4.2K" / "98%"  (el número en #F5F5F5, la letra/símbolo en #C8FF00)
    .hero-stat-label: Manrope, 10px, UPPERCASE, letter-spacing 0.14em, opacity 0.4
      → "Prendas activas" / "Usuarios" / "Satisfacción"

SCROLL INDICATOR (.hero-scroll):
  - position absolute, bottom 32px, left 50%, translateX(-50%)
  - flex-direction column, align-items center, gap 8px
  - animation fadeUp 1s ease-out 3.2s both
  - Texto: "SCROLL" — 9px, letter-spacing 0.2em, UPPERCASE, opacity 0.3
  - Línea: 1px ancho, 40px alto, background #F5F5F5 opacity 0.2
    Animación "scrollPulse": 0%,100% opacity 0.1 scaleY(0.5) → 50% opacity 0.3 scaleY(1)

ANIMACIÓN GLOBAL:
  @keyframes fadeUp: from opacity 0 translateY(40px) → to opacity 1 translateY(0)
  @keyframes heroZoom: from scale(1) → to scale(1.08)

RESPONSIVE:
  - .hero-stats: ocultar en max-width 1024px
```

---

## PROMPT 4 — MARQUEE STRIP

```
Creá una banda horizontal con texto en scroll infinito para Plur.

DESIGN SYSTEM PLUR:
  Negro: #0A0A0A | Blanco: #F5F5F5 | Gray-700: #1A1A1A | Accent: #C8FF00
  Font display: 'Syne' 700

CONTENEDOR (.marquee-strip):
  - overflow: hidden
  - border-top: 1px solid #1A1A1A
  - border-bottom: 1px solid #1A1A1A
  - padding: 20px 0
  - background: #0A0A0A

TRACK (.marquee-track):
  - display flex, gap 48px
  - width: max-content
  - Animación "marqueeScroll": to { transform: translateX(-50%) }, duration 30s linear infinite

ITEMS (.marquee-item):
  - Font: Syne 700
  - Font-size: clamp(14px, 1.5vw, 20px)
  - letter-spacing: 0.06em, UPPERCASE, white-space: nowrap
  - color: #F5F5F5, opacity: 0.3

SEPARADOR (.dot dentro de .marquee-item):
  - color: #C8FF00
  - margin: 0 8px

CONTENIDO (repetir 2 veces para el scroll infinito):
  "Swipe to match" • "Probador con IA" • "Token economy" • "Circular fashion" • "Zero waste" • "Community exchange" •
```

---

## PROMPT 5 — SWIPE / MATCH SECTION

```
Creá la sección "Swipe & Match" de Plur con un mockup de teléfono interactivo y tarjetas de ropa.

DESIGN SYSTEM PLUR:
  Negro: #0A0A0A | Blanco: #F5F5F5 | Gray-600: #303030 | Gray-700: #1A1A1A | Accent: #C8FF00
  Rojo: #FF4D6A | Font display: 'Syne' | Font body: 'Manrope'
  ease-out: cubic-bezier(0.16, 1, 0.3, 1) | ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)

ESTRUCTURA GENERAL (.swipe-section):
  - section.section.section-dark con id="match"
  - Grid 2 columnas: "1fr 1fr", gap clamp(32px, 4vw, 80px), align-items center, min-height 100vh
  - Contador de sección: "01 / 04" posicionado absolute top-right, opacity 0.3

COLUMNA IZQUIERDA (.swipe-info, max-width 480px):
  - Eyebrow: "01 — Match" en #C8FF00
  - Título (Syne 800, clamp(2.5rem→5rem), UPPERCASE, line-height 0.95):
    "Encontrá" / "tu estilo" + "." en #C8FF00
  - Descripción (Manrope 300, opacity 0.6):
    "Deslizá entre miles de prendas pre-loved, vintage y de diseñadores emergentes. Si te gusta, hacé match. Si no, siguiente."

  LISTA DE FEATURES (.feature-list, flex-col, gap 32px, margin-top 48px):
    Cada .feature-item = flex, gap 16px, align-items flex-start:

    .feature-icon: 40x40px, border 1px solid #303030, display flex, align-items/justify-content center, font-size 16px, SIN border-radius
    .feature-text h4: Syne 700, 14px, color #F5F5F5, margin-bottom 4px
    .feature-text p: Manrope 300, 12px, line-height 1.6, opacity 0.5

    Items:
    1. Icon "🎯" | H4: "Algoritmo de estilo" | P: "Aprende tus preferencias y te muestra prendas que van con vos"
    2. Icon "💚" | H4: "Match instantáneo" | P: "Cuando hacés match, conectás directo con el vendedor"
    3. Icon "📦" | H4: "Compra o intercambiá" | P: "Usá pesos, tokens PLR, o hacé un intercambio directo"

COLUMNA DERECHA — PHONE MOCKUP (.swipe-phone, perspective 1000px, justify-content center):

  .phone-frame:
    - 320x620px
    - background: #1A1A1A
    - border-radius: 40px, border: 2px solid #303030, padding: 12px
    - box-shadow: 0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,245,245,0.05)

  .phone-screen:
    - 100% ancho, 100% alto, border-radius 30px
    - background: #0A0A0A, overflow hidden, position relative

  .phone-notch:
    - position absolute, top 0, left 50%, translateX(-50%)
    - 120x28px, background #0A0A0A, border-radius 0 0 20px 20px, z-index 10

  SWIPE CARDS (.swipe-card-stack, position relative, width/height 100%):
    Cartas apiladas con position absolute, inset 0
    La card activa (top): scale(1), z-index alto, opacity 1
    Cards de fondo: scale reducida 0.04 por nivel, translateY 8px por nivel, opacity 0.6

    Cada .swipe-card:
      - position absolute, inset 0
      - transition: transform 0.6s + opacity 0.6s ease-out
      - img: width/height 100%, object-fit cover, border-radius 30px

    .swipe-card-overlay (sobre la imagen):
      - position absolute, bottom 0, left/right 0
      - padding 24px, border-radius 0 0 30px 30px
      - background: linear-gradient(transparent, rgba(10,10,10,0.9))
      - .swipe-card-name: Syne 700, 18px, letter-spacing -0.02em, color #F5F5F5
      - .swipe-card-meta: Manrope 400, 11px, opacity 0.6, margin-top 4px, letter-spacing 0.04em
      - .swipe-card-price: Manrope 600, 13px, color #C8FF00, margin-top 8px

    SELLOS STAMP:
      .swipe-stamp: position absolute, top 50%, left 50%, translate(-50%,-50%)
        Syne 800, 48px, UPPERCASE, letter-spacing 0.06em, padding 8px 24px, border 4px solid
        border-radius 8px, pointer-events none, z-index 30
        Default: scale(0), opacity 0
        .show: scale(1), opacity 1, transition 0.4s ease-spring
        .match: color #C8FF00, border-color #C8FF00, rotate -12deg
        .nope: color #FF4D6A, border-color #FF4D6A, rotate 12deg

  BOTONES DE SWIPE (.swipe-actions):
    - position absolute, bottom 16px, left 50%, translateX(-50%)
    - display flex, gap 16px, z-index 20

    Cada .swipe-btn: 52x52px, border-radius 50%, flex center, border none, font-size 22px
      transition: all 0.3s ease-spring, box-shadow 0 4px 20px rgba(0,0,0,0.3)
      Hover: scale(1.15)

    .pass: background #303030, color #FF4D6A — Texto: "✕"
    .save: background #303030, color #F5F5F5 — Texto: "★"
    .like: background #C8FF00, color #0A0A0A — Texto: "♥"

DATOS DE PRENDAS (JS):
  const garments = [
    { name: 'Bomber Vintage', meta: 'Talle M · Buenos Aires', price: '85 PLR', img: 'URL_imagen' },
    { name: 'Jean Wide Leg', meta: 'Talle 28 · Córdoba', price: '60 PLR', img: 'URL_imagen' },
    { name: 'Vestido Slip', meta: 'Talle S · Rosario', price: '95 PLR', img: 'URL_imagen' },
    { name: 'Camisa Oversize', meta: 'Talle L · Salta', price: '45 PLR', img: 'URL_imagen' },
    { name: 'Tapado Lana', meta: 'Talle M · CABA', price: '150 PLR', img: 'URL_imagen' },
    { name: 'Crop Top Knit', meta: 'Talle S · Mendoza', price: '35 PLR', img: 'URL_imagen' },
  ]

LÓGICA JS:
  - Mostrar 3 cards apiladas (la más reciente arriba)
  - Al hacer like: stamp MATCH + translateX(120%) rotate(15deg) → siguiente carta
  - Al hacer pass: stamp NOPE + translateX(-120%) rotate(-15deg) → siguiente carta
  - Al hacer save: translateY(-120%) → siguiente carta
  - Cuando llega al final, volver al inicio

RESPONSIVE:
  - max-width 1024px: grid 1 columna, phone arriba (order -1), margin-bottom 48px
```

---

## PROMPT 6 — AI FITTING ROOM

```
Creá la sección "AI Fitting Room" de Plur con fondo blanco y comparación antes/después.

DESIGN SYSTEM PLUR:
  Blanco: #F5F5F5 | Negro: #0A0A0A | Accent dim: #A0CC00 | Gray-400: #707070
  Font display: 'Syne' 800 | Font body: 'Manrope' 300
  ease-out: cubic-bezier(0.16, 1, 0.3, 1)

ESTRUCTURA (section con id="fitting", padding 0):
  Grid de 2 columnas de ancho completo: "1fr 1fr"
  min-height: 100vh
  Sección blanca (.section-light)

COLUMNA IZQUIERDA (.fitting-left):
  - padding: clamp(60px, 8vw, 120px) clamp(24px, 4vw, 64px)
  - flex column, justify-content center

  Contador: "02 / 04" — display block, font-size 11px, letter-spacing 0.1em, opacity 0.3, color #0A0A0A, margin-bottom 32px

  Eyebrow: "02 — AI Fitting Room" — 10px, Manrope 500, letter-spacing 0.2em, UPPERCASE, color #707070

  Título (Syne 800, UPPERCASE, letter-spacing -0.05em, line-height 0.95, color #0A0A0A):
    "Probátelo" / "sin salir" / "de casa" + "." en #A0CC00

  Descripción (Manrope 300, opacity 0.55, color #0A0A0A):
    "Subí una foto tuya y nuestra IA genera una imagen realista de vos usando la prenda que te gustó. Antes de comprar, ya sabés cómo te queda."

  PASOS (.fitting-steps, flex-col, gap 40px, margin-top 48px):
    Cada .fitting-step = flex, gap 20px, align-items flex-start

    .step-number: Syne 800, 36px, color #C8FF00 (o #A0CC00), line-height 1, flex-shrink 0, width 50px
    .step-content h4: Syne 700, 15px, color #0A0A0A, margin-bottom 6px
    .step-content p: Manrope 300, 13px, line-height 1.65, opacity 0.55, color #0A0A0A

    Steps:
    01 | "Subí tu foto" | "Una foto tuya de cuerpo entero. Se procesa de forma privada y segura."
    02 | "Elegí la prenda" | "Desde cualquier match o desde la colección. Seleccioná lo que querés probarte."
    03 | "Mirá el resultado" | "En segundos, la IA genera una imagen realista de vos con la prenda puesta."

COLUMNA DERECHA (.fitting-right):
  - position relative, overflow hidden
  - height: 100vh (llena toda la pantalla)

  Grid interno (.fitting-preview): 2 columnas iguales, height 100%

  Cada columna (.fitting-col):
    - position relative, overflow hidden
    - img: width/height 100%, object-fit cover
    - Hover: img transform scale(1.05), transition 0.8s ease-out

    .fitting-label: position absolute, bottom 24px, left 24px
      - Manrope 500, 10px, UPPERCASE, letter-spacing 0.14em, color #F5F5F5
      - background: rgba(10,10,10,0.7), backdrop-filter blur(10px), padding 8px 16px
      - Izquierda: "Tu foto" | Derecha: "Resultado IA"

  FLECHA CENTRAL (.fitting-arrow):
    - position absolute, top 50%, left 50%, translate(-50%,-50%), z-index 10
    - 60x60px, border-radius 50%
    - background: #C8FF00, color: #0A0A0A, font-size 24px, font-weight 700
    - box-shadow: 0 8px 30px rgba(200,255,0,0.3)
    - Animación "arrowPulse": 0%,100% scale(1) → 50% scale(1.1), duration 2s infinite
    - Contenido: "→"

RESPONSIVE:
  - max-width 1024px: grid 1 columna, .fitting-right height 500px
```

---

## PROMPT 7 — TOKEN ECONOMY

```
Creá la sección "Token Economy" de Plur explicando el sistema de tokens PLR.

DESIGN SYSTEM PLUR:
  Gray-700: #1A1A1A | Gray-600: #303030 | Blanco: #F5F5F5 | Accent: #C8FF00
  Font display: 'Syne' | Font body: 'Manrope'
  ease-out: cubic-bezier(0.16, 1, 0.3, 1) | ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)

ESTRUCTURA: section.section.section-mid con id="tokens"
  - background: #1A1A1A
  - Contador: "03 / 04"

ENCABEZADO (reveal):
  - Eyebrow: "03 — Token Economy"
  - Título: "Vendé ropa" + "." en #C8FF00 + br + "Ganá tokens" + "." en #C8FF00
  - Descripción: "Cada prenda que subís para vender te genera tokens PLR. Usalos para adquirir ropa de otros usuarios sin gastar un peso. Tu guardarropa se convierte en tu moneda."

TOKEN GRID (.token-grid):
  - Grid 3 columnas, gap 2px, margin-top 64px

  Cada .token-card:
    - background: #1A1A1A (normal), hover: #303030
    - padding: clamp(32px, 3vw, 56px)
    - position relative, overflow hidden, SIN border-radius
    - transition: background 0.5s ease-out

    .token-card-icon: font-size 40px, margin-bottom 24px
    .token-card-title: Syne 700, clamp(18px, 1.5vw, 24px), letter-spacing -0.02em, color #F5F5F5, margin-bottom 12px
    .token-card-desc: Manrope 300, 13px, line-height 1.65, opacity 0.5, color #F5F5F5
    .token-card-value: Syne 800, clamp(3rem, 4vw, 5rem), letter-spacing -0.06em, color #C8FF00, margin-top 32px, opacity 0.2

    Cards:
    1. "📤" | "Subí" | "Publicá las prendas que ya no usás. Agregá fotos, talle y estado." | "+50"
    2. "🔄" | "Intercambiá" | "Usá tus tokens PLR para conseguir prendas de otros usuarios. Sin plata de por medio." | "PLR"
    3. "📈" | "Crecé" | "Mientras más vendés y mejor rating tenés, más tokens ganás por prenda." | "x2"

TOKEN EXCHANGE (.token-exchange):
  - Grid 3 columnas: "1fr auto 1fr", gap 32px, align-items center
  - margin-top: 80px, padding: 48px
  - border: 1px solid #303030
  - SIN border-radius

  Lados (.token-exchange-side, text-align center):
    .token-exchange-icon: font-size 48px, margin-bottom 16px
    .token-exchange-label: Syne 700, 18px, color #F5F5F5, margin-bottom 8px
    .token-exchange-sub: Manrope 400, 12px, opacity 0.4, color #F5F5F5

    Lado izquierdo: "👗" | "Tu ropa" | "Prendas que ya no usás"
    Lado derecho: "✨" | "Nueva ropa" | "Pre-loved, vintage, diseño"

  FLECHA CENTRAL (.token-exchange-arrow):
    - Syne 800, 32px, color #C8FF00
    - Animación "arrowBounce": 0%,100% translateX(0) → 50% translateX(8px), duration 1.5s infinite
    - Contenido: "→"

RESPONSIVE:
  - max-width 1024px: .token-grid en 1 columna
  - max-width 768px: .token-exchange en 1 columna, flecha con rotate(90deg)
```

---

## PROMPT 8 — GALLERY / COLLECTION

```
Creá la sección "Collection" de Plur con un grid editorial de prendas.

DESIGN SYSTEM PLUR:
  Negro: #0A0A0A | Blanco: #F5F5F5 | Accent: #C8FF00
  Font display: 'Syne' | Font body: 'Manrope' 500
  ease-out: cubic-bezier(0.16, 1, 0.3, 1)

ESTRUCTURA: section.section.section-dark con id="collection"
  - Contador: "04 / 04"

ENCABEZADO (reveal):
  - Eyebrow: "04 — Collection"
  - Título: "Lo más" / "buscado" + "." en #C8FF00
  - Descripción: "Prendas trending entre la comunidad Plur. Moda circular que no pierde estilo."

GALLERY GRID (.gallery-grid):
  - Grid 4 columnas, 2 filas implícitas, gap 4px, margin-top 64px

  Cada .gallery-item:
    - position relative, overflow hidden
    - aspect-ratio: 3/4, cursor pointer
    - SIN border-radius

    Variante .wide: grid-column span 2, aspect-ratio 3/2
    Variante .tall: grid-row span 2

    img: width/height 100%, object-fit cover
      - filter: brightness(0.85)
      - transition: transform 0.8s + filter 0.8s ease-out

    Hover img: scale(1.06), filter brightness(1)

    .gallery-item-overlay:
      - position absolute, inset 0
      - background: linear-gradient(transparent 50%, rgba(10,10,10,0.8))
      - opacity 0, transition 0.5s ease-out
      - display flex, flex-direction column, justify-content flex-end, padding 24px

    Hover .gallery-item-overlay: opacity 1

    .gallery-item-name: Syne 700, 16px, color #F5F5F5
    .gallery-item-price: Manrope 500, 12px, color #C8FF00, margin-top 4px
    .gallery-item-tokens: Manrope 400, 10px, UPPERCASE, letter-spacing 0.08em, opacity 0.5, color #F5F5F5

ITEMS DEL GRID (layout):
  1. Tall (2 filas), col 1: "Trench Oversize" | "120 PLR" | "o $45.000 ARS"
  2. Normal, col 2: "Vestido Midi Floral" | "80 PLR" | "o $32.000 ARS"
  3. Normal, col 3: "Blazer Vintage" | "95 PLR" | "o $38.000 ARS"
  4. Normal, col 2 (segunda fila): "Camisa Seda" | "70 PLR" | "o $28.000 ARS"
  5. Wide (2 cols), cols 3-4 (segunda fila): "Conjunto Total Black" | "200 PLR" | "o $78.000 ARS"
  6. Normal, col 4 (primera fila): "Bolso Cuero" | "110 PLR" | "o $44.000 ARS"

RESPONSIVE:
  - max-width 1024px: grid 2 columnas, .wide vuelve a span 1 con aspect-ratio 3/4
```

---

## PROMPT 9 — SOCIAL PROOF / TESTIMONIOS

```
Creá la sección de testimonios de la comunidad Plur.

DESIGN SYSTEM PLUR:
  Blanco: #F5F5F5 | Negro: #0A0A0A | Accent dim: #A0CC00 | Gray-400: #707070
  Font display: 'Syne' 800 | Font body: 'Manrope' 300/600

ESTRUCTURA: section.section.section-light

ENCABEZADO CENTRADO (text-align center, margin-bottom 64px):
  - Eyebrow: "Comunidad" — color #707070
  - Título: Syne 800, clamp(2.5→5rem), color #0A0A0A, max-width 600px centrado
    "Lo que dicen" + "." en #A0CC00

PROOF GRID (.proof-grid):
  - Grid 3 columnas, gap 2px, margin-top 64px

  Cada .proof-card:
    - padding: clamp(28px, 3vw, 48px)
    - border: 1px solid rgba(10,10,10,0.1)
    - background: #F5F5F5
    - SIN border-radius

    .proof-card-stars: font-size 14px, margin-bottom 16px, letter-spacing 2px, color #0A0A0A
      → "★★★★★"

    .proof-card-text: Manrope 300, 14px, line-height 1.7, color #0A0A0A, opacity 0.7
      margin-bottom 24px, font-style italic

    .proof-card-author: flex, align-items center, gap 12px

    .proof-card-avatar: 36x36px, border-radius 50%, object-fit cover

    .proof-card-name: Manrope 600, 12px, letter-spacing 0.02em, color #0A0A0A
    .proof-card-role: Manrope 400, 10px, opacity 0.4, color #0A0A0A

TESTIMONIOS:
  1. ★★★★★ | "Vendí ropa que no usaba hace meses y con esos tokens me armé un guardarropa nuevo. Es adictivo." | Valentina R. | 240 intercambios
  2. ★★★★★ | "El probador con IA es un game changer. Ya no compro nada sin probármelo virtualmente." | Tomás L. | 89 matches
  3. ★★★★★ | "Me encanta la idea de que mi ropa tenga una segunda vida. Y el sistema de swipe es súper divertido." | Camila S. | 156 intercambios

RESPONSIVE:
  - max-width 1024px: .proof-grid en 1 columna
```

---

## PROMPT 10 — CTA FINAL

```
Creá la sección CTA final de Plur para invitar a los usuarios a unirse.

DESIGN SYSTEM PLUR:
  Negro: #0A0A0A | Blanco: #F5F5F5 | Accent: #C8FF00
  Font display: 'Syne' 800 | Font body: 'Manrope' 300

ESTRUCTURA (.cta-section.section-dark):
  - text-align: center
  - display flex, flex-direction column, align-items center
  - padding: clamp(120px, 15vw, 200px) clamp(24px, 5vw, 80px)

TÍTULO (.cta-title):
  - Syne 800, clamp(3rem, 6vw, 7rem)
  - letter-spacing: -0.06em, line-height: 0.92, UPPERCASE
  - margin-bottom: 24px, color: #F5F5F5
  - Contenido:
    Line 1: "Tu ropa"
    Line 2: "merece otra"
    Line 3: "vida." con "vida" en #C8FF00

DESCRIPCIÓN (.cta-desc):
  - Manrope 300, clamp(14px, 1.1vw, 17px), line-height 1.7
  - max-width: 500px, opacity: 0.5, margin-bottom: 48px, color: #F5F5F5
  - Texto: "Unite a la comunidad de moda circular más grande. Swipeá, probate, intercambiá. Sin desperdicio."

ACCIONES (.cta-actions, display flex, gap 16px):
  - .btn-primary → "Crear cuenta gratis"
  - .btn-outline → "Explorar prendas"

ANIMACIONES:
  - .cta-title: reveal
  - .cta-desc: reveal + delay 0.1s
  - .cta-actions: reveal + delay 0.2s
```

---

## PROMPT 11 — FOOTER

```
Creá el footer de Plur con branding y links de navegación.

DESIGN SYSTEM PLUR:
  Negro: #0A0A0A | Blanco: #F5F5F5 | Gray-700: #1A1A1A | Accent: #C8FF00
  Font display: 'Syne' 800 | Font body: 'Manrope' 300/600

FOOTER (.footer):
  - border-top: 1px solid #1A1A1A
  - padding: 64px clamp(24px, 5vw, 80px)
  - display grid, grid-template-columns: "2fr 1fr 1fr 1fr", gap 48px
  - background: #0A0A0A

COLUMNA BRAND:
  .footer-brand-name: Syne 800, 20px, UPPERCASE, letter-spacing -0.02em, margin-bottom 16px, color #F5F5F5
    → "PLUR" + "." en #C8FF00
  .footer-brand-desc: Manrope 300, 12px, line-height 1.7, opacity 0.4, max-width 300px, color #F5F5F5
    → "Moda circular para una nueva generación. Cada prenda tiene una historia — dale un nuevo capítulo."

COLUMNAS DE LINKS (.footer-col):
  .footer-col-title: Manrope 600, 10px, UPPERCASE, letter-spacing 0.14em, margin-bottom 20px, opacity 0.3, color #F5F5F5
  Links: Manrope 300, 13px, opacity 0.5 → hover 1.0, display block, margin-bottom 12px, transition 0.3s

  Col 1 "PLATAFORMA": Swipe & Match | Probador IA | Tokens PLR | Publicar prenda
  Col 2 "COMUNIDAD": Blog | Instagram | Discord | Embajadores
  Col 3 "LEGAL": Términos | Privacidad | Envíos | Guía de talles

FOOTER BOTTOM (.footer-bottom):
  - border-top: 1px solid #1A1A1A
  - padding: 24px clamp(24px, 5vw, 80px)
  - display flex, justify-content space-between
  - Manrope 400, 10px, opacity 0.25, UPPERCASE, letter-spacing 0.06em, color #F5F5F5
  - Izquierda: "© 2026 Plur. Todos los derechos reservados."
  - Derecha: "Hecho con ♻️ para el planeta"

RESPONSIVE:
  - max-width 1024px: .footer en 2 columnas
  - max-width 768px: .footer en 1 columna
```

---

## PROMPT 12 — SCROLL ANIMATIONS SYSTEM

```
Implementá el sistema de animaciones de scroll reveal para Plur.

CSS:
  .reveal:
    opacity: 0
    transform: translateY(50px)
    transition: opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1), transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)

  .reveal.visible:
    opacity: 1
    transform: translateY(0)

  .reveal-delay-1: transition-delay: 0.1s
  .reveal-delay-2: transition-delay: 0.2s
  .reveal-delay-3: transition-delay: 0.3s
  .reveal-delay-4: transition-delay: 0.4s

JAVASCRIPT (IntersectionObserver):
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  )

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el))

APLICAR .reveal a:
  - Todos los títulos de sección
  - Descripciones de sección
  - .feature-item (con delay 1, 2, 3 respectivamente)
  - .fitting-step (con delay 1, 2, 3)
  - .token-card (con delay 1, 2, 3)
  - .token-exchange
  - .gallery-item (con delays)
  - .proof-card (con delays)
  - .cta-title, .cta-desc, .cta-actions
```

---

## PROMPT 13 — PÁGINA COMPLETA (Todo en uno)

```
Creá el sitio web completo de Plur, un marketplace de moda circular con AI try-on y token economy.

BRAND & ESTILO:
  Nombre: Plur
  Tagline: "La moda circular reinventada"
  Estilo visual: Editorial dark-mode, brutalist, moda de lujo sostenible
  Público: 18-35 años, tech-savvy, Argentina

DESIGN SYSTEM COMPLETO:

  PALETA:
  --pl-white: #F5F5F5
  --pl-black: #0A0A0A
  --pl-gray-100: #E8E8E8  --pl-gray-200: #D0D0D0
  --pl-gray-300: #A0A0A0  --pl-gray-400: #707070
  --pl-gray-500: #505050  --pl-gray-600: #303030
  --pl-gray-700: #1A1A1A
  --pl-accent: #C8FF00    --pl-accent-dim: #A0CC00
  --pl-red: #FF4D6A       --pl-green: #00E676

  TIPOGRAFÍA:
  --pl-font-display: 'Syne', sans-serif        (titulares, logo)
  --pl-font-body: 'Manrope', sans-serif         (texto, UI)
  Google Fonts: Syne wght@400;500;600;700;800 | Manrope wght@300;400;500;600;700;800

  EASING:
  --pl-ease-out:    cubic-bezier(0.16, 1, 0.3, 1)
  --pl-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)
  --pl-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)

  REGLAS VISUALES:
  - Sin border-radius en la mayoría de elementos (cuadrado)
  - Grain overlay SVG con ruido sutil (opacity 0.03)
  - Fondo negro con gradientes oscuros
  - Labels: UPPERCASE + letter-spacing 0.1-0.2em
  - Hover: translateY(-2px o -3px) + box-shadow lime
  - Todo el texto principal en #F5F5F5 sobre fondo #0A0A0A

SECCIONES A INCLUIR (en orden):

1. PRELOADER
   Logo "PLUR" animado con gradiente texto #F5F5F5→#C8FF00, barra de progreso accent
   Desaparece a los 2.2s del load

2. NAVIGATION (fija, z-index 1000)
   Logo "PLUR." (punto en #C8FF00) | Links: Match, AI Fitting, Tokens, Collection
   Badge de tokens PLR en #C8FF00 | CTA "Join Plur" en #C8FF00
   Fondo: rgba(10,10,10,0.6) blur(20px) | Se oculta al hacer scroll down

3. HERO (100vh)
   Imagen editorial de moda de fondo (brightness 0.3, zoom 20s infinito)
   Overlay gradiente negro hacia abajo
   Eyebrow: "Circular Fashion — Redefined" en #C8FF00
   Título Syne 800 (~8rem): "SWIPE." + "Try on. Exchange." (italic, 300, 0.65em)
   Descripción Manrope 300, max 520px
   Botones: [Empezá a matchear] [Cómo funciona]
   Stats flotantes bottom-right: 12K prendas | 4.2K usuarios | 98% satisfacción
   Scroll indicator centrado abajo
   Animaciones fadeUp escalonadas (2.2s, 2.4s, 2.6s, 2.8s, 3s)

4. MARQUEE STRIP
   Texto Syne 700 opacity 0.3 scrolleando infinito:
   "Swipe to match • Probador con IA • Token economy • Circular fashion • Zero waste •"

5. SWIPE / MATCH (dark, 01/04)
   Grid 2 cols: info + phone mockup
   Info: título "ENCONTRÁ TU ESTILO.", 3 features con íconos cuadrados
   Phone: mockup con stack de cartas swipeables (Bomber Vintage 85PLR, Jean Wide Leg 60PLR, etc.)
   Botones pass(✕) / save(★) / like(♥), stamps MATCH y NOPE animados

6. AI FITTING ROOM (light, 02/04)
   Grid 2 cols: pasos + before/after visual
   Izquierda: 3 pasos numerados (01/02/03 en #C8FF00)
   Derecha: 2 fotos lado a lado con hover zoom + labels "Tu foto" y "Resultado IA"
   Flecha central circular pulsante en #C8FF00

7. TOKEN ECONOMY (mid background #1A1A1A, 03/04)
   Título: "VENDÉ ROPA. GANÁ TOKENS."
   Grid 3 cards: [📤 Subí +50] [🔄 Intercambiá PLR] [📈 Crecé x2]
   Exchange visual: Tu ropa → → → Nueva ropa (flecha bouncing #C8FF00)

8. GALLERY / COLLECTION (dark, 04/04)
   Título: "LO MÁS BUSCADO."
   Grid editorial 4 cols: items tall, normal y wide
   Hover overlay con nombre de prenda + precio PLR + precio ARS
   6 prendas: Trench Oversize, Vestido Midi Floral, Blazer Vintage, Camisa Seda, Conjunto Total Black, Bolso Cuero

9. TESTIMONIOS (light)
   Título: "LO QUE DICEN."
   3 proof cards con ★★★★★, cita itálica, avatar y nombre
   Valentina R. (240 intercambios), Tomás L. (89 matches), Camila S. (156 intercambios)

10. CTA FINAL (dark)
    Título centrado Syne 800 (~7rem): "TU ROPA MERECE OTRA VIDA." con "VIDA." en #C8FF00
    Botones: [Crear cuenta gratis] [Explorar prendas]

11. FOOTER
    Grid 4 cols: brand + 3 columnas de links
    Logo "PLUR." | tagline | Plataforma | Comunidad | Legal
    Bottom bar con copyright y "Hecho con ♻️ para el planeta"

JAVASCRIPT A INCLUIR:
  1. Preloader: ocultar a los 2200ms del load
  2. Scroll reveal: IntersectionObserver threshold 0.15
  3. Nav hide on scroll: ocultar al bajar, mostrar al subir
  4. Swipe cards: renderizar stack de 3, animar con stamps MATCH/NOPE al hacer clic
  5. Touch swipe: soporte táctil para las tarjetas (touchstart/touchend, diff > 60px)

RESPONSIVE:
  - 1024px: swipe en 1 col, fitting en 1 col, token grid 1 col, gallery 2 cols, ocultar hero stats
  - 768px: ocultar nav links + nav tokens, token exchange en 1 col, gallery 2 cols, footer 1 col
```

---

*Generado para Plur — Hackathon Aleph 2026*
