import { PropsWithChildren } from 'react';
import Stack from 'react-bootstrap/Stack';
import { Link } from 'react-router-dom';

interface Props {
  title: string;
}

const Layout = ({ title, children }: PropsWithChildren<Props>): JSX.Element => {
  return (
    <Stack className="d-flex h-100 flex-column">
      <header>
        <h1>{title}</h1>
      </header>
      <main className="flex-grow-1 d-flex flex-column">
        <div className="h-100 container-fluid d-flex flex-column">{children}</div>
      </main>
      <footer>
        <Link to="/">Home</Link>
      </footer>
    </Stack>
  );
};

export default Layout;
