import { PropsWithChildren } from 'react';
import Stack from 'react-bootstrap/Stack';

import { Link } from 'react-router-dom';

import './layout.scss';

interface Props {
  title: string;
}

const Layout = ({ title, children }: PropsWithChildren<Props>): JSX.Element => {
  return (
    <Stack className="page-container">
      <header>
        <h1>{title}</h1>
      </header>
      <main>{children}</main>
      <footer>
        <Link to="/">Home</Link>
      </footer>
    </Stack>
  );
};

export default Layout;
