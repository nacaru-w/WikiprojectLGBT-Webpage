import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // SSR pre-renders the carousel with isAllLoaded=true, which makes the box
  // frame appear before @popAnimation can run on hydration. Render client-side
  // so the wrapper enters the DOM together with its children.
  { path: '', renderMode: RenderMode.Client },
  { path: 'home', renderMode: RenderMode.Client },
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
