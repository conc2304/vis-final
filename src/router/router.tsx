import { ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Home from '../components/pages/Home';
import Storms from '../components/pages/Storms';

enum Routes {
  home = '/',
  storms = '/storms',
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
];

const router = createBrowserRouter(routes);

export { Routes, router as default };
