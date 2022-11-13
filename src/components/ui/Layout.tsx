import { PropsWithChildren } from 'react';
import Stack from 'react-bootstrap/Stack';

interface Props {
  title: string;
  footer?: JSX.Element;
}

const Layout = ({ title, footer, children }: PropsWithChildren<Props>): JSX.Element => {
  return (
    <Stack className="d-flex h-100 flex-column">
      <header>
        <h1>{title}</h1>
      </header>
      <main className="flex-grow-1 d-flex flex-column">
        <div className="h-100 container-fluid d-flex flex-column">{children}</div>
      </main>
      {!footer && <footer>{footer}</footer>}
    </Stack>
  );
};

export default Layout;
