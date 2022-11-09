import * as d3 from 'd3';
// import { StormData } from '../../data/types';
import React, { useState, useRef, useEffect } from 'react';
import { geoEqualEarth, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import { Feature, FeatureCollection, Geometry } from 'geojson';
import { path, svg } from 'd3';
import {
  GeoRegionUS,
  NumericStormMetricType,
  StormData,
  StormEventCategoryType,
} from '../../data/types';
import useResizeObserver from './useResizeObserver';
import { Margin } from './types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
// const uuid = require('react-uuid');

type Props = {
  stormData: StormData[];
  margin: Margin;
  id: string;
  yearFilter: [number, number] | null;
  colorsRange?: string[];
  selectedMetric: NumericStormMetricType;
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
  yearFilter,
  margin,
  selectedMetric,
  colorsRange = defaultColorRange,
}: Props) => {
  // console.log(stormData);
  // console.log('yearFilter', yearFilter);
  const svgRef = useRef(null);
  const wrapperRef = useRef(null); // Parent of SVG
  const dimensions = useResizeObserver(wrapperRef);

  const [selectedState, setSelectedState] = useState<GeoRegionUS>(null);

  const [geographies, setGeographies] = useState<[] | Array<Feature<Geometry | null>>>([]);
  // const [svgDimensions, setSvgDimension] = useState<[number, number]>([0, 0]);

  const getFillColor = (
    d: Feature<
      Geometry,
      {
        [name: string]: any;
      }
    >
  ) => {
    const { name: stateName } = d.properties;
    const stateInfo = console.log(d.properties);
  };

  const wrangleData = () => {
    // first, filter according to selectedTimeRange, init empty array
    let filteredData: StormData[] = [];

    // if there is a region selected
    if (yearFilter) {
      console.log('FILTER');
      stormData.forEach((row) => {
        const [yearMin, yearMax] = yearFilter;
        if (yearMin <= row.YEAR && row.YEAR <= yearMax) {
          filteredData.push(row);
        }
      });
    } else {
      console.log('NO FILTER');

      filteredData = stormData;
    }

    // prep data by state
    const stormDataByState = Array.from(
      d3.group(filteredData, (d) => d.STATE),
      ([key, value]) => ({ key, value })
    );

    const stormDatabyEvent = Array.from(
      d3.group(filteredData, (d) => d.EVENT),
      ([key, value]) => ({ key, value })
    );

    const stateData = [];
    // merge

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
      state.value.forEach((entry: StormData) => {
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
  };

  // load geo data on init
  useEffect(() => {
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
    console.log('stormData: ', !!stormData);
    console.log();
    if (!!stormData) wrangleData();

    // @ts-ignore
    // const colorScale = d3.scaleLinear().range(colorsRange);
    // const legendScale = d3.scaleLinear().range([0, vis.legendWidth]);

    // use resized dimensions
    // but fall back to getBoundingClientRect, if no dimensions yet.
    const { width: svgWidth, height: svgHeight } =
      dimensions || wrapperRef.current.getBoundingClientRect();
    svg.attr('width', svgWidth).attr('height', svgHeight);
    const svgContent = svg
      .select('.content')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const projection = d3
      .geoAlbersUsa()
      .translate([svgWidth / 2 + 20, svgHeight / 2])
      .scale(750);

    const pathGenerator = geoPath().projection(projection);

    svgContent
      .selectAll('.state')
      .data(geographies)
      .join('path')
      .classed('state', true)
      .attr('stroke-width', '0.5px')
      .attr('stroke', 'white')
      .attr('data', (d) => {
        // console.log('test');
        // console.log(d);
        return 'test';
      })
      .transition()
      .duration(500)
      .attr('d', pathGenerator);
  }, [yearFilter, selectedMetric, geographies, stormData]);
  // console.lo;
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
