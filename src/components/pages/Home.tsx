import * as d3 from 'd3';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { useEffect, useState } from 'react';

import { Link } from 'react-router-dom';
import Layout from '../ui/Layout';
import HeatMap from '../visualizers/HeatMap';
import { StormDataType } from '../../data/types';

const HomePage = () => {
  const [stormData, setStormData] = useState<StormDataType[]>(null);

  useEffect(() => {
    const promises = [d3.json('/data/Storm_Data_Sums.json')];

    Promise.all(promises).then((data) => {
      setStormData(data[0] as StormDataType[]);
    });
  }, []);

  return (
    <Layout title="Is Earth Fighting Back?">
      <Row className="flex-grow-1">
        <Col md={8}>
          <HeatMap
            yearFilter={null}
            stormData={stormData}
            margin={{
              top: 10,
              bottom: 30,
              right: 30,
              left: 0,
            }}
            id="storm-data-heatmap"
            selectedDimension="TOTAL_EVENTS"
          />
        </Col>
        <Col md={4}>
          {/* @TODO - introduction copy */}
          <h2>Header Text</h2>
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
          <Link to="/storms" className="btn btn-primary">
            Explore
          </Link>
        </Col>
      </Row>
    </Layout>
  );
};

export default HomePage;
