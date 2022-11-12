import { useEffect, useState } from 'react';
import * as d3 from 'd3';
import './App.scss';
import HeatMap from './components/visualizers/HeatMap';
import LineChart from './components/visualizers/LineChartBrushed';
import GlobalTempData from './components/visualizers/data/Global_Temp_Data';
import { StormDataType, StormEventCategoryType } from './components/visualizers/data/types';
import { COLOR_RANGE } from './components/visualizers/data/constants';
import MultiLineChart from './components/visualizers/MultiLineChart';

function App() {
  const [selectedBrushYears, setSeletedBrushYears] = useState<[number, number] | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<StormEventCategoryType | null>(null);
  const [stormData, setStormData] = useState<StormDataType[]>(null);
  const handleOnBrush = ([start, end]) => {
    console.log('start, end')
    console.log(start, end)
    setSeletedBrushYears(end > start ? [start, end] : [end, start]);
  };

  useEffect(() => {
    const promises = [d3.json('/data/Storm_Data_Sums.json')];

    Promise.all(promises).then((data) => {
      setStormData(data[0] as StormDataType[]);
    });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>APP TITLE</h1>
        <div style={{ width: '80%', border: '2px solid white', height: '500px' }}>
          <div
            style={{
              width: '49%',
              border: '2px solid white',
              height: '500px',
              display: 'inline-block',
            }}
          >
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
              eventFilter={selectedEventType}
              colorsRange={COLOR_RANGE}
            />
          </div>

          <div
            style={{
              width: '49%',
              border: '2px solid white',
              height: '500px',
              display: 'inline-block',
            }}
          >
            <MultiLineChart
              yearFilter={selectedBrushYears}
              stormData={stormData}
              margin={{
                top: 10,
                bottom: 30,
                right: 30,
                left: 60,
              }}
              id="storm-data-multi-line"
              selectedDimension="TOTAL_EVENTS"
              // eventFilter={selectedEventType}
              // colorsRange={COLOR_RANGE}
            />
          </div>
        </div>

        <div style={{ width: '80%', border: '2px solid white', height: '8vw' }}>
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
        </div>
      </header>
    </div>
  );
}

export default App;
