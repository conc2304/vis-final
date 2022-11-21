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
      <main className="p-4 flex-grow-1 d-flex flex-column">
        <Row className="flex-grow-1 p-2">
          <Col md={7} className="h-100 d-flex flex-column">
            <Row className="flex-grow-1">
              <CircleBarChart stormData={stormData} id="hurricane-chart" />
            </Row>
          </Col>
          <Col md={5}>
            <h1 className="pb-3">Is Earth Fighting Back?</h1>
            <h2 className="pb-2 text-white">Are we running out of time?</h2>
            <p className="text-white">
              As time progresses, Earth is getting warmer and we are seeing more storms every year.
              The graphic on the left shows the change in storm events over the last 71 years (since
              1950) in each US state, and the color of the bars represents the global temperature
              during that time.
            </p>
            <Link to={Routes.storms} className="btn btn-outline-light btn-lg">
              Explore &#9655;
            </Link>
          </Col>
        </Row>
      </main>
    </Layout>
  );
};

export default HomePage;
