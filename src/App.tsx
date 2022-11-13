import { useEffect, useState } from 'react';
import * as d3 from 'd3';
import './App.scss';
import HeatMap from './components/visualizers/HeatMap';
import LineChart from './components/visualizers/LineChartBrushed';
import GlobalTempData from './components/visualizers/data/Global_Temp_Data';
import {
  GeoRegionUSType,
  NumericStormMetricType,
  SelectedDimensionsType,
  StormDataType,
  StormEventCategoryType,
} from './components/visualizers/data/types';
import { COLOR_RANGE, STORM_UI_SELECT_VALUES } from './components/visualizers/data/constants';
// import MultiLineChart from './components/visualizers/MultiLineChart';
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import TopStatesOverTimeMultiLineChart from './components/visualizers/MultiLineChartTop';

function App() {
  const [selectedBrushYears, setSeletedBrushYears] = useState<[number, number] | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<StormEventCategoryType | null>(null);
  const [selectedDimension, setSelectedDimension] =
    useState<SelectedDimensionsType>('TOTAL_EVENTS');
  const [stormData, setStormData] = useState<StormDataType[]>(null);

  const onDataDimensionChange = (event: SelectChangeEvent) => {
    setSelectedDimension(event.target.value as SelectedDimensionsType);
  };

  const handleOnBrush = ([start, end]) => {
    console.log('start, end');
    console.log(start, end);
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
        <div style={{ width: '80%', height: '15vh' }}>
          <div
            style={{
              width: '49%',
              height: '100%',
              display: 'inline-block',
            }}
          >
            <FormControl fullWidth>
              <InputLabel id="label-for-dimension-select">Data to view...</InputLabel>
              <Select
                labelId="label-for-dimension-select"
                placeholder="Data to view"
                label="Data to view..."
                color="primary"
                value={selectedDimension}
                onChange={onDataDimensionChange}
              >
                {STORM_UI_SELECT_VALUES.map((uiValue) => {
                  return (
                    <MenuItem value={uiValue.value} key={uiValue.value}>
                      {uiValue.label}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </div>
          <div
            style={{
              width: '49%',
              height: '100%',
              display: 'inline-block',
            }}
          >
            <LineChart
              data={GlobalTempData}
              margin={{
                top: 10,
                bottom: 30,
                right: 30,
                left: 60,
              }}
              onBrush={handleOnBrush}
              lineColor="blue"
              id="global-temp-chart"
              title="Global Temperature Anomaly"
            />
          </div>
        </div>
        <div style={{ width: '80%', height: '60vh' }}>
          <div
            style={{
              width: '49%',
              height: '100%',
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
              selectedDimension={selectedDimension}
              eventFilter={selectedEventType}
              colorsRange={COLOR_RANGE}
            />
          </div>

          <div
            style={{
              width: '49%',
              height: '100%',
              display: 'inline-block',
            }}
          >
            <TopStatesOverTimeMultiLineChart
              yearFilter={selectedBrushYears}
              stormData={stormData}
              margin={{
                top: 10,
                bottom: 30,
                right: 30,
                left: 60,
              }}
              id="storm-data-multi-line"
              selectedDimension={selectedDimension}
              title={STORM_UI_SELECT_VALUES.find((elem) => elem.value === selectedDimension).label}
              // eventFilter={selectedEventType}
              // colorsRange={COLOR_RANGE}
            />
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
