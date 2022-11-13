import { PropsWithChildren } from 'react';
import Stack from 'react-bootstrap/Stack';

const Layout = ({ children }: PropsWithChildren): JSX.Element => {
  return (
    <Stack className="d-flex h-100 flex-column">
      <main className="flex-grow-1 d-flex flex-column">
        <div className="h-100 container-fluid d-flex flex-column p-0">{children}</div>
      </main>
    </Stack>
  );
};

export default Layout;
