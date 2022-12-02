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
  YEAR_RANGE,
} from '../visualizers/data/constants';
import StormsTypesOverTimeSeries from '../visualizers/MultiLineChart';
import TopStatesOverTimeMultiLineChart from '../visualizers/MultiLineChartTop';
import RadarChart from '../visualizers/RadarChart/RadarChart';
import {
  fillGlobalData,
  RadarData,
  wrangleDataByStormEvents,
  wrangleDataByTopXStates,
} from '../visualizers/RadarChart/WrangleRadarData';
import UiDataDisplay from '../visualizers/UiDataDisplay';
import getUSAggregateData from '../visualizers/data/USAggregateData';
import SevereWeatherSvg from '../visualizers/svg/bad-weather.svg';

import './Storms.scss';

const StormsPage = () => {
  // State Handlers
  const [selectedGeoRegion, setSelectedGeoRegion] = useState<GeoRegionUSType | 'ALL'>('ALL');
  const [selectedBrushYears, setSeletedBrushYears] = useState<[number, number] | null>([
    YEAR_RANGE.min,
    YEAR_RANGE.max,
  ]);
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
  const [uiMetrics, setUiMetrics] = useState<{
    deaths: number;
    eventCount: number;
    propertyDamage: number;
  }>(null);

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
    setSeletedBrushYears([start, end]);
  };

  useEffect(() => {
    const promises = [d3.json('/vis-final/data/Storm_Data_Sums.json')];

    Promise.all(promises).then((data) => {
      const filledData = fillGlobalData(data[0] as StormDataType[]);

      setStormData(filledData);
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

    if (selectedGeoRegion !== 'ALL' && radarChartDataTopStates !== undefined) {
      const selectedStateMetrics = radarChartDataTopStates.find((entry) => {
        if (!entry || !entry[0]) return;
        return entry[0].state.toUpperCase() === selectedGeoRegion.toUpperCase();
      });

      const uiMetrics = {
        deaths: selectedStateMetrics.find((entry) => entry.axis === 'Deaths').value,
        eventCount: selectedStateMetrics.find((entry) => entry.axis === 'Total Storms').value,
        propertyDamage: selectedStateMetrics.find((entry) => entry.axis === 'Property Damage')
          .value,
      };

      setUiMetrics(uiMetrics);
    }

    const radarChartDataStateByStorms = wrangleDataByStormEvents({
      data: stormData,
      stateSelected: selectedGeoRegion,
      selectedDimension: selectedDimension,
      yearFilter: selectedBrushYears,
      eventFilter: selectedStormType,
      numberOfStates: 3,
    });

    setRadarDataTopStates(radarChartDataTopStates);
    setRadarDataStormEvents(radarChartDataStateByStorms);
  }, [stormData, selectedGeoRegion, selectedBrushYears, selectedStormType, selectedDimension]);

  useEffect(() => {
    if (!!stormData && selectedGeoRegion === 'ALL') {
      const UsAggregateData = getUSAggregateData(stormData);
      setUiMetrics(UsAggregateData);
    }
  }, [selectedGeoRegion, stormData]);

  return (
    <Layout>
      <header className="w-100 d-flex justify-content-center">
        <Link
          to={Routes.home}
          className="btn btn-primary btn-lg border-radius-0 d-block px-4 custom-header"
        >
          Home &#9651;
        </Link>
      </header>
      <main className="p-2 flex-grow-1 d-flex flex-column">
        <Row className="">
          {/* TITLE BAR */}
          <div className="d-inline-block" style={{ width: '' }}>
            <Row className="d-flex justify-content-center">
              <div className="d-flex align-items-center justify-content-center">
                <img className="storm-icon" src={SevereWeatherSvg} />
                <h1 className="p-2 pb-4 fs-2">Severe Weather Events in the USA</h1>
                <img className="storm-icon flip-x" src={SevereWeatherSvg} />
              </div>
            </Row>

            {/* FORM ROW */}
            <Row className=" flex-grow-1">
              <FormGroup className="form-group">
                <div className=" d-flex justify-content-around">
                  <div className="w-25 p-2">
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
                  </div>
                  <div className="w-50">
                    <div style={{ width: '80%', margin: '0 auto' }}>
                      <UiDataDisplay
                        timeRangeSelected={selectedBrushYears}
                        locationSelected={selectedGeoRegion}
                        metrics={uiMetrics}
                      />
                    </div>
                  </div>
                  <div className="w-25 p-2">
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
                  </div>
                </div>
              </FormGroup>
            </Row>
          </div>
        </Row>

        {/* MAIN CONTENT */}
        <div className="d-flex flex-grow-1" style={{}}>
          <div className="d-inline-block h-100" style={{ width: '25%' }}>
            <div className="h-50">
              <RadarChart
                id="radar-chart-top-states"
                data={radarDataTopStates}
                areValuesNormalized={false}
                lineType="curved"
                labelFactor={1.29}
                margin={{ top: 90, right: 0, bottom: 80, left: 0 }}
                selectedState={selectedGeoRegion}
                title="Top 3 Most Impacted States (Metrics)"
              />
            </div>
            <div className="h-50">
              <RadarChart
                id="radar-chart-state-storms"
                data={radarDataStormEvents}
                areValuesNormalized={false}
                lineType="curved"
                labelFactor={1.18}
                wrapWidth={120}
                margin={{ top: 90, right: 0, bottom: 100, left: 0 }}
                selectedState={selectedGeoRegion}
                title="Top 3 Most Impacted States (Storms)"
              />
            </div>
          </div>
          <div className="d-inline-block h-100" style={{ width: '50%' }}>
            <div className="d-inline-block w-100" style={{ height: '60%', marginBottom: '40px' }}>
              <HeatMap
                yearFilter={selectedBrushYears}
                stormData={stormData}
                regionSelected={selectedGeoRegion}
                margin={{
                  top: 0,
                  bottom: 0,
                  right: 0,
                  left: -5,
                }}
                id="storm-data-heatmap"
                selectedDimension={selectedDimension}
                eventFilter={selectedStormType}
                colorsRange={COLOR_RANGE}
                handleOnStateSelect={handleOnStateSelect}
              />
            </div>
            <div style={{ height: '20%' }}>
              <LineChart
                data={GlobalTempData}
                margin={{
                  top: 10,
                  bottom: 30,
                  right: 10,
                  left: 30,
                }}
                onBrush={handleOnBrush}
                lineColor="blue"
                id="global-temp-chart"
                title="Global Temperature Anomaly"
              />
            </div>
          </div>
          <div className="d-inline-block" style={{ width: '25%' }}>
            <div className="h-50">
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
                stateSelected={selectedGeoRegion}
              />
            </div>
            <div className="h-50" style={{paddingBottom: '0'}}>
              <StormsTypesOverTimeSeries
                id="storm-data-events-by-selection"
                yearFilter={selectedBrushYears}
                stormData={stormData}
                margin={{
                  top: 10,
                  bottom: 20,
                  right: 30,
                  left: 60,
                }}
                title={selectedDimensionTitle}
                selectedDimension={selectedDimension}
                regionSelected={selectedGeoRegion}
                stormTypeSelected={selectedStormType}
              />
            </div>
          </div>
        </div>
      </main>
      <footer
        className="d-flex justify-content-center"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
        <Link
          to={Routes.resources}
          className="btn btn-primary btn-lg border-radius-0 d-block p-2 custom-footer"
        >
          More Resources &#9661;
        </Link>
      </footer>
    </Layout>
  );
};

export default StormsPage;
