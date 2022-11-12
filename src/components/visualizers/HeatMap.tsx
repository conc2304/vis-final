import * as d3 from 'd3';
import { useState, useRef, useEffect } from 'react';
import { geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import { Feature,  Geometry } from 'geojson';
import {
  GeoJsonFeatureType,
  GeoRegionUSType,
  SelectedDimensionsType,
  StateDataDimensions,
  StormDataType,
  StormEventCategoryType,
} from '../../data/types';
import useResizeObserver from './useResizeObserver';
import { Margin } from './types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
// const uuid = require('react-uuid');
type Props = {
  stormData: StormDataType[];
  margin: Margin;
  id: string;
  yearFilter: [number, number] | null;
  eventFilter: StormEventCategoryType | null;
  colorsRange?: string[];
  selectedDimension: SelectedDimensionsType;
};

const defaultColorRange = [
  /* "#2c7bb6",  "#00a6ca", */ '#a3bacc',
  '#00ccbc',
  '#90eb9d',
  '#ffff8c',
  '#f9d057',
  '#f29e2e',
  '#e76818',
  '#d7191c',
];

const HeatMap = ({
  id,
  stormData,
  margin,
  selectedDimension,
  colorsRange = defaultColorRange,
  yearFilter = null,
  eventFilter = null,
}: Props) => {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null); // Parent of SVG
  const dimensions = useResizeObserver(wrapperRef);

  // const [selectedState, setSelectedState] = useState<GeoRegionUSType>(null); // TODO

  const [geographies, setGeographies] = useState<[] | Array<Feature<Geometry | null>>>([]);
  // const [stateData, setStateData] = useState<StateData[]>([]);

  const wrangleData = (): StateDataDimensions[] => {
    // first, filter according to selectedTimeRange, init empty array
    let filteredData: StormDataType[] = [];

    // if there is a region selected
    if (yearFilter || eventFilter) {
      const doYearFilter = yearFilter !== null;
      const doEventFilter = eventFilter !== null;

      stormData.forEach((row) => {
        const [yearMin, yearMax] = yearFilter;

        const eventConditionIsTrue = doEventFilter && row.EVENT === eventFilter;
        const yearConditionIsTrue = doYearFilter && yearMin <= row.YEAR && row.YEAR <= yearMax;

        if (yearConditionIsTrue || eventConditionIsTrue) {
          filteredData.push(row);
        }
      });
    } else {
      filteredData = stormData;
    }

    // prep data by state
    const stormDataByState = Array.from(
      d3.group(filteredData, (d) => d.STATE),
      ([key, value]) => ({ key, value })
    );

    // const stormDatabyEvent = Array.from(
    //   d3.group(filteredData, (d) => d.EVENT),
    //   ([key, value]) => ({ key, value })
    // );

    // merge
    const stateData: StateDataDimensions[] = [];

    stormDataByState.forEach((state) => {
      const { key: stateName } = state;

      let DAMAGE_PROPERTY_EVENT_SUM = 0;
      let DEATHS_DIRECT_COUNT = 0;
      let DEATHS_INDIRECT_COUNT = 0;
      let DEATHS_TOTAL_COUNT = 0;
      let INJURIES_DIRECT_COUNT = 0;
      let TOTAL_EVENTS = 0;
      const COUNTS_BY_EVENT: Record<StormEventCategoryType, number> = {} as Record<
        StormEventCategoryType,
        number
      >;

      // sum up the totals per state
      state.value.forEach((entry: StormDataType) => {
        const eventType = entry.EVENT || 'misc';

        DAMAGE_PROPERTY_EVENT_SUM += entry.DAMAGE_PROPERTY_EVENT_SUM;
        DEATHS_DIRECT_COUNT += entry.DEATHS_DIRECT_COUNT;
        DEATHS_INDIRECT_COUNT += entry.DEATHS_INDIRECT_COUNT;
        DEATHS_TOTAL_COUNT += entry.DEATHS_DIRECT_COUNT + entry.DEATHS_INDIRECT_COUNT;
        INJURIES_DIRECT_COUNT += entry.INJURIES_DIRECT_COUNT;
        TOTAL_EVENTS += entry.EVENT_COUNT;

        if (eventType in COUNTS_BY_EVENT) {
          COUNTS_BY_EVENT[eventType] += entry.EVENT_COUNT;
        } else {
          COUNTS_BY_EVENT[eventType] = entry.EVENT_COUNT;
        }
      });

      stateData.push({
        STATE: stateName,
        DAMAGE_PROPERTY_EVENT_SUM,
        DEATHS_DIRECT_COUNT,
        DEATHS_INDIRECT_COUNT,
        DEATHS_TOTAL_COUNT,
        INJURIES_DIRECT_COUNT,
        TOTAL_EVENTS,
        COUNTS_BY_EVENT,
      });

    }); // end foreach

    console.log('stateData');
    console.log(stateData);
    return stateData;
  };

  // load geo data on init
  useEffect(() => {
    // ONINIT Callback
    
    // ?? do we want locally or over cdn ??
    // d3.json('/data/states-10m.json').then((geoData: any) => {
    d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json').then((geoData) => {
      const usaGeoFeatures: Array<Feature<Geometry | null>> = feature(
        // @ts-ignore
        geoData,
        // @ts-ignore
        geoData.objects.states
      )['features'];
      setGeographies(usaGeoFeatures);
    });
  }, []);

  useEffect(() => {
    console.log('DRAW');
    const svg = d3.select(svgRef.current);

    let stateDataDisplay: StateDataDimensions[];
    if (!!stormData) {
      stateDataDisplay = wrangleData();
    } else {
      return;
    }
    console.log(stateDataDisplay);

    // use resized dimensions
    // but fall back to getBoundingClientRect, if no dimensions yet.
    const { width: svgWidth, height: svgHeight } =
      dimensions || wrapperRef.current.getBoundingClientRect();

    svg.attr('width', svgWidth).attr('height', svgHeight);

    const [min, max] = d3.extent(stateDataDisplay, (d) => d[selectedDimension]);
    const stepSize = (max - min) / colorsRange.length;
    const metricsDomain = d3.range(min, max, stepSize);

    const colorScale = d3
      .scaleLinear()
      .domain(metricsDomain)
      // @ts-ignore
      .range(colorsRange);

    const svgContent = svg
      .select('.content')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const projection = d3
      .geoAlbersUsa()
      .translate([svgWidth / 2 + 20, svgHeight / 2])
      .scale(600);

    const pathGenerator = geoPath().projection(projection);

    svgContent
      .selectAll('.state')
      .data(geographies)
      .join('path')
      .classed('state', true)
      .attr('stroke-width', '0.5px')
      .attr('stroke', 'white')
      .attr('data', (feature) => {
        return getFillColor(feature, stateDataDisplay);
      })
      .transition()
      .duration(500)
      .attr('fill', (feature) => getFillColor(feature, stateDataDisplay))
      .attr('d', pathGenerator);

    // Internal Functions
    function getFillColor(d: GeoJsonFeatureType, stateData: StateDataDimensions[]) {
      const { name } = d.properties;
      const stateName = name as GeoRegionUSType;
      const stateInfo = getStateInfoByStateName(stateName, stateData);

      if (stateInfo && stateInfo[selectedDimension])
        return colorScale(stateInfo[selectedDimension]);
      return 'grey';
    }

    function getStateInfoByStateName(
      stateName: GeoRegionUSType,
      statedData: StateDataDimensions[]
    ) {
      for (const localData of statedData) {
        if (localData.STATE.toLowerCase() === stateName.toLowerCase()) return localData;
      }
      return null;
    }
  }, [yearFilter, selectedDimension, stormData]);

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%' }} className={`${id}-wrapper`}>
      <svg ref={svgRef}>
        <g className="content"></g>
      </svg>
    </div>
  );
};

export default HeatMap;

// ['ATLANTIC NORTH',
//  'ATLANTIC SOUTH',
//  'E PACIFIC',
//  'GULF OF ALASKA',
//  'GULF OF MEXICO',
//  'HAWAII WATERS',
//  'LAKE ERIE',
//  'LAKE HURON',
//  'LAKE MICHIGAN',
//  'LAKE ONTARIO',
//  'LAKE ST CLAIR',
//  'LAKE SUPERIOR',
//  'ST LAWRENCE R', ]

