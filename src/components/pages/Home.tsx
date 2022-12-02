import * as d3 from 'd3';
import React, { useEffect, useState } from 'react';
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
    const promises = [d3.json('/vis-final/data/Storm_Data_Sums.json')];

    Promise.all(promises).then((data) => {
      setStormData(data[0] as StormDataType[]);
    });
  }, []);

  return (
    <Layout>
      <main className="p-4 flex-grow-1 d-flex flex-column">
        <Row className="flex-grow-1 p-2">
          <Col lg={6} xl={7} className="h-100 d-flex flex-column">
            <Row className="flex-grow-1">
              <CircleBarChart stormData={stormData} id="hurricane-chart" />
            </Row>
          </Col>
          <Col
            lg={6}
            xl={5}
            className="d-flex justify-content-center flex-column"
            style={{ paddingBottom: 60 }}
          >
            <h1 className="pb-3 fs-2">Is Earth Fighting Back?</h1>
            <p className="pb-2 text-white">
              As time progresses, Earth is getting warmer and we are seeing more storms every year.
              The graphic on the left shows the change in the number of storm events over the last
              71 years (since 1950) in each US state and how it relates to that year's global
              temperature anomaly (in red). Nineteen of the hottest years have occurred since 2000,
              and as temperatures increase, so do the occurrences of severe weather.
            </p>

            <p>
              <strong className="pb-2 text-white">About Temperature Anomalies</strong>
            </p>
            <p className="text-white">
              In climate change studies, temperature anomalies are more important than absolute
              temperature. A temperature anomaly is the difference from a baseline temperature,
              typically computed by averaging 30 or more years of data. Using anomalies, the
              departure from an “average” allows more accurate descriptions over larger areas and
              provides a frame of reference for easier analysis. Here we see that our
              <span className="text-ui-primary"> baseline</span> is
              <span className="text-ui-primary"> 0 degrees Celsius</span> which is quickly surpassed
              around 1970.
            </p>

            <h2 className="pb-2 fs-3">Are we running out of time?</h2>
            <p className="text-white">
              As temperatures change, what does that mean for the state of severe weather in the US?
              On the next page, you can explore how changes in temperature have had effects not only
              on different types of weather events in the US, but also how these storms distinctly
              impact particular regions over time.
            </p>
          </Col>
        </Row>
      </main>
      <footer
        className="d-flex justify-content-center"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
        <Link
          to={Routes.storms}
          className="btn btn-primary btn-lg border-radius-0 d-block p-3 pb-2 custom-footer home-page"
        >
          <strong style={{ width: '200px' }}>Explore &#9661;</strong>
        </Link>
      </footer>
    </Layout>
  );
};

export default HomePage;
