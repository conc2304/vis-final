import { ReactNode } from 'react';
import { createHashRouter } from 'react-router-dom';
import Home from '../components/pages/Home';
import Storms from '../components/pages/Storms_OLD';
import Resources from '../components/pages/Resources';

enum Routes {
  home = '/',
  storms = '/storms',
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
    path: Routes.resources,
    element: <Resources />,
  },
];

const router = createHashRouter(routes);

export { Routes, router as default };
