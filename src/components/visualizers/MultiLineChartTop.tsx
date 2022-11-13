import * as d3 from 'd3';
import { useState, useRef, useEffect } from 'react';
import {
  GeoRegionUSType,
  SelectedDimensionsType,
  StateDataDimensions,
  StormDataType,
  StormEventCategoryType,
} from './data/types';
import useResizeObserver from './useResizeObserver';
import { Margin } from './types';
import { fillMissingYears } from './helpers';

type Props = {
  // data: StormDataColumns;
  stormData: StormDataType[];
  margin: Margin;
  title?: string;
  colorRange?: string[];
  id: string;
  selectedDimension: SelectedDimensionsType;
  yearFilter: [number, number] | null;
  numberOfTopStates?: number;
};

const TopStatesOverTimeMultiLineChart = ({
  stormData,
  margin,
  yearFilter = null,
  numberOfTopStates = 5,
  selectedDimension = null,
  id,
  title,
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

    console.log(displayData);

    const svg = d3.select(svgRef.current);

    const { width: svgWidth, height: svgHeight } =
      dimensions || wrapperRef.current.getBoundingClientRect();
    const innerWidth = svgWidth - margin.left - margin.right;
    const innerHeight = svgHeight - margin.top - margin.bottom;

    svg.attr('width', svgWidth).attr('height', svgHeight);
    const svgContent = svg
      .select('.content')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Set the title
    svg
      .select('.title')
      .attr('transform', `translate(${2 * margin.left}, ${30})`)
      .attr('font-size', '14')
      .attr('fill', 'white');

    // xScale for Years
    const xScale = d3
      .scaleLinear()
      .domain([yearFilter ? yearFilter[0] : 1950, yearFilter ? yearFilter[1] : 2022])
      .range([0, innerWidth]);

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

    // yscale for density of metric
    const yScale = d3.scaleLinear().range([innerHeight, 0]).domain([dimensionMin, dimensionMax]); // height of the individual lines

    const generator = d3
      .line()
      // @ts-ignore
      .x((d: StateDataDimensions) => xScale(d.YEAR))
      // @ts-ignore
      .y((d: StateDataDimensions) => yScale(d[selectedDimension]))
      .curve(d3.curveBasis);

    // Render the Area Paths for each of the storm events
    svgContent
      .selectAll('.area-path')
      .data(displayData)
      .join('path')
      .attr('data', (d) => {
        console.log(d);
        return 'd';
      })
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
  const wrangleData = (): DisplayData[] => {
    // first, filter according to selectedTimeRange, init empty array
    let filteredData: StormDataType[] = [];

    // if there is a region selected
    if (yearFilter) {
      const doYearFilter = yearFilter !== null;
      // const doEventFilter = eventFilter !== null;

      stormData.forEach((row) => {
        const [yearMin, yearMax] = yearFilter;

        // const eventConditionIsTrue = doEventFilter && row.EVENT === eventFilter;
        const yearConditionIsTrue = doYearFilter && yearMin <= row.YEAR && row.YEAR <= yearMax;

        if (yearConditionIsTrue) {
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

    console.log(stormDataByState);
    // filtered for time and for top X States by cumulative storm dimension (event count, property damage ...)
    const topStatesTotalValues = getTopNthStatesByDimension(stormDataByState);
    const topStatesNameArr = topStatesTotalValues.map((stateData) => stateData.STATE);

    // get the yearly values for each state in our time period

    const topStatesData = getStormDataPerStatePerYear(stormDataByState, topStatesNameArr);
    console.log('topStatesData');
    console.log(topStatesData);

    return topStatesData;
  };

  function getStormDataPerStatePerYear(
    stormDataGroupedByState: { key: GeoRegionUSType; value: StormDataType[] }[],
    statesFilter: GeoRegionUSType[]
  ) {
    const displayData: DisplayData[] = [];

    // loop through each state and skip over the ones that we dont need and then group the data by year
    stormDataGroupedByState;
    stormDataGroupedByState.forEach((entry) => {
      const { key: stateName } = entry;

      // only add the top states that were passed in
      if (!statesFilter.includes(stateName)) return;

      const eventsByYear = Array.from(
        d3.group(entry.value, (d) => d.YEAR),
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

      // fill in missing values with 0's
      const [minYear, maxYear] = d3.extent(yearData, (d) => d.YEAR);
      const filledData = fillMissingYears(yearData, minYear, maxYear);

      const sortedData = [...filledData].sort((a, b) => b.YEAR - a.YEAR);

      displayData.push({
        key: stateName,
        values: sortedData,
      });
    });

    return displayData;
  }

  /**
   *
   * @param stormDataByState
   * @returns An Array with the aggregate sums of dimensions for the top Nth states
   */
  function getTopNthStatesByDimension(
    stormDataByState: {
      key: GeoRegionUSType;
      value: StormDataType[];
    }[]
  ): StateDataDimensions[] {
    const stateData: StateDataDimensions[] = [];

    stormDataByState.forEach((state) => {
      const { key: stateName } = state;

      if (stateName === 'STATE') return;

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

    stateData.sort((a, b) => b[selectedDimension] - a[selectedDimension]);
    const topStates = stateData.slice(0, numberOfTopStates); // top states cumulative values
    return topStates;
  }

  return (
    <>
      <div ref={wrapperRef} style={{ width: '100%', height: '100%', position: "relative" }} className={`${id}-wrapper`}>
        <p style={{ position: 'absolute', top: 0, left: margin.left + 20, fontSize: "16px" }}>
          {title}
          <br /> Most Impacted States
        </p>
        <svg ref={svgRef}>
          <g className="content"></g>
          <g className="x-axis axis" />
          <g className="y-axis axis" />
        </svg>
      </div>
    </>
  );
};

export default TopStatesOverTimeMultiLineChart;

type DisplayData = {
  key: GeoRegionUSType;
  values: StateDataDimensions[];
};
