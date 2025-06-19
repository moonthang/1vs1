
# 🏆 1 vs 1: Showdown de Alineaciones de Fútbol ⚽

¡Bienvenido a **1 vs 1**! Una aplicación web interactiva diseñada para los aficionados al fútbol que aman comparar y construir las alineaciones ideales entre Millonarios y Santa Fe. Elige tu formación, selecciona a tus jugadores estrella para cada posición y exporta tu obra maestra como una imagen para compartir.

## 📋 Tabla de Contenidos

*   [📝 Descripción Detallada](#-descripción-detallada)
*   [🚀 Tecnologías Utilizadas](#-tecnologías-utilizadas)
*   [✨ Características Principales](#-características-principales)
*   [📸 Capturas de Pantalla](#-capturas-de-pantalla)
*   [🧑‍💻 Uso del Sistema](#-uso-del-sistema)
*   [📂 Estructura del Proyecto](#-estructura-del-proyecto)
*   [🗺️ Roadmap](#️-roadmap)
*   [👨‍💻 Autor](#-autor)

## 📝 Descripción Detallada

**1 vs 1** te permite sumergirte en el clásico bogotano desde una perspectiva táctica. Esta herramienta te proporciona las plantillas actualizadas de Millonarios y Santa Fe, permitiéndote:

*   Visualizar las plantillas completas de ambos equipos con estadísticas básicas.
*   Elegir entre diversas formaciones tácticas (4-4-2, 4-3-3, 3-5-2, etc.).
*   Hacer clic en cualquier posición del campo para abrir un modal de comparación.
*   Seleccionar o cambiar jugadores para cada posición, filtrando por jugadores elegibles para ese rol.
*   Ver las estadísticas clave de los jugadores directamente en el modal de selección.
*   Observar cómo tu alineación toma forma en una representación visual del campo de fútbol.
*   Obtener un resumen de cuántos jugadores de cada equipo has incluido en tu "11 ideal".
*   Ver cuál equipo "gana" en tu alineación según el número de jugadores seleccionados.
*   Exportar tu alineación final como una imagen PNG de alta calidad, lista para compartir en redes sociales o con amigos.

Es la herramienta perfecta para debatir, analizar y divertirse creando el enfrentamiento definitivo entre los dos grandes de Bogotá.

## 🚀 Tecnologías Utilizadas

Este proyecto está construido con un stack moderno y eficiente:

*   **Frontend:**
    *   [Next.js](https://nextjs.org/): Framework de React para producción.
    *   [React](https://reactjs.org/): Biblioteca de JavaScript para construir interfaces de usuario.
    *   [TypeScript](https://www.typescriptlang.org/): Superset de JavaScript que añade tipado estático.
*   **Estado Global:**
    *   [Zustand](https://zustand-demo.pmnd.rs/): Gestor de estado pequeño, rápido y escalable.
*   **Estilos:**
    *   [Tailwind CSS](https://tailwindcss.com/): Framework CSS de utilidad primero.
    *   [ShadCN UI](https://ui.shadcn.com/): Componentes de UI bellamente diseñados y reutilizables.
*   **Imágenes:**
    *   [ImageKit.io](https://imagekit.io/): Gestión y optimización de imágenes en tiempo real.
    *   [html-to-image](https://github.com/bubkoo/html-to-image): Biblioteca para convertir elementos HTML en imágenes.
*   **Iconos:**
    *   [Lucide Icons](https://lucide.dev/): Iconos SVG simples y consistentes.
*   **Linting y Formato:**
    *   ESLint y Prettier (configuración estándar de Next.js).

## ✨ Características Principales

*   ✅ **Selección de Equipos:** Datos predefinidos para Millonarios y Santa Fe.
*   ✅ **Múltiples Formaciones:** Elige entre formaciones populares como 4-4-2, 4-3-3 (defensivo y ofensivo), y 3-5-2.
*   ✅ **Visualización en el Campo:** Coloca jugadores en una representación gráfica del campo de fútbol.
*   ✅ **Comparación Detallada de Jugadores:** Modal interactivo para seleccionar jugadores, mostrando sus estadísticas clave y disponibilidad.
*   ✅ **Resumen de Alineación:** Conteo de jugadores por equipo.
*   ✅ **Indicador de "Equipo Ganador":** Basado en la mayoría de jugadores seleccionados de un equipo.
*   ✅ **Exportación a PNG:** Descarga tu alineación personalizada como una imagen de alta calidad.
*   ✅ **Interfaz Responsiva:** Adaptable a diferentes tamaños de pantalla.
*   ✅ **Optimización de Imágenes:** Integración con ImageKit para la carga eficiente de imágenes de jugadores.
*   ✅ **Tipado Fuerte:** Desarrollado con TypeScript para mayor robustez y mantenibilidad.

## 📸 Capturas de Pantalla

*(Aquí podrías añadir algunas imágenes de la aplicación en funcionamiento cuando las tengas).*

*Ejemplo: Vista principal de la aplicación, Modal de selección de jugadores, Imagen exportada.*

## 🧑‍💻 Uso del Sistema

1.  **Explora las Plantillas:** En el panel izquierdo, puedes desplegar las plantillas de Millonarios y Santa Fe para ver todos los jugadores disponibles y sus estadísticas básicas.
2.  **Selecciona una Formación:** Utiliza el selector desplegable encima del campo de fútbol para elegir la táctica que deseas emplear.
3.  **Construye tu Alineación:**
    *   Haz clic en cualquier círculo de posición vacío (`POR`, `DFC`, `MC`, `DEL`, etc.) en el campo.
    *   Se abrirá un modal mostrando los jugadores elegibles de ambos equipos para esa posición.
    *   Puedes buscar jugadores por nombre.
    *   Haz clic en la tarjeta de un jugador para seleccionarlo para esa posición. El modal se cerrará automáticamente.
    *   Si deseas cambiar un jugador o quitarlo, vuelve a hacer clic en la posición en el campo y selecciona otro jugador o la opción "Quitar Jugador".
4.  **Revisa tu Resumen:** En el panel derecho, la tarjeta "Resumen de Alineación" te mostrará cuántos jugadores de cada equipo has seleccionado y cuál sería el "Equipo Ganador" según tu selección.
5.  **Exporta tu Creación:**
    *   Cuando estés satisfecho con tu alineación, haz clic en el botón "Exportar como Imagen" en el panel derecho.
    *   Se generará una imagen PNG de tu campo con los jugadores seleccionados y se descargará automáticamente.

## 📂 Estructura del Proyecto

El proyecto sigue una estructura organizada para facilitar el desarrollo y mantenimiento:

```
/
├── public/                
├── src/
│   ├── app/                # Rutas principales de Next.js (page.tsx, layout.tsx, globals.css)
│   ├── assets/             # Activos locales como el logo
│   │   └── logo/
│   │       └── 1vs1.png
│   ├── components/         # Componentes de React reutilizables
│   │   ├── ui/             # Componentes base de ShadCN UI
│   │   ├── FootballPitch.tsx
│   │   ├── FormationSelector.tsx
│   │   ├── PlayerCard.tsx
│   │   ├── PlayerComparisonModal.tsx
│   │   ├── PlayerSlot.tsx
│   │   └── TeamRoster.tsx
│   ├── data/               # Archivos JSON con datos de equipos y jugadores
│   │   ├── millos.json
│   │   └── santafe.json
│   ├── hooks/              # Hooks personalizados de React
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── lib/                # Funciones de utilidad y configuraciones
│   │   ├── formations.ts
│   │   └── utils.ts
│   ├── store/              # Configuración del gestor de estado (Zustand)
│   │   └── lineupStore.ts
│   └── types/              # Definiciones de TypeScript
│       └── index.ts
├── components.json         # Configuración de ShadCN UI
├── next.config.ts          # Configuración de Next.js
├── package.json
├── tailwind.config.ts      # Configuración de Tailwind CSS
└── tsconfig.json           # Configuración de TypeScript
```

## 🗺️ Roadmap

Ideas y características potenciales para futuras versiones:

*   [ ] **Más Equipos:** Añadir soporte para más equipos de la liga colombiana u otras ligas.
*   [ ] **Estadísticas Avanzadas:** Integrar análisis más profundos o comparaciones de estadísticas entre jugadores.
*   [ ] **Guardar/Compartir Alineaciones:** Permitir a los usuarios guardar sus alineaciones o compartirlas mediante un enlace.
*   [ ] **Autenticación de Usuarios:** Para guardar preferencias o alineaciones personalizadas.
*   [ ] **Arrastrar y Soltar (Drag and Drop):** Implementar la funcionalidad de arrastrar jugadores desde la plantilla al campo.
*   [ ] **Modo Oscuro Mejorado/Personalizable.**
*   [ ] **Internacionalización (i18n):** Soporte para múltiples idiomas.
*   [ ] **Pruebas Unitarias e Integración.**

## 👨‍💻 Autor

**1 vs 1** fue desarrollado por **Miguel Angel Sepulveda Burgos**.

*   <img src="https://cdn.worldvectorlogo.com/logos/github-icon-2.svg" width="20" height="20" alt="GitHub"/> GitHub: [@moonthang](https://github.com/moonthang)
*   <img src="https://static.vecteezy.com/system/resources/previews/018/930/480/non_2x/linkedin-logo-linkedin-icon-transparent-free-png.png" width="20" height="20" alt="LinkedIn"/> LinkedIn: [Miguel Ángel Sepulveda Burgos](https://www.linkedin.com/in/miguel-%C3%A1ngel-sep%C3%BAlveda-burgos-a87808167/)

---
