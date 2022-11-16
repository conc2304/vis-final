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

import "./Storms.scss";

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

  // Event Handlers
  const onDataDimensionChange = (event: SelectChangeEvent) => {
    const newDimension = event.target.value as SelectedDimensionsType;
    const dimensionLabel = STORM_UI_SELECT_VALUES.find((elem) => elem.value === newDimension).label;
    setSelectedDimension(event.target.value as SelectedDimensionsType);
    setSelectedDimensionTitle(dimensionLabel as any);
  };

  const handleOnStateHover = (regionSeclected: GeoRegionUSType | 'ALL') => {
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

  return (
    <Layout>
      <header>
        <Link to={Routes.home} className="btn btn-primary btn-lg border-radius-0 d-block p-1">
          Home &#9651;
        </Link>
        <h1 className="p-2">Severe Weather Events in the USA</h1>
      </header>
      <main className="p-4 flex-grow-1 d-flex flex-column">
        <Row className="flex-grow-1">
          <Col xs={12} md={8} className="flex-grow-1 d-flex flex-column">
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
            <Row className="flex-grow-1">
              <HeatMap
                yearFilter={selectedBrushYears}
                stormData={stormData}
                regionSelected={selectedGeoRegion}
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
                handleOnStateSelect={handleOnStateHover}
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
                  top: 10,
                  bottom: 60,
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
      <footer>
        <Link to={Routes.hurricanes} className="btn btn-primary btn-lg border-radius-0 d-block p-4">
          Explore Hurricanes &#9661;
        </Link>
      </footer>
    </Layout>
  );
};

export default StormsPage;
