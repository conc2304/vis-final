import * as d3 from 'd3';
// import { StormData } from '../../data/types';
import React, { useState, useRef, useEffect } from 'react';
import { geoEqualEarth, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import { Feature, FeatureCollection, Geometry } from 'geojson';
import { path, svg } from 'd3';
import { GeoRegionUS, NumericStormMetricType, StormData } from '../../data/types';
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
    if (!stormData) return;
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

    const stateData = [];
    // merge

    stormDataByState.forEach((state) => {

      const damagePropertySum = 0;
      const deathsDirectSum = 0;
      const deathsIndirectSum = 0;
      const eventCountsbyType = {};
      // DEATHS_DIRECT_COUNT: 0;
      // DEATHS_INDIRECT_COUNT: 0;
      // EVENT: 'Draught';
      // EVENT_COUNT: 2;
      // INJURIES_DIRECT_COUNT: 0;
      // STATE: 'ALABAMA';
      // YEAR: 1998;
      const totalStateRows = state.value.length;
      const { key: stateName } = state;
      console.log(state);
    });

    // console.log('stormDataByState');
    // console.log(stormDataByState);
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

    wrangleData();

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
  }, [yearFilter, selectedMetric, geographies]);
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
