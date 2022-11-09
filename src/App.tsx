import { useState } from 'react';
import './App.scss';
import LineChart from './components/visualizers/LineChartwBrush';
// import TimelineBrush from './components/visualizers/TimelineBrush';
import GlobalTempData from './data/Global_Temp_Data';

function App() {
  const [selectedBrushYears, setSeletedBrushYears] = useState([null, null]);
  const handleOnBrush = ([start, end]) => {
    setSeletedBrushYears([start, end]);
    console.log(selectedBrushYears);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>APP TITLE</h1>
        <div style={{ width: '80%', border: '2px solid white', height: '15vw' }}>
          {/* <TimelineBrush
            data={GlobalTempData}
            margin={timelineDimensions}
            title="Global Temperature Anomalies"
            onBrush={handleOnBrush}
            lineColor="blue"
          /> */}
          {/* 
          <Brush
            data={GlobalTempData}
            margin={timelineDimensions}
            onBrushUpdateData={handleOnBrush}
            /> */}

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
