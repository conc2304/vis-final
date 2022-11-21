import { useEffect, useState } from 'react';

import * as d3 from 'd3';
import { Col, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import {
  FormControl,
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material';

import { Routes } from '../../router/router';
import Layout from '../ui/Layout';
import HeatMap from '../visualizers/HeatMap';
import LineChart from '../visualizers/LineChartBrushed';
import GlobalTempData from '../visualizers/data/Global_Temp_Data';
import {
  GeoRegionUSType,
  SelectedDimensionsType,
  StormDataType,
  StormEventCategoryType,
} from '../visualizers/data/types';
import {
  COLOR_RANGE,
  STORM_EVENT_CATEGORIES,
  STORM_UI_SELECT_VALUES,
} from '../visualizers/data/constants';
import StormsTypesOverTimeSeries from '../visualizers/MultiLineChart';
import TopStatesOverTimeMultiLineChart from '../visualizers/MultiLineChartTop';
import RadarChart from '../visualizers/RadarChart/RadarChart';
import {
  RadarData,
  wrangleDataByStormEvents,
  wrangleDataByTopXStates,
} from '../visualizers/RadarChart/WrangleRadarData';

import './Storms.scss';

const StormsPage = () => {
  // State Handlers
  const [selectedGeoRegion, setSelectedGeoRegion] = useState<GeoRegionUSType | 'ALL'>('ALL');
  const [selectedBrushYears, setSeletedBrushYears] = useState<[number, number] | null>(null);
  const [selectedStormType, setSelectedStormType] = useState<StormEventCategoryType | 'ALL'>('ALL');
  const [selectedDimensionTitle, setSelectedDimensionTitle] = useState(
    STORM_UI_SELECT_VALUES[0].label
  );
  const [selectedDimension, setSelectedDimension] = useState<SelectedDimensionsType>(
    STORM_UI_SELECT_VALUES[0].value
  );
  const [stormData, setStormData] = useState<StormDataType[]>(null);
  const [radarDataTopStates, setRadarDataTopStates] = useState<RadarData>(null);
  const [radarDataStormEvents, setRadarDataStormEvents] = useState<RadarData>(null);

  // Event Handlers
  const onDataDimensionChange = (event: SelectChangeEvent) => {
    const newDimension = event.target.value as SelectedDimensionsType;
    const dimensionLabel = STORM_UI_SELECT_VALUES.find((elem) => elem.value === newDimension).label;
    setSelectedDimension(event.target.value as SelectedDimensionsType);
    setSelectedDimensionTitle(dimensionLabel as any);
  };

  const handleOnStateSelect = (regionSeclected: GeoRegionUSType | 'ALL') => {
    setSelectedGeoRegion(regionSeclected);
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

  useEffect(() => {
    // update radar chart data
    if (!stormData) return;

    const radarChartDataTopStates = wrangleDataByTopXStates({
      data: stormData,
      numberOfStates: 3,
      stateSelected: selectedGeoRegion,
      selectedDimension: selectedDimension,
      yearFilter: selectedBrushYears,
      eventFilter: selectedStormType,
    });

    const radarChartDataStateByStorms = wrangleDataByStormEvents({
      data: stormData,
      stateSelected: selectedGeoRegion,
      selectedDimension: selectedDimension,
      yearFilter: selectedBrushYears,
      eventFilter: selectedStormType,
      numberOfStates: 3,
    });

    console.log(radarChartDataStateByStorms);

    setRadarDataTopStates(radarChartDataTopStates);
    setRadarDataStormEvents(radarChartDataStateByStorms);
  }, [stormData, selectedGeoRegion, selectedBrushYears, selectedStormType, selectedDimension]);

  return (
    <Layout>
      <header className="w-100 d-flex justify-content-center">
        <Link
          to={Routes.home}
          className="btn btn-primary btn-lg border-radius-0 d-block px-4 pt-1 pb-2 custom-header"
        >
          Home &#9651;
        </Link>
      </header>
      <main className="p-3 flex-grow-1 d-flex flex-column">
        <Row className="flex-grow-1">
          <Col xs={12} md={8} className="flex-grow-1 d-flex flex-column">
            <h1 className="p-2 pb-4 fs-2">Severe Weather Events in the USA</h1>
            <FormGroup className="form-group">
              <Row className="ui-form-container">
                <Col>
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
                </Col>
                <Col>
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
                </Col>
              </Row>
            </FormGroup>
            <Row className="flex-grow-1" style={{ flexBasis: '25%', border: '2xp solid blue' }}>
              <Col xs={12} md={6}>
                <RadarChart
                  id="radar-chart-top-states"
                  data={radarDataTopStates}
                  areValuesNormalized={false}
                  lineType="curved"
                  labelFactor={1.4}
                  margin={{ top: 60, right: 0, bottom: 80, left: 0 }}
                />
              </Col>
              <Col xs={12} md={6}>
                <RadarChart
                  id="radar-chart-state-storms"
                  data={radarDataStormEvents}
                  areValuesNormalized={true}
                  lineType="curved"
                  labelFactor={1.2}
                  margin={{ top: 60, right: 0, bottom: 80, left: 0 }}
                />
              </Col>
            </Row>
            <Row className="flex-grow-1">
              <HeatMap
                yearFilter={selectedBrushYears}
                stormData={stormData}
                regionSelected={selectedGeoRegion}
                margin={{
                  top: 0,
                  bottom: 0,
                  right: 0,
                  left: 0,
                }}
                id="storm-data-heatmap"
                selectedDimension={selectedDimension}
                eventFilter={selectedStormType}
                colorsRange={COLOR_RANGE}
                handleOnStateSelect={handleOnStateSelect}
              />
            </Row>
          </Col>
          <Col xs={12} md={4} className="d-flex flex-column justify-content-between">
            <Row>
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
            </Row>
            <Row className="data-display-wrapper">
              <TopStatesOverTimeMultiLineChart
                id="storm-data-top-states"
                yearFilter={selectedBrushYears}
                stormData={stormData}
                margin={{
                  top: 40,
                  bottom: 30,
                  right: 30,
                  left: 60,
                }}
                selectedDimension={selectedDimension}
                title={selectedDimensionTitle}
                eventFilter={selectedStormType}
                colorsRange={COLOR_RANGE}
                regionSelected={selectedGeoRegion}
              />
            </Row>
            <Row className="data-display-wrapper">
              <StormsTypesOverTimeSeries
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
                regionSelected={selectedGeoRegion}
                stormTypeSelected={selectedStormType}
              />
            </Row>
          </Col>
        </Row>
      </main>
      <footer className="d-flex justify-content-center">
        <Link
          to={Routes.resources}
          className="btn btn-primary btn-lg border-radius-0 d-block p-4 pb-3 custom-footer"
        >
          More Resources &#9661;
        </Link>
      </footer>
    </Layout>
  );
};

export default StormsPage;
