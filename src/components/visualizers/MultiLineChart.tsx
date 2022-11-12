import * as d3 from 'd3';
import { useState, useRef, useEffect } from 'react';
import {
  GeoRegionUSType,
  SelectedDimensionsType,
  StateDataDimensions,
  StormDataType,
  StormEventCategoryType,
} from '../../data/types';
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
  let displayData: DisplayData[] = [];

  useEffect(() => {
    // if we dont have data yet dont renter
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
      .attr(
        'transform',
        `translate(${margin.left}, ${margin.top})`
      );

    // xScale for Years
    const xScale = d3
      .scaleLinear()
      .domain([yearFilter ? yearFilter[0] : 1950, yearFilter ? yearFilter[1] : 2022])
      .range([0, innerWidth]);

    console.log(xScale.domain());

    // yscale for density of metric

    let dimensionMax = 0;
    let dimensionMin = Infinity;
    displayData.forEach((eventData) => {
      const eventMax = d3.max(eventData.values, (d) => {
        return d[selectedDimension];
      });
      const eventMin = d3.min(eventData.values, (d) => {
        return d[selectedDimension];
      });

      if (eventMax > dimensionMax) dimensionMax = eventMax;
      if (eventMin < dimensionMin) dimensionMin = eventMin;
    });

    const stormEventCategories = displayData.map((d) => d.key);

    const yScale = d3.scaleLinear().range([innerHeight, 0]).domain([dimensionMin, dimensionMax]); // height of the individual lines

    // Y Axis for categories
    const yCategory = d3
      .scaleBand()
      .domain(stormEventCategories)
      .range([0, innerHeight])
      .paddingInner(1);

    const generator = d3
      .line()
      // @ts-ignore
      .x((d: StateDataDimensions) => xScale(d.YEAR))
      // @ts-ignore
      .y((d: StateDataDimensions) => yScale(d[selectedDimension]))
      .curve(d3.curveBasis);

    console.log('HERE');
    console.log(displayData);
    // Render the Area Paths for each of the storm events

    svgContent
      .selectAll('.area-path')
      .data(displayData)
      .join('path')
      // .attr('transform', (d) => `translate(${margin.left}, ${margin.top})`)
      .attr('class', (d) => `area-path path-for-${d.key}`)
      // @ts-ignore
      .datum((d: DisplayData) => d.values)
      .attr('fill', 'none')
      .attr('stroke', '#FFF')
      .attr('stroke-width', 1)
      .attr('opacity', 0.4)
      // @ts-ignore
      .attr('d', generator);

    svgContent.exit().remove();

    // axes
    const xAxis = d3
      .axisBottom(xScale)
      .tickSize(5)
      .tickFormat((d) => d.toString());

    const yAxis = d3.axisLeft(yScale).tickFormat(d3.format('.1f'));

    svg
      .select('.x-axis')
      .attr('transform', `translate(${margin.left}, ${innerHeight + margin.top})`)
      // @ts-ignore
      .call(xAxis);

    svg
      .select('.y-axis')
      // @ts-ignore
      .call(yAxis)
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // done
  }, [stormData, yearFilter]);

  /**
   * Get the sum of the counts for each event and aggregate them per year
   * @returns displayData
   */
  function wrangleData(): DisplayData[] {
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

    const displayData: DisplayData[] = [];

    // Loop through each Event Category (tornado, hurricane, ...)
    stormDataByEvent.forEach((eventCategoryData) => {
      if (eventCategoryData.key === 'EVENT') return;

      const { key: eventCategory } = eventCategoryData;

      // Group all of this event's data by year
      const eventsByYear = Array.from(
        d3.group(eventCategoryData.value, (d) => d.YEAR),
        ([year, value]) => ({ year, value })
      );

      console.log('eventsByYear', eventCategory, eventsByYear);

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

      console.log('yearData');
      console.log(yearData);
      const sortedData = [...yearData].sort((a, b) => {
        // console.log(b.YEAR, a.YEAR);
        return b.YEAR - a.YEAR;
      });
      console.log('SORTED yearData', eventCategory, sortedData);

      displayData.push({
        key: eventCategory,
        values: yearData,
      });
    }); // end events by category loop

    // console.log('displayData', displayData);
    return displayData;
  }

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%' }} className={`${id}-wrapper`}>
      <svg ref={svgRef}>
        <g className="content"></g>
        <g className="x-axis axis" />
        <g className="y-axis axis" />
      </svg>
    </div>
  );
};

export default MultiLineChart;

type DisplayData = {
  key: StormEventCategoryType;
  values: StateDataDimensions[];
};
