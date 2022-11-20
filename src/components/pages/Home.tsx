import * as d3 from 'd3';
import { useEffect, useState } from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { Link } from 'react-router-dom';

import { Routes } from '../../router/router';
import Layout from '../ui/Layout';
import { StormDataType } from '../visualizers/data/types';
import CircleBarChart from '../visualizers/CircleBarChart';

const HomePage = () => {
  const [stormData, setStormData] = useState<StormDataType[]>(null);

  useEffect(() => {
    const promises = [d3.json('/data/Storm_Data_Sums.json')];

    Promise.all(promises).then((data) => {
      setStormData(data[0] as StormDataType[]);
    });
  }, []);

  return (
    <Layout>
      <header className="p-4">
        <h1>Is Earth Fighting Back?</h1>
      </header>
      <main className="p-4 flex-grow-1 d-flex flex-column">
        <Row className="flex-grow-1 p-2">
          <Col md={8} className="h-100 d-flex flex-column">
            <Row className="flex-grow-1">
              <CircleBarChart stormData={stormData} id="hurricane-chart" />
            </Row>
          </Col>
          <Col md={4}>
            <h2 className="pb-2">Are we running out of time?</h2>
            <p>
              As time progresses, Earth is getting warmer and we are seeing more storms every year.
              The graphic on the left shows the change in storm events over the last 71 years (since
              1950) in each US state, and the color of the bars represents the global temperature
              during that time.
            </p>
            <Link to={Routes.storms} className="btn btn-primary btn-lg">
              Explore more &gt;
            </Link>
          </Col>
        </Row>
      </main>
    </Layout>
  );
};

export default HomePage;
