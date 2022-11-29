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
    const promises = [d3.json('/vis-final/data/Storm_Data_Sums.json')];

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
            <p className="pb-2 text-white">
              As time progresses, Earth is getting warmer and we are seeing more storms every year.
              The graphic on the left shows the change in the number of storm events over the last
              71 years (since 1950) in each US state and how it relates to that year's global
              temperature anomaly (in red). Nineteen of the hottest years have occurred since 2000,
              and as temperatures increase so do the occurrences of severe weather.
            </p>

            <p className="text-white">
              <p>
                <strong>About Temperature Anomalies</strong>
              </p>
              In climate change studies, temperature anomalies are more important than absolute
              temperature. A temperature anomaly is the difference from an average, or baseline,
              temperature. The baseline temperature is typically computed by averaging 30 or more
              years of temperature data. Using anomalies, the departure from an “average,” allows
              more accurate descriptions over larger areas than actual temperatures and provides a
              frame of reference that allows for easier analysis.
            </p>

            <h2 className="pb-2">Are we running out of time?</h2>

            <p className="text-white">
              As temperatures change, what does that mean for the state of severe weather in the US?
              On the next page you can explore how changes in temperature have had effects not only
              on different types of weather events in the US, but also how these storms distinctly impact
              particular regions over time.
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
