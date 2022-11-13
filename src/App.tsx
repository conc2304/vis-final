import { RouterProvider } from 'react-router-dom';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.scss';

import router from './router/router';

function App() {
  return <RouterProvider router={router} />;
}

export default App;
