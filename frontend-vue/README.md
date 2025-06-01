# Frontend Vue Project (frontend-vue)

This project is a Vue.js 3 application scaffolded with Vite and configured to use Vuetify 3 for UI components, Pinia for state management, and Vue Router for navigation.

## Project Setup

### Prerequisites

- Node.js (version ^18.0 || ^20.0 || >=21.0)
- npm (or yarn/pnpm)

### Installation

1.  **Clone the repository (if applicable) or navigate into this directory.**
2.  **Install dependencies:**
    ```bash
    npm install
    ```
    Alternatively, if you prefer yarn or pnpm:
    ```bash
    # yarn
    yarn install

    # pnpm
    pnpm install
    ```

## Development Server

To start the development server (usually on `http://localhost:3001` as configured in `vite.config.js`):

```bash
npm run dev
```

## Build for Production

To create a production build in the `dist` directory:

```bash
npm run build
```

## Preview Production Build

To locally preview the production build:

```bash
npm run preview
```

## Project Structure

-   `public/`: Static assets that are copied directly to the build output.
-   `src/`: Main application source code.
    -   `assets/`: Static assets like images, fonts (processed by Vite).
    -   `components/`: Reusable Vue components.
        -   `common/`: Globally reusable components.
    -   `composables/`: Vue 3 composables (reusable stateful logic).
    -   `layouts/`: Main application layouts (e.g., `DefaultLayout.vue`).
    -   `plugins/`: Vue plugin configurations (e.g., `vuetify.js`).
    -   `router/`: Vue Router configuration (`index.js`).
    -   `services/`: Modules for API interactions (e.g., using Axios).
    -   `store/`: Pinia state management stores (`index.js` and individual store files).
    -   `styles/`: Global stylesheets.
    -   `views/`: Page-level components routed by Vue Router.
    -   `App.vue`: The root Vue component.
    -   `main.js`: The entry point of the application, where Vue is initialized with plugins.
-   `index.html`: The main HTML file template used by Vite.
-   `vite.config.js`: Vite configuration file.
-   `package.json`: Project metadata and dependencies.
-   `.gitignore`: Specifies intentionally untracked files that Git should ignore.
-   `README.md`: This file.

## Key Technologies

-   **Vue.js 3:** Progressive JavaScript framework.
-   **Vite:** Fast frontend build tool and development server.
-   **Vuetify 3:** Material Design component framework for Vue.
-   **Pinia:** Intuitive state management library for Vue.
-   **Vue Router 4:** Official routing library for Vue.js.

## Further Information

-   [Vue 3 Documentation](https://vuejs.org/guide/introduction.html)
-   [Vite Documentation](https://vitejs.dev/guide/)
-   [Vuetify 3 Documentation](https://vuetifyjs.com/en/getting-started/installation/)
-   [Pinia Documentation](https://pinia.vuejs.org/introduction.html)
-   [Vue Router Documentation](https://router.vuejs.org/guide/)
