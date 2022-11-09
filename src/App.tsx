import './App.scss';
import LineChart from './components/visualizers/LineChart';
// import TimelineBrush from './components/visualizers/TimelineBrush';
import { Margin } from './components/visualizers/types';
import GlobalTempData from './data/Global_Temp_Data';

function App() {
  const handleOnBrush = () => {
    console.log('BRUSH ME');
  };

  handleOnBrush();

  const timelineDimensions: Margin = {
    top: 10,
    bottom: 30,
    right: 30,
    left: 40,
  };

  console.log(timelineDimensions);

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
            margin={timelineDimensions}
            title="Global Temperature Anomalies"
            onBrush={handleOnBrush}
            lineColor="blue"
            id="global-temp-chart"
          />
        </div>
      </header>
    </div>
  );
}

export default App;
