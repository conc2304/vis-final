import { useEffect, useState } from 'react';

import * as d3 from 'd3';
import { Col, Row } from 'react-bootstrap';

import HeatMap from '../visualizers/HeatMap';
import LineChart from '../visualizers/LineChartwBrush';
import GlobalTempData from '../../data/Global_Temp_Data';
import { StormDataType } from '../../data/types';
import Layout from '../ui/Layout';

const StormsPage = () => {
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
    <Layout title="Severe Weather Events in the USA">
      <Row className="flex-grow-1">
        <Col xs={12} md={8}>
          <HeatMap
            yearFilter={selectedBrushYears}
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
        <Col xs={12} md={4}>
          {/* @TODO - focus chart */}
          {/* @TODO - legend */}
          {/* @TODO - chart filter */}
        </Col>
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
    </Layout>
  );
};

export default StormsPage;
