
# 🏆 1vs1 FutDraft ⚽

[![Estado del Proyecto](https://img.shields.io/badge/estado-en%20desarrollo-yellowgreen)](https://github.com/moonthang/1vs1)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

1vs1 FutDraft es una aplicación web interactiva y altamente personalizable diseñada para aficionados al fútbol que desean crear, visualizar y compartir alineaciones de manera profesional.


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

**1vs1 FutDraft** es una aplicación web interactiva, diseñada para que los aficionados al fútbol colombiano puedan crear, visualizar y compartir alineaciones. Este proyecto, desarrollado como parte de mi portafolio, demuestra la capacidad de construir una aplicación full-stack moderna, interactiva y escalable.

La plataforma permite a los usuarios sumergirse en la estrategia táctica del fútbol a través de dos modos principales:

### 🔧 **Arma tu Equipo**
Un modo enfocado en un solo club, que permite al usuario:
*   Construir la alineación ideal desde cero.
*   Probar diferentes formaciones tácticas.
*   Seleccionar jugadores para cada posición, incluyendo un banquillo de suplentes.

### ⚔️ **1 vs 1: Comparativa**
El modo insignia donde dos equipos se enfrentan. Aquí, los usuarios pueden:
*   Crear un "11 ideal" combinado, seleccionando jugadores de ambos equipos.
*   Comparar jugadores posición por posición.
*   Obtener un resumen visual de qué equipo domina la selección final.

Además, la aplicación incluye un **Panel de Administración** protegido por contraseña, que sirve como un CMS (Sistema de Gestión de Contenidos) para gestionar toda la información de la aplicación de forma dinámica.

## 🚀 Tecnologías Utilizadas

### **Frontend**
| Tecnología | Descripción |
| :--- | :--- |
| <img src="https://cdn.worldvectorlogo.com/logos/next-js.svg" width="20" height="20" alt="Next.js"/> **Next.js** | Framework de React para producción con renderizado del lado del servidor (SSR) y generación estática (SSG). |
| <img src="https://cdn.worldvectorlogo.com/logos/react-2.svg" width="20" height="20" alt="React"/> **React** | Biblioteca de JavaScript para construir interfaces de usuario interactivas y reutilizables. |
| <img src="https://cdn.worldvectorlogo.com/logos/typescript.svg" width="20" height="20" alt="TypeScript"/> **TypeScript** | Superset de JavaScript que añade tipado estático para mayor robustez y mantenibilidad del código. |
| <img src="https://cdn.worldvectorlogo.com/logos/tailwind-css-2.svg" width="20" height="20" alt="Tailwind CSS"/> **Tailwind CSS** | Framework CSS de utilidad para un diseño rápido y personalizado. |
| <img src="https://avatars.githubusercontent.com/u/139895814?s=200&v=4" width="20" height="20" alt="ShadCN UI"/> **ShadCN UI** | Componentes de UI reutilizables, accesibles y personalizables. |
| <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRpHj4UwTW4ANSlNjzQOiiOqfDa6kal9RpF0A&s" width="20" height="20" alt="Zustand"/> **Zustand** | Gestor de estado minimalista y potente para React. |
| <img src="https://avatars.githubusercontent.com/u/66879934?v=4" width="20" height="20" alt="Lucide Icons"/> **Lucide Icons** | Biblioteca de iconos SVG, limpia y consistente. |
|  **React Select** | Componente avanzado para selectores con búsqueda y personalización. |
|  **html-to-image** | Librería para convertir un nodo HTML del DOM en una imagen. |

### **Backend y Base de Datos**
| Tecnología | Descripción |
| :--- | :--- |
| <img src="https://cdn4.iconfinder.com/data/icons/google-i-o-2016/512/google_firebase-2-512.png" width="20" height="20" alt="Firebase"/> **Firebase** | Utilizado como el backend principal. **Cloud Firestore** actúa como la base de datos NoSQL en tiempo real para almacenar equipos, jugadores y estadísticas. **Firebase Authentication** se usa para proteger el panel de administración. |

### **Gestión de Imágenes** 
| Tecnología | Descripción |
| :--- | :--- |
| <img src="https://media.licdn.com/dms/image/v2/C4D0BAQGFJ1PL2upDCg/company-logo_200_200/company-logo_200_200/0/1630483926785/imagekit_io_logo?e=2147483647&v=beta&t=ilQhn0wSkIYCBBBcp5_G-iZrf-ISHKUNVe-KupdF_48" width="20" height="20" alt="ImageKit"/> **ImageKit.io** | CDN y servicio de optimización de imágenes para una carga rápida y eficiente de los logos y fotos de jugadores. |

## ✨ Características Principales

*   ✅ **Gestión Completa desde el Admin:** Crear, editar, eliminar y **mover jugadores entre equipos**.
*   🔐 **Autenticación Segura:** El panel de administración está protegido con Firebase Authentication (correo y contraseña).
*   🎨 **Personalización Visual de Equipos:** Asignar logos, fotos, colores primarios/secundarios y estadísticas detalladas a cada equipo y jugador.
*   🏳️ **Nacionalidad con Banderas:** Cada jugador y entrenador muestra su nacionalidad. La selección se realiza a través de un **buscador de países intuitivo y visual**.
*   📊 **Selección de Formación Táctica:** Elige entre formaciones populares (4-4-2, 4-3-3, etc.) que se reflejan visualmente en un campo de fútbol interactivo.
*   👆 **Campo de Fútbol Interactivo:** Coloca jugadores en una representación gráfica del campo. Los jugadores seleccionados muestran su foto y nombre.
*   🧠 **Modal de Selección Inteligente:** Al hacer clic en una posición, un modal muestra solo los jugadores elegibles, con sus estadísticas, y permite buscar y ordenar para facilitar la selección.
*   🖼️ **Exportación a Imagen:** Descarga una imagen de alta calidad de tu alineación final, lista para compartir en redes sociales.
*   💾 **Persistencia de Datos:** Las alineaciones se guardan en el `localStorage` del navegador, permitiendo a los usuarios continuar donde lo dejaron.
*   📱 **Interfaz Responsiva:** Diseño completamente adaptable que funciona a la perfección en dispositivos de escritorio, tabletas y móviles.
*   🔄 **Importación/Exportación de Datos:** Respalda y restaura toda la información de los equipos con archivos JSON desde el panel de administración.
*   📊 **Estadísticas Globales:** Visualiza rankings de los mejores jugadores de toda la liga en categorías como Goleadores, Asistidores y más.

## 📸 Capturas de Pantalla

| Página Principal | Constructor de Alineaciones | Modal de Selección |
| :---: | :---: | :---: |
| ![Página Principal](https://ik.imagekit.io/mdjzw07s9/Capturas/paginaPrincipal?updatedAt=1751585612252) | ![Constructor de Alineaciones](https://ik.imagekit.io/mdjzw07s9/Capturas/constructorAlineaciones?updatedAt=1751585951491) | ![Modal de Selección](https://ik.imagekit.io/mdjzw07s9/Capturas/modalSeleccion?updatedAt=1751585969628) |

| Panel de Administración | Edición de Plantilla |
| :---: | :---: |
| ![Panel de Administración](https://ik.imagekit.io/mdjzw07s9/Capturas/panelAdministracion?updatedAt=1751586000793) | ![Edición de Plantilla](https://ik.imagekit.io/mdjzw07s9/Capturas/edicionPlantilla?updatedAt=1751585984305) |


## 🧑‍💻 Uso del Sistema

1.  **Elige un Modo:** En la página de inicio, selecciona "Arma tu Equipo" o "1 vs 1: Comparativa".
2.  **Selecciona los Equipos:** Elige el equipo (o los dos equipos) con los que deseas trabajar.
3.  **Elige una Formación:** Utiliza el selector desplegable para cambiar la formación táctica en el campo.
4.  **Construye tu Alineación:**
    *   Haz clic en cualquier círculo de posición vacío (`POR`, `DFC`, etc.) en el campo.
    *   En el modal, explora los jugadores elegibles. Puedes buscarlos por nombre u ordenarlos por estadísticas.
    *   Haz clic en un jugador para asignarlo a la posición.
5.  **Gestiona el Banquillo:** Llena los 7 espacios de suplentes y asigna un director técnico.
6.  **Exporta:** Cuando tu alineación esté lista, haz clic en el botón "Exportar como Imagen" para descargar un archivo PNG.

## 📂 Estructura del Proyecto

El proyecto sigue una estructura organizada basada en las mejores prácticas de Next.js App Router.

```
/
├── public/
├── src/
│   ├── app/                # Rutas de la aplicación (páginas y layouts)
│   │   ├── (main)/         # Rutas públicas
│   │   └── admin/          # Rutas protegidas del panel de admin
│   ├── components/         # Componentes de React reutilizables
│   │   ├── ui/             # Componentes base de ShadCN UI
│   │   ├── FootballPitch.tsx   # Campo de fútbol interactivo que muestra la alineación.
│   │   ├── PlayerCard.tsx      # Tarjeta para mostrar la información de un jugador.
│   │   ├── PlayerSlot.tsx      # Círculo interactivo que representa una posición en el campo.
│   │   ├── FormationSelector.tsx # Permite al usuario elegir una formación táctica.
│   │   ├── PlayerComparisonModal.tsx # Modal para buscar y seleccionar jugadores.
│   │   └── NationalitySelector.tsx # Selector de país con búsqueda.
│   ├── data/               # Datos estáticos (ej. lista de países)
│   ├── hooks/              # Hooks personalizados (use-mobile, use-toast)
│   ├── lib/                # Funciones de utilidad y configuraciones (firebase, imagekit, etc.)
│   ├── store/              # Lógica de estado global con Zustand
│   └── types/              # Definiciones de TypeScript
├── docs/
│   └── blueprint.md        # Documentación de arquitectura y desarrollo
├── next.config.ts          # Configuración de Next.js
├── tailwind.config.ts      # Configuración de Tailwind CSS
└── tsconfig.json           # Configuración de TypeScript
```

## 🗺️ Roadmap

Ideas y características potenciales para futuras versiones:

*   [ ] **Sistema de Estadísticas Mejorado:** Integrar un scraper (ej. con una Cloud Function en Python) para actualizar automáticamente las estadísticas de los jugadores desde fuentes públicas.
*   [ ] **Modo Multijugador Cooperativo (Votación en Tiempo Real):**
    *   **Objetivo:** Permitir que hasta 5 usuarios se unan a una sala y voten por los jugadores en cada posición para crear una alineación colaborativa. El jugador con más votos en cada posición es el que se muestra en la alineación final.
    *   **Pasos de Implementación:**
        1.  **Backend (Firestore):** Crear una nueva colección `partidas_cooperativas`. Cada documento representará una sesión con campos para `usuarios`, `equiposSeleccionados` y un mapa de `votos` (`{posicion: {jugadorId: contadorVotos}}`).
        2.  **Gestión de Sesiones:** Implementar la lógica para crear una nueva partida (generando un ID único), unirse a una existente a través de un enlace, y limitar el número de participantes.
        3.  **Sincronización en Tiempo Real:** Modificar la página de alineación para que escuche los cambios en el documento de la partida en Firestore en tiempo real, actualizando la interfaz para todos los usuarios simultáneamente.
        4.  **Sistema de Votación:** Cambiar la lógica del modal de selección: en lugar de seleccionar un jugador, hacer clic emitirá un "voto" que actualizará el contador en Firestore.
        5.  **Interfaz de Usuario:** Actualizar los componentes `PlayerSlot` y `PlayerCard` para mostrar el jugador con más votos y el recuento de votos actual. Añadir un componente para visualizar los usuarios conectados a la sesión.
*   [ ] **Añadir más Ligas y Equipos:** Expandir la base de datos para incluir más ligas y equipos internacionales.
*   [ ] **Arrastrar y Soltar (Drag and Drop):** Implementar la funcionalidad de arrastrar jugadores desde la plantilla al campo para una experiencia más fluida.
*   [ ] **Pruebas Unitarias e Integración:** Añadir un conjunto de pruebas con Jest y React Testing Library para garantizar la robustez de la aplicación.
*   [ ] **Internacionalización (i18n):** Implementar soporte para múltiples idiomas.
*   [ ] **Nuevo Modo 11 Ideal Liga:** Armar un equipo ideal donde permite seleccionar jugadores de todos los equipos.

## 👨‍💻 Autor

Este proyecto fue desarrollado por **Miguel Angel Sepulveda Burgos**.

*   <img src="https://cdn.worldvectorlogo.com/logos/github-icon-2.svg" width="20" height="20"/> GitHub: [@moonthang](https://github.com/moonthang)
*   <img src="https://static.vecteezy.com/system/resources/previews/018/930/480/non_2x/linkedin-logo-linkedin-icon-transparent-free-png.png" width="20" height="20"/> LinkedIn: [Miguel Ángel Sepulveda Burgos](https://www.linkedin.com/in/miguel-%C3%A1ngel-sep%C3%BAlveda-burgos-a87808167/)
