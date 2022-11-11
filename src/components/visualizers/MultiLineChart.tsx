import * as d3 from 'd3';
import { useState, useRef, useEffect } from 'react';
import { dragDisable } from 'd3';
import {
  GeoRegionUSType,
  GlobalTempDataType,
  SelectedDimensionsType,
  StateDataDimensions,
  StormDataType,
  StormEventCategoryType,
} from '../../data/types';
import { STORM_EVENT_CATEGORIES } from '../../data/constants';
import useResizeObserver from './useResizeObserver';
import { Margin } from './types';

type Props = {
  // data: StormDataColumns;
  stormData: StormDataType[];
  margin: Margin;
  title?: string;
  colorRange?: string[];
  id: string;
  selectedDimension: SelectedDimensionsType;
  yearFilter: [number, number] | null;
  stateFilter?: GeoRegionUSType | null;
};

const MultiLineChart = ({
  stormData,
  margin,
  yearFilter = null,
  stateFilter = null,
  selectedDimension = null,
  id,
}: Props) => {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null); // Parent of SVG
  const dimensions = useResizeObserver(wrapperRef);

  useEffect(() => {
    // if we dont have data yet dont renter
    let displayData: displayData[] = [];
    if (!!stormData) {
      displayData = wrangleData();
    } else {
      return;
    }

    console.log(stormData);

    const svg = d3.select(svgRef.current);
    const { width: svgWidth, height: svgHeight } =
      dimensions || wrapperRef.current.getBoundingClientRect();
    const innerWidth = svgWidth - margin.left - margin.right;
    const innerHeight = svgHeight - margin.top - margin.bottom;

    svg.attr('width', svgWidth).attr('height', svgHeight);

    const svgContent = svg
      .select('.content')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // xScale for Years
    const xScale = d3
      .scaleLinear()
      .domain([yearFilter ? yearFilter[0] : 1950, yearFilter ? yearFilter[1] : 2022])
      .range([0, innerWidth]);

    // yscale for density of metric
    const yScale = d3
      .scaleLinear()
      .domain([0, 0.4]) // height of the individual lines
      .range([innerHeight, 0]);

    // Y Axis for categories
    const stormEventCategories = displayData.map((d) => d.key);
    const yCategory = d3
      .scaleBand()
      .domain(stormEventCategories)
      .range([0, innerHeight])
      .paddingInner(1);

    // console.log('tick', xScale.ticks(40))
    
  }, [stormData]);

  /**
   * Get the sum of the counts for each event and aggregate them per year
   * @returns displayData
   */
  function wrangleData(): displayData[] {
    let filteredData = [];

    // Filter
    if (yearFilter || stateFilter) {
      const doYearFilter = yearFilter !== null;
      const doStateFilter = stateFilter !== null;

      console.log('FILTER');
      stormData.forEach((row) => {
        const [yearMin, yearMax] = yearFilter;

        // const stateConditionIsTrue = doStateFilter && row.STATE === stateFilter;
        const yearConditionIsTrue = doYearFilter && yearMin <= row.YEAR && row.YEAR <= yearMax;

        if (yearConditionIsTrue) {
          filteredData.push(row);
        }
      });
    } else {
      filteredData = stormData;
    }

    // Group the Data by Storm Event Type (tornado, Hurricane ...)
    const stormDataByEvent = Array.from(
      d3.group(filteredData, (d) => d.EVENT),
      ([key, value]) => ({ key, value })
    );

    const displayData: displayData[] = [];

    // Loop through each Event Category (tornado, hurricane, ...)
    stormDataByEvent.forEach((eventCategoryData) => {
      if (eventCategoryData.key === 'EVENT') return;

      const { key: eventCategory } = eventCategoryData;

      // Group all of this event's data by year
      const eventsByYear = Array.from(
        d3.group(eventCategoryData.value, (d) => d.YEAR),
        ([year, value]) => ({ year, value })
      );

      const yearData: StateDataDimensions[] = [];

      // loop through each years data and aggregate the metrics/dimensions
      eventsByYear.forEach((entry) => {
        let DAMAGE_PROPERTY_EVENT_SUM = 0;
        let DEATHS_DIRECT_COUNT = 0;
        let DEATHS_INDIRECT_COUNT = 0;
        let DEATHS_TOTAL_COUNT = 0;
        let INJURIES_DIRECT_COUNT = 0;
        let TOTAL_EVENTS = 0;

        // entry.value is an array of all of the states that had a storm of X type and their count
        // now sum up the value of these counts from all of the state's entries
        entry.value.forEach((entry: StormDataType) => {
          DAMAGE_PROPERTY_EVENT_SUM += entry.DAMAGE_PROPERTY_EVENT_SUM;
          DEATHS_DIRECT_COUNT += entry.DEATHS_DIRECT_COUNT;
          DEATHS_INDIRECT_COUNT += entry.DEATHS_INDIRECT_COUNT;
          DEATHS_TOTAL_COUNT += entry.DEATHS_DIRECT_COUNT + entry.DEATHS_INDIRECT_COUNT;
          INJURIES_DIRECT_COUNT += entry.INJURIES_DIRECT_COUNT;
          TOTAL_EVENTS += entry.EVENT_COUNT;
        });

        yearData.push({
          YEAR: entry.year,
          DAMAGE_PROPERTY_EVENT_SUM,
          DEATHS_DIRECT_COUNT,
          DEATHS_INDIRECT_COUNT,
          DEATHS_TOTAL_COUNT,
          INJURIES_DIRECT_COUNT,
          TOTAL_EVENTS,
        });
      }); // end event by year Loop

      yearData.sort((a, b) => (b.YEAR = a.YEAR));
      console.log('yearData', eventCategory, yearData);

      displayData.push({
        key: eventCategory,
        values: yearData,
      });
    }); // end events by category loop

    console.log('displayData', displayData);
    return displayData;
  }

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%' }} className={`${id}-wrapper`}>
      <svg ref={svgRef}>
        <g className="content">
          <path className="line-path"></path>
          <g className="x-axis axis" />
          <g className="y-axis axis" />
        </g>
      </svg>
    </div>
  );
};

export default MultiLineChart;

type displayData = {
  key: StormEventCategoryType;
  values: StateDataDimensions[];
};
