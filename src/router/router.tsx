import { ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Home from '../components/pages/Home';
import Storms from '../components/pages/Storms';
import Hurricane from '../components/pages/Hurricane';
import Resources from '../components/pages/Resources';

enum Routes {
  home = '/',
  storms = '/storms',
  hurricanes = '/hurricanes',
  resources = '/resources',
}

interface Route {
  path: Routes;
  element: ReactNode;
}

const routes: Route[] = [
  {
    path: Routes.home,
    element: <Home />,
  },
  {
    path: Routes.storms,
    element: <Storms />,
  },
  {
    path: Routes.hurricanes,
    element: <Hurricane />,
  },
  {
    path: Routes.resources,
    element: <Resources />,
  },
];

const router = createBrowserRouter(routes);

export { Routes, router as default };
