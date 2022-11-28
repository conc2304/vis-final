import * as d3 from 'd3';
import { useRef, useEffect, useState } from 'react';
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
import { COLOR_ACCCENT, COLOR_UI_PRIMARY, STORM_EVENT_CATEGORIES, YEAR_RANGE } from './data/constants';

import './MultiLineChart.scss';

type Props = {
  stormData: StormDataType[];
  margin: Margin;
  title?: string;
  colorRange?: string[];
  id: string;
  selectedDimension: SelectedDimensionsType;
  yearFilter: [number, number] | null;
  regionSelected?: GeoRegionUSType | 'ALL';
  stormTypeSelected?: StormEventCategoryType | 'ALL';
};

const MultiLineChart = ({
  stormData,
  margin,
  yearFilter = null,
  regionSelected = 'ALL',
  stormTypeSelected = 'ALL',
  selectedDimension = null,
  title = '',
  id,
}: Props) => {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null); // Parent of SVG
  const dimensions = useResizeObserver(wrapperRef);
  const [innerDimension, setInnerDimensions] = useState({ w: 0, h: 0 });

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

    // xScale for Years
    const xScale = d3
      .scaleLinear()
      .domain([yearFilter ? yearFilter[0] : YEAR_RANGE.min, yearFilter ? yearFilter[1] : YEAR_RANGE.max])
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

    const yScale = d3.scaleLinear().range([innerHeight, 0]).domain([dimensionMin, dimensionMax]); // height of the individual lines

    const generator = d3
      .line()
      // @ts-ignore
      .x((d: StateDataDimensions) => xScale(d.YEAR))
      // @ts-ignore
      .y((d: StateDataDimensions) => yScale(d[selectedDimension]))
      .curve(d3.curveBasis);

    const isSelectedRegion = (index: number) => stormTypeSelected === STORM_EVENT_CATEGORIES[index];
    // Render the Area Paths for each of the storm events
    svgContent
      .selectAll('.area-path')
      .data(displayData)
      .join('path')
      .attr('class', (d) => `area-path path-for-${d.key.replace(' ', '-')}`)
      // @ts-ignore
      .datum((d: DisplayData) => d.values)
      .attr('fill', 'none')
      .attr('mix-blend-mode', 'multiply')
      .transition()
      .duration(500)
      .attr('stroke', (d, i) => (isSelectedRegion(i) ? COLOR_ACCCENT : COLOR_UI_PRIMARY))
      .attr('stroke-width', (d, i) => (isSelectedRegion(i) ? 2 : 1))
      .attr('stroke-opacity', (d, i) => (isSelectedRegion(i) ? 1 : 0.5))
      // @ts-ignore
      .attr('d', generator);

    svgContent.on('mouseenter', function () {
      console.log(this);
    });

    svgContent.exit().remove();

    // axes
    const xAxis = d3
      .axisBottom(xScale)
      .tickSize(5)
      .tickFormat((d) => d.toString());

    const formatFn = yScale.domain()[1].toString().length > 5 ? d3.format('.2s') : d3.format('.0f');
    const yAxis = d3.axisLeft(yScale).tickFormat(formatFn);

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
  }, [stormData, yearFilter, selectedDimension, regionSelected, stormTypeSelected]);

  /**
   * Get the sum of the counts for each event and aggregate them per year
   * @returns displayData
   */
  function wrangleData(): DisplayData[] {
    let filteredData = [];

    // Filter
    if (yearFilter || regionSelected) {
      stormData.forEach((row) => {
        const [yearMin, yearMax] = !!yearFilter ? yearFilter : [YEAR_RANGE.min, YEAR_RANGE.max];

        // if 'ALL' then the condition is true ef not then check to see if we match

        // const stateConditionIsTrue = doStateFilter && row.STATE === stateFilter;
        const regionConditionIsTrue =
          regionSelected === 'ALL'
            ? true
            : row.STATE.toLowerCase() === regionSelected.toLowerCase();
        const yearConditionIsTrue = yearMin <= row.YEAR && row.YEAR <= yearMax;

        if (yearConditionIsTrue && regionConditionIsTrue) {
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
      const { key: eventCategory } = eventCategoryData;

      if (!STORM_EVENT_CATEGORIES.includes(eventCategory)) return;

      // Group all of this event's data by year
      const eventsByYear = Array.from(
        d3.group(eventCategoryData.value, (d) => d.YEAR),
        ([year, value]) => ({ year, value })
      );

      // console.log('eventsByYear', eventCategory, eventsByYear);

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
          EVENT_NAME: eventCategory,
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
        key: eventCategory,
        values: sortedData,
      });
    }); // end events by category loop

    // console.log('displayData', displayData);
    return displayData;
  }

  return (
    <div
      ref={wrapperRef}
      style={{ width: '100%', height: '100%', position: 'relative' }}
      className={`${id}-wrapper event-by-storm-chart`}
    >
      <p className="title" style={{ position: 'absolute', top: 0, left: margin.left + 20 }}>
        {title} by Storm Type
        <small className="ms-1">
          (
          {regionSelected === 'ALL'
            ? 'USA'
            : (regionSelected as string).replace('(United States)', '').trim()}
        </small>
        )
      </p>

      <svg ref={svgRef}>
        <defs>
          <clipPath id={`${id}`}>
            <rect x="0" y="0" width={innerDimension.w} height="100%" />
          </clipPath>
        </defs>
        <g className="content" clipPath={`url(#${id})`}></g>
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
