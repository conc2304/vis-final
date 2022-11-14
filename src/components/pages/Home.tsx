import * as d3 from 'd3';
import { useEffect, useState } from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { Link } from 'react-router-dom';

import { Routes } from '../../router/router';
import Layout from '../ui/Layout';
import HeatMap from '../visualizers/HeatMap';
import { StormDataType } from '../visualizers/data/types';
import LineChart from '../visualizers/LineChartBrushed';
import GlobalTempData from '../visualizers/data/Global_Temp_Data';
import { COLOR_RANGE, STORM_UI_SELECT_VALUES } from '../visualizers/data/constants';

const HomePage = () => {
  const [selectedBrushYears, setSeletedBrushYears] = useState<[number, number] | null>(null);
  const [stormData, setStormData] = useState<StormDataType[]>(null);
  const handleOnBrush = ([start, end]) => {
    setSeletedBrushYears(end > start ? [start, end] : [end, start]);
  };

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
              <HeatMap
                yearFilter={selectedBrushYears}
                stormData={stormData}
                regionSelected={'ALL'}
                margin={{
                  top: 10,
                  bottom: 30,
                  right: 30,
                  left: 0,
                }}
                id="storm-data-heatmap"
                selectedDimension={STORM_UI_SELECT_VALUES[0].value}
                eventFilter={'ALL'}
                colorsRange={COLOR_RANGE}
                hideHex
              />
            </Row>
            <Row>
              <LineChart
                data={GlobalTempData}
                margin={{
                  top: 10,
                  bottom: 30,
                  right: 30,
                  left: 40,
                }}
                onBrush={handleOnBrush}
                lineColor="blue"
                id="global-temp-chart"
                title="Global Temperature Anomaly"
              />
            </Row>
          </Col>
          <Col md={4}>
            {/* @TODO - introduction copy */}
            <h2 className="pb-2">Header Text</h2>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer at imperdiet arcu.
              Proin ut lacus mauris. Fusce et nisi iaculis, tincidunt mauris non, mollis nunc. Donec
              euismod nulla id posuere laoreet. Proin dapibus elit mattis, placerat turpis ac,
              ullamcorper neque. Mauris a erat egestas, vehicula nulla facilisis, bibendum sapien.
              Vivamus sollicitudin aliquam purus id pharetra.
            </p>
            <Link to={Routes.storms} className="btn btn-primary btn-lg">
              Explore &gt;
            </Link>
          </Col>
        </Row>
      </main>
    </Layout>
  );
};

export default HomePage;
