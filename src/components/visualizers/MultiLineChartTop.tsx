import * as d3 from 'd3';
import { useRef, useEffect, useState, MutableRefObject } from 'react';
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
import { COLOR_ACCCENT, COLOR_SERIES_TOP_3, STORM_EVENT_REGIONS, YEAR_RANGE } from './data/constants';

import './MultiLineChartTop.scss';
import { getFormat } from './RadarChart/WrangleRadarData';

type Props = {
  stormData: StormDataType[];
  margin: Margin;
  title?: string;
  colorRange?: string[];
  id: string;
  selectedDimension: SelectedDimensionsType;
  yearFilter: [number, number] | null;
  numberOfTopStates?: number;
  colorsRange?: string[];
  eventFilter?: StormEventCategoryType | 'ALL';
  stateSelected?: GeoRegionUSType | 'ALL';
};

const TopStatesOverTimeMultiLineChart = ({
  stormData,
  margin,
  yearFilter = null,
  numberOfTopStates = 3,
  selectedDimension = null,
  stateSelected = 'ALL',
  id,
  title,
  eventFilter = 'ALL',
}: Props) => {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null); // Parent of SVG
  const dimensions = useResizeObserver(wrapperRef);

  const [topStateAsNameList, setTopStatesAsNameList] = useState<GeoRegionUSType[]>([]);
  const [innerDimension, setInnerDimensions] = useState({ w: 0, h: 0 });

  const colorScale: MutableRefObject<d3.ScaleOrdinal<string, unknown, never>> = useRef();

  let displayData: DisplayData[] = [];

  useEffect(() => {
    // if we dont have data yet dont renter
    if (!!stormData) {
      displayData = wrangleData();
    } else {
      return;
    }

    const svg = d3.select(svgRef.current);

    const { width: svgWidth, height: svgHeight } =
      dimensions || wrapperRef.current.getBoundingClientRect();
    const innerWidth = svgWidth - margin.left - margin.right;
    const innerHeight = svgHeight - margin.top - margin.bottom;
    setInnerDimensions({ w: innerWidth, h: innerHeight });

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
      .domain([
        yearFilter ? yearFilter[0] : YEAR_RANGE.min,
        yearFilter ? yearFilter[1] : YEAR_RANGE.max,
      ])
      .range([0, innerWidth]);

    const colorSeries = COLOR_SERIES_TOP_3;
    colorScale.current = d3.scaleOrdinal().range(colorSeries);

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
      .area()
      // @ts-ignore
      .x((d: StateDataDimensions) => xScale(d.YEAR))
      // @ts-ignore
      .y0(innerHeight)
      // @ts-ignore
      .y1((d: StateDataDimensions) => yScale(d[selectedDimension]))
      .curve(d3.curveBasis);

    const isSelectedState = (state: GeoRegionUSType) => {
      return stateSelected.toLowerCase() === state.toLowerCase();
    };

    // color domain should not include the selected state since it is always accent orange
    colorScale.current.domain(
      displayData
        .filter((entry) => {
          // filter out the selectected state if its not one of the top 3
          if (displayData.length > numberOfTopStates && isSelectedState(entry.key)) {
            return false;
          }
          return true;
        })
        .map((entry) => entry.key)
    );
    // Render the Area Paths for each of the storm events

    // plot the path
    const lines = svgContent.selectAll('path').data(displayData, (d: DisplayData) => d.key);
    lines
      .enter()
      .append('path')
      .attr('class', (d) => `area-path`)
      // @ts-ignore
      .merge(lines)
      .attr('fill-opacity', 0.05)
      .style('mix-blend-mode', 'multiply')
      .style('filter', 'url(#glow-line)')
      .attr('stroke-linejoin', 'round')
      .attr('stroke-opacity', 1)
      .transition()
      .duration(500)
      .attr('stroke', (d) =>
        isSelectedState(d.key) ? COLOR_ACCCENT : (colorScale.current(d.key) as string)
      )
      .attr('fill', (d) =>
        isSelectedState(d.key) ? COLOR_ACCCENT : (colorScale.current(d.key) as string)
      )
      .attr('stroke-width', (d) => (isSelectedState(d.key) ? 2 : 1))
      // @ts-ignore
      .attr('d', (d) => generator(d.values));
    lines.exit().remove();

    // axes
    const xAxis = d3
      .axisBottom(xScale)
      .tickSize(5)
      .tickFormat((d) => d.toString());

    const yAxis = d3.axisLeft(yScale).tickFormat(getFormat({ value: yScale.domain()[1] }));

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

    svg.select('.y-axis text').attr('text-anchor', 'end');

    // done
  }, [stormData, yearFilter, eventFilter, selectedDimension, stateSelected]);

  /**
   * Get the sum of the counts for each event and aggregate them per year
   * @returns displayData
   */
  const wrangleData = (): DisplayData[] => {
    // first, filter according to selectedTimeRange, init empty array
    let filteredData: StormDataType[] = [];

    // if there is a region selected
    if (yearFilter || eventFilter) {
      stormData.forEach((row) => {
        const [yearMin, yearMax] = !!yearFilter ? yearFilter : [YEAR_RANGE.min, YEAR_RANGE.max];

        // if 'ALL' then the condition is true ef not then check to see if we match

        const eventConditionIsTrue = eventFilter === 'ALL' ? true : row.EVENT === eventFilter;
        const yearConditionIsTrue = yearMin <= row.YEAR && row.YEAR <= yearMax;

        if (yearConditionIsTrue && eventConditionIsTrue) {
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

    // filtered for time and for top X States by cumulative storm dimension (event count, property damage ...)
    const topStatesTotalValues = getTopNthStatesByDimension(stormDataByState);

    const topStatesNameArr = topStatesTotalValues.map((stateData) => {
      if (!stateData) return;
      return stateData.STATE;
    });
    setTopStatesAsNameList(topStatesNameArr.slice(0, numberOfTopStates));
    // get the yearly values for each state in our time period
    const topStatesData = getStormDataPerStatePerYear(stormDataByState, topStatesNameArr);

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
          STATE: stateName,
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
      const filledData = fillMissingYears(yearData, minYear, maxYear, stateName);

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

      if (!STORM_EVENT_REGIONS.includes(stateName)) return;
      if ((stateName as string) === 'STATE') return;

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
    // add in the selected state for comparision
    // stateSelected
    const isStateSelectedAccounted = topStates.some(
      (entry) => entry.STATE.toLowerCase() === stateSelected.toLowerCase()
    );

    if (!isStateSelectedAccounted && stateSelected !== 'ALL') {
      // if we dont have them accounted for find them and add them;
      const selectedStateData = stateData.find(
        (entry) => entry.STATE.toLowerCase() === stateSelected.toLowerCase()
      );
      topStates.push(selectedStateData);
    }

    return topStates;
  }

  const isSelectedStateIncluded =
    stateSelected !== 'ALL' &&
    topStateAsNameList.includes(stateSelected.toUpperCase() as GeoRegionUSType);
  const stateNamesMatch = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

  return (
    <>
      <div ref={wrapperRef} className={`${id}-wrapper top-states-chart`}
      style={{ width: '100%', height: '100%', position: 'relative', zIndex: 10 }}
      
      >
        <div className="title" style={{ position: 'absolute', top: 8, left: margin.left + 20 }}>
          Top {numberOfTopStates} Most Impacted States:
          <br /> {eventFilter === 'ALL' ? 'All Storms' : `${eventFilter}s`} : {title}
        </div>
        <div
          className="state-list-container"
          style={{ position: 'absolute', top: margin.top, left: margin.left + 20 }}
        >
          <div>
            {topStateAsNameList.map((stateName, i) => (
              <small
                className={`d-block ${stateNamesMatch(stateName, stateSelected) ? 'active' : ''}`}
                key={stateName}
                style={{
                  fontWeight: 'bold',
                  color: stateNamesMatch(stateName, stateSelected)
                    ? COLOR_ACCCENT
                    : (colorScale.current(stateName) as string),
                }}
              >
                {i + 1}. {stateName}
              </small>
            ))}
            {stateSelected !== 'ALL' && !isSelectedStateIncluded ? (
              <small className="d-block active">{stateSelected.toUpperCase()}</small>
            ) : (
              ''
            )}
          </div>
        </div>
        <svg ref={svgRef} >
          <defs>
            <clipPath id={`${id}`}>
              <rect x="0" y="0" width={innerDimension.w} height="100%" />
            </clipPath>
            <filter id="glow-line">
              <feGaussianBlur stdDeviation="2.7" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g className="content" clipPath={`url(#${id})`}></g>
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
