import { useEffect, useState } from 'react';
import * as d3 from 'd3';
import {
  FormControl,
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import './App.scss';
import HeatMap from './components/visualizers/HeatMap';
import LineChart from './components/visualizers/LineChartBrushed';
import GlobalTempData from './components/visualizers/data/Global_Temp_Data';
import {
  SelectedDimensionsType,
  StormDataType,
  StormEventCategoryType,
} from './components/visualizers/data/types';
import {
  COLOR_RANGE,
  STORM_EVENT_CATEGORIES,
  STORM_UI_SELECT_VALUES,
} from './components/visualizers/data/constants';
import MultiLineChart from './components/visualizers/MultiLineChart';
import TopStatesOverTimeMultiLineChart from './components/visualizers/MultiLineChartTop';

function App() {
  const [selectedBrushYears, setSeletedBrushYears] = useState<[number, number] | null>(null);
  const [selectedStormType, setSelectedStormType] = useState<StormEventCategoryType | null>(null);
  const [selectedDimensionTitle, setSelectedDimensionTitle] = useState(
    STORM_UI_SELECT_VALUES[0].label
  );
  const [selectedDimension, setSelectedDimension] = useState<SelectedDimensionsType>(
    STORM_UI_SELECT_VALUES[0].value
  );
  const [stormData, setStormData] = useState<StormDataType[]>(null);

  const onDataDimensionChange = (event: SelectChangeEvent) => {
    const newDimension = event.target.value as SelectedDimensionsType;
    const dimensionLabel = STORM_UI_SELECT_VALUES.find((elem) => elem.value === newDimension).label;
    setSelectedDimension(event.target.value as SelectedDimensionsType);
    setSelectedDimensionTitle(dimensionLabel as any);
  };

  const onEventTypeChanged = (event: SelectChangeEvent) => {
    const stormType = event.target.value as StormEventCategoryType;
    setSelectedStormType(stormType);
  };

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
        <div style={{ width: '80%', height: '15vh', display: 'flex' }}>
          <div className="ui-form-container">
            <FormGroup className="form-group">
              <FormControl className="ui-select">
                <InputLabel id="label-for-dimension-select">Data to view...</InputLabel>
                <Select
                  labelId="label-for-dimension-select"
                  placeholder="Data to view"
                  label="Data to view..."
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
              <FormControl className="ui-select">
                <InputLabel id="label-for-event-select">Severe Weather Type</InputLabel>
                <Select
                  labelId="label-for-event-select"
                  placeholder="Dat"
                  label="Severe Weather Type"
                  value={selectedStormType}
                  onChange={onEventTypeChanged}
                >
                  <MenuItem value={'ALL'} key={0}>
                    All Severe Weather
                  </MenuItem>
                  {STORM_EVENT_CATEGORIES.map((stormType) => {
                    return (
                      <MenuItem value={stormType} key={stormType}>
                        {stormType}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </FormGroup>
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
              eventFilter={selectedStormType}
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
            <div
              style={{
                width: '100%',
                height: '49%',
                display: 'inline-block',
              }}
            >
              <TopStatesOverTimeMultiLineChart
                id="storm-data-top-states"
                yearFilter={selectedBrushYears}
                stormData={stormData}
                margin={{
                  top: 10,
                  bottom: 30,
                  right: 30,
                  left: 60,
                }}
                selectedDimension={selectedDimension}
                title={selectedDimensionTitle}
                eventFilter={selectedStormType}
                colorsRange={COLOR_RANGE}
              />
            </div>
            <div
              style={{
                width: '100%',
                height: '49%',
                display: 'inline-block',
              }}
            >
              <MultiLineChart
                id="storm-data-events-by-selection"
                yearFilter={selectedBrushYears}
                stormData={stormData}
                margin={{
                  top: 10,
                  bottom: 30,
                  right: 30,
                  left: 60,
                }}
                title={selectedDimensionTitle}
                selectedDimension={selectedDimension}
              />
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
