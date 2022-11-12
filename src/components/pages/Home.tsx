import { Button, Col } from 'react-bootstrap';
import Layout from '../ui/Layout/Layout';

const HomePage = () => {
  return (
    <Layout title="Is Earth Fighting Back?">
      <Col xs={12} md={8}>
        <div>{/* @TODO - earth graphic */}</div>
      </Col>
      <Col xs={12} md={4}>
        {/* @TODO - introduction copy */}
        <h2>Header Text</h2>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer at imperdiet arcu. Proin
          ut lacus mauris. Fusce et nisi iaculis, tincidunt mauris non, mollis nunc. Donec euismod
          nulla id posuere laoreet. Proin dapibus elit mattis, placerat turpis ac, ullamcorper
          neque. Mauris a erat egestas, vehicula nulla facilisis, bibendum sapien. Vivamus
          sollicitudin aliquam purus id pharetra. Integer euismod neque quis leo consectetur, rutrum
          commodo erat dapibus. Suspendisse maximus est venenatis, euismod nibh bibendum, luctus
          mauris. Curabitur eu elementum nibh. Fusce porta vestibulum dapibus. Vestibulum sed congue
          turpis. Nullam aliquam leo odio, nec congue lacus placerat eget. Phasellus ut tincidunt
          libero.
        </p>
        <Button variant="primary">Explore</Button>
      </Col>
    </Layout>
  );
};

export default HomePage;
