import { useEffect, useState } from 'react';
import * as d3 from 'd3';
import './App.scss';
import HeatMap from './components/visualizers/HeatMap';
import LineChart from './components/visualizers/LineChartwBrush';
import GlobalTempData from './data/Global_Temp_Data';
import {  StormDataType } from './data/types';

function App() {
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
    <div className="App">
      <header className="App-header">
        <h1>APP TITLE</h1>
        <div style={{ width: '80%', border: '2px solid white', height: '500px' }}>
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
        </div>

        <div style={{ width: '80%', border: '2px solid white', height: '15vw' }}>
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
