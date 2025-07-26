# Arquitectura y Guía de Desarrollo: 1vs1 FutDraft

Este documento proporciona una visión general de la arquitectura de la aplicación, las pautas de desarrollo y las especificaciones técnicas clave del proyecto.

## 1. Documentación de Arquitectura

### 1.1. Esquema de Alto Nivel

La aplicación sigue una arquitectura basada en Next.js, separando las responsabilidades entre el frontend, los servicios de backend (BaaS) y los servicios de terceros.

```
+---------------------+      +------------------------+      +-------------------+
|     Navegador       |      |    Servidor Next.js    |      |     Servicios     |
| (React/Next.js)     |      |       (Firebase)       |      |     Externos      |
+---------------------+      +------------------------+      +-------------------+
| - UI con shadcn/ui  |      | - Renderizado (SSR/SSG)|      |                   |
| - Estado (Zustand)  | <--->| - Server Components    |      |                   |
| - Lógica de cliente |      | - Server Actions       | <--->| [Firebase]        |
| - Routing (App R.)  |      |                        |      | - Firestore (DB)  |
+---------------------+      |                        |      | - Auth            |
         ^                   +------------------------+      +-------------------+
         |                               ^                         ^
         |                               |                         |
         +-------------------------------+-------------------------+
                                         |
                                         v
                               +-------------------+
                               |    [ImageKit.io]  |
                               | - CDN de Imágenes |
                               | - Transformación  |
                               +-------------------+
```

### 1.2. Componentes Principales

*   **`FootballPitch.tsx`**: Renderiza el campo de fútbol visualmente. Utiliza CSS para las líneas del campo y posicionamiento absoluto para los `PlayerSlot`.
*   **`PlayerSlot.tsx`**: Representa una posición individual en el campo o en el banquillo. Es interactivo y muestra la información del jugador asignado.
*   **`FormationSelector.tsx`**: Permite al usuario seleccionar una formación táctica de una lista predefinida. Su estado se gestiona con Zustand.
*   **`PlayerComparisonModal.tsx`**: Un modal complejo que permite buscar, filtrar y seleccionar jugadores para una posición específica.
*   **`TeamRoster.tsx`**: Muestra la lista de jugadores de un equipo, ordenada por posición.
*   **`PlayerCard.tsx`**: Componente de UI para mostrar la información de un jugador, con variantes para vistas detalladas o compactas.
*   **`NationalitySelector.tsx`**: Componente reutilizable construido con `react-select` para buscar y seleccionar la nacionalidad de un jugador/entrenador.

### 1.3. Flujos de Datos

*   **Carga de Datos (Firestore)**: Los datos de equipos y jugadores se cargan desde la colección `equipos` en Firestore. Esto ocurre principalmente en la selección de equipos (`/build`, `/compare`) y en el panel de administración.
*   **Gestión de Estado (Zustand)**: `lineupStore` es el corazón del estado del cliente. Gestiona:
    *   Los equipos cargados (`teamA`, `teamB`).
    *   La formación seleccionada.
    *   La alineación ideal (`idealLineup`).
    *   Sincroniza el estado de la alineación con `localStorage` para persistencia entre sesiones.
*   **Mutaciones de Datos (Server Actions)**: Todas las operaciones de creación, actualización y eliminación (CUD) se manejan a través de Server Actions en `src/actions/`. Esto simplifica la lógica al evitar la necesidad de crear rutas de API explícitas.
    *   **Ejemplo (Subida de Imagen)**:
        1.  El cliente convierte la imagen a Base64.
        2.  Llama al Server Action `uploadImage`.
        3.  El Server Action se comunica de forma segura con la API de ImageKit.
        4.  Devuelve la URL y el `fileId` de la imagen.
        5.  El cliente guarda esta información en Firestore.

## 2. Guía de Desarrollo

### 2.1. Estructura de Carpetas

```
/
├── public/
├── src/
│   ├── app/                # Rutas (App Router)
│   │   ├── (main)/         # Rutas públicas (landing, build, compare, lineup)
│   │   └── admin/          # Rutas protegidas del panel de admin
│   ├── components/         # Componentes de React
│   │   ├── ui/             # Componentes base de ShadCN UI (no modificar)
│   │   └── (custom)/       # Componentes personalizados de la aplicación
│   ├── data/               # Datos estáticos (ej. lista de países)
│   ├── hooks/              # Hooks personalizados (ej. use-mobile)
│   ├── lib/                # Funciones de utilidad y configuraciones
│   │   ├── firebase.ts     # Configuración de Firebase
│   │   ├── imagekit.ts     # Configuración de ImageKit
│   │   └── formations.ts   # Definiciones de las formaciones tácticas
│   ├── store/              # Estado global con Zustand (lineupStore)
│   ├── types/              # Definiciones de tipos de TypeScript
│   └── actions/            # Server Actions para operaciones de backend
└── docs/                   # Documentación del proyecto
```

### 2.2. Convenciones de Código

*   **TypeScript**: Usar tipado estricto. Todas las estructuras de datos principales están definidas en `src/types/index.ts`.
*   **Estilo**: Utilizar `shadcn/ui` y **Tailwind CSS**. Evitar CSS en línea o archivos CSS separados. La configuración de colores se gestiona a través de variables CSS en `globals.css`.
*   **Componentes**:
    *   Crear componentes funcionales con Hooks.
    *   Priorizar la creación de componentes pequeños y reutilizables.
    *   Usar Server Components por defecto. Añadir `'use client'` solo cuando sea estrictamente necesario (interactividad, hooks de estado).
*   **Server Actions**: Para todas las mutaciones que requieran interacción con servicios de backend (Firebase, ImageKit). Mantener estas acciones en la carpeta `src/actions`.
*   **Commits**: Seguir un estilo de commits convencional (ej. `feat: ...`, `fix: ...`, `docs: ...`).

## 3. Especificaciones Técnicas

### 3.1. Librerías y Servicios Clave

*   **Next.js**: Framework principal. Se utiliza el App Router.
*   **React**: Biblioteca para la construcción de la UI.
*   **Firebase**:
    *   **Firestore**: Base de datos NoSQL para equipos, jugadores y entrenadores.
    *   **Authentication**: Para proteger el panel de administración.
*   **ImageKit.io**: CDN y servicio de optimización de imágenes.
*   **Zustand**: Gestor de estado minimalista para el estado global del cliente.
*   **shadcn/ui**: Colección de componentes de UI construidos sobre Tailwind CSS.
*   **react-select**: Para selectores de búsqueda avanzada (ej. Nacionalidad).
*   **html-to-image**: Para generar la imagen PNG de la alineación final.

### 3.2. Configuración de Entorno

Se utilizan variables de entorno para las claves de API de Firebase e ImageKit, que están configuradas en el entorno de Firebase App Hosting.

### 3.3. Decisiones Técnicas

*   **Server Actions vs. API Routes**: Se eligieron Server Actions para simplificar las mutaciones de datos. Reducen el boilerplate y mantienen la lógica de backend más cerca de los componentes que la utilizan, lo cual es ideal para un proyecto de este tamaño.
*   **Zustand vs. React Context**: Zustand se seleccionó por su rendimiento superior y su API más sencilla. Evita los re-renders innecesarios que pueden ocurrir con Context API en aplicaciones con estado complejo.
*   **Modelo de Datos en Firestore**: Se utiliza un modelo desnormalizado donde cada documento en la colección `equipos` contiene toda la información del equipo, incluyendo un array anidado de `players` y un objeto `coach`. Esto simplifica las lecturas, ya que se puede obtener toda la información de un equipo con una sola consulta.
