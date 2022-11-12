import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import Home from './components/pages/Home';
import Storms from './components/pages/Storms';

import './App.scss';

function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <Home />,
    },
    {
      path: '/storms',
      element: <Storms />,
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
