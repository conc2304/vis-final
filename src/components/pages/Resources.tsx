import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';

import Layout from '../ui/Layout';

const ResourcesPage = () => {
  return (
    <Layout>
      <main className="p-4 flex-grow-1 d-flex flex-column">
        <Row className="flex-grow-1">
          <Col md={6}>{/* @TODO - add navigation */}</Col>
          <Col md={6}>
            <h2>More Resources</h2>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer at imperdiet arcu.
              Proin ut lacus mauris. Fusce et nisi iaculis, tincidunt mauris non, mollis nunc. Donec
              euismod nulla id posuere laoreet. Proin dapibus elit mattis, placerat turpis ac,
              ullamcorper neque. Mauris a erat egestas, vehicula nulla facilisis, bibendum sapien.
              Vivamus sollicitudin aliquam purus id pharetra. Integer euismod neque quis leo
              consectetur, rutrum commodo erat dapibus. Suspendisse maximus est venenatis, euismod
              nibh bibendum, luctus mauris. Curabitur eu elementum nibh. Fusce porta vestibulum
              dapibus. Vestibulum sed congue turpis. Nullam aliquam leo odio, nec congue lacus
              placerat eget. Phasellus ut tincidunt libero.
            </p>
          </Col>
        </Row>
      </main>
    </Layout>
  );
};

export default ResourcesPage;
