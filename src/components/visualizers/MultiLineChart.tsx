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
import {
  COLOR_ACCCENT,
  COLOR_UI_PRIMARY,
  STORM_EVENT_CATEGORIES,
  YEAR_RANGE,
} from './data/constants';

import './MultiLineChart.scss';
import { getFormat } from './RadarChart/WrangleRadarData';

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

  const [hoveredStormEvent, setHoveredStormEvent] = useState<StormEventCategoryType>(null);
  const [filteredStormEvent, setFilteredStormEvent] = useState<StormEventCategoryType>(null);
  const [innerDimension, setInnerDimensions] = useState({ w: 0, h: 0 });

  let displayData: DisplayData[] = [];

  // force the chart to always use these schemes
  const stormColorMap = {
    'Extreme Temperature': '#f27fff', // magenta
    Flood: '#2ef8ff', // cyan
    Hurricane: '#43f1b7', // green
    Landslide: '#fccc6c', // orange
    Thunderstorm: '#59adf6', // blue
    Tornado: '#9d94ff', // purple
    Wildfire: '#ff6961', // red
    'Winter Storm': '#fff', // white
  };

  const isSelectedStorm = (stormName: StormEventCategoryType) =>
    stormTypeSelected.toLowerCase() === stormName.toLocaleLowerCase();

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
      .domain([
        yearFilter ? yearFilter[0] : YEAR_RANGE.min,
        yearFilter ? yearFilter[1] : YEAR_RANGE.max,
      ])
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
      .area()
      // @ts-ignore
      .x((d: StateDataDimensions) => xScale(d.YEAR))
      // @ts-ignore
      .y0(innerHeight)
      // @ts-ignore
      .y1((d: StateDataDimensions) => yScale(d[selectedDimension]))
      .curve(d3.curveCardinal);

    // Render the Area Paths for each of the storm events
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
      .attr('stroke', (d) => (isSelectedStorm(d.key) ? COLOR_ACCCENT : stormColorMap[d.key]))
      .attr('fill', (d) => (isSelectedStorm(d.key) ? COLOR_ACCCENT : stormColorMap[d.key]))
      .attr('fill-opacity', (d) => {
        if (!isSelectedStorm(d.key) && hoveredStormEvent === d.key) return 0.3;
        return isSelectedStorm(d.key) ? 0.1 : 0.05;
      })
      .attr('stroke-width', (d) => (isSelectedStorm(d.key) ? 2 : 1))
      // @ts-ignore
      .attr('d', (d) => generator(d.values));

    lines.on('mouseenter', lineEnter);
    lines.on('click', (e, d) => {
      const value = !filteredStormEvent ? d.key : null;
      setFilteredStormEvent(value);
    });

    lines.on('mouseleave', lineLeave);

    lines.exit().remove();
    function lineEnter(event: MouseEvent, d: DisplayData) {
      setHoveredStormEvent(d.key);
    }

    function lineLeave(event: MouseEvent, d: DisplayData) {
      setHoveredStormEvent(null);
    }

    svgContent.exit().remove();

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

    // if we are filtered on a state then lets add a crosshair and values, otherwise its too noisey
    const bisect = (mouseX) => {
      // using mouseX get the value of Y on the line
      const year = Math.round(xScale.invert(mouseX - margin.left));
      const valueAtYear = displayData[0].values.find((entry) => entry.YEAR === year)[
        selectedDimension
      ];

      if (!valueAtYear) {
        svg.select('circle.focus-point').style('opacity', 0);
        svg.selectAll('line.cross-hairs').style('opacity', 0);
        return;
      }

      const targetX = mouseX;
      const targetY = yScale(valueAtYear) + margin.top;
      const circleR = 6;
      const linePadding = 3;
      // draw
      svg
        .select('circle.focus-point')
        .attr('r', circleR)
        .attr('cx', targetX)
        .attr('cy', targetY)
        .style('opacity', 1);

      svg
        .select('line.ch-y')
        .attr('x1', margin.left)
        .attr('y1', targetY)
        .attr('x2', targetX - circleR - linePadding)
        .attr('y2', targetY)
        .attr('stroke', COLOR_UI_PRIMARY)
        .attr('stroke-width', 1)
        .style('opacity', 0.5);

      svg
        .select('line.ch-x')
        .attr('x1', targetX)
        .attr('y1', innerHeight + margin.top)
        .attr('x2', targetX)
        .attr('y2', targetY - circleR - linePadding + margin.top + 1)
        .attr('stroke', COLOR_UI_PRIMARY)
        .attr('stroke-width', 1)
        .style('opacity', 0.5);
    };

    const renderCrossHairs = (e: MouseEvent, d: DisplayData) => {
      if (!filteredStormEvent) {
        return;
      } else {
        const [mX] = d3.pointer(e, this);
        bisect(mX);
      }
    };

    if (!filteredStormEvent) {
      svg.select('circle.focus-point').style('opacity', 0);
      svg.selectAll('line.cross-hairs').style('opacity', 0);
    }

    svg.on('mousemove', renderCrossHairs);
    svgContent.on('mouseleave', () => {
      console.log('LEAVING');
      svg.select('circle.focus-point').style('opacity', 0);
      svg.selectAll('line.cross-hairs').style('opacity', 0);
    });

    // done
  }, [
    stormData,
    yearFilter,
    selectedDimension,
    regionSelected,
    stormTypeSelected,
    hoveredStormEvent,
    filteredStormEvent,
  ]);

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
        const regionConditionIsTrue =
          regionSelected === 'ALL'
            ? true
            : row.STATE.toLowerCase() === regionSelected.toLowerCase();
        const yearConditionIsTrue = yearMin <= row.YEAR && row.YEAR <= yearMax;
        const filterByEventIsTrue = !filteredStormEvent
          ? true
          : filteredStormEvent.toLowerCase() === row.EVENT.toLowerCase();

        if (yearConditionIsTrue && regionConditionIsTrue && filterByEventIsTrue) {
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

    // sort by the average metric value
    // selectedDimension
    const displayDataWithAverages = [...displayData].map((eventData) => {
      const sum = eventData.values.reduce((accumulator, currentValue) => {
        return accumulator + currentValue[selectedDimension];
      }, 0);
      return {
        ...eventData,
        averageValue: sum / eventData.values.length,
      };
    });

    // sort so that we render them from biggest to smallest so we can hover on them more easily
    const sortedByAvgValue = [...displayDataWithAverages].sort((a, b) => {
      return b.averageValue - a.averageValue;
    });

    return sortedByAvgValue;
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div className="title" style={{ position: 'absolute', top: 0, left: margin.left + 20 }}>
        {title} by Storm Type{' '}
        <strong className="storm-selected">
          {filteredStormEvent ? `- ${filteredStormEvent}s` : ''}
        </strong>
        <p className="mt-1" style={{ color: COLOR_ACCCENT }}>
          {regionSelected === 'ALL'
            ? 'USA'
            : (regionSelected as string).replace('(United States)', '').trim().toUpperCase()}
        </p>
      </div>
      <div
        ref={wrapperRef}
        style={{ width: '100%', height: '65%', position: 'relative' }}
        className={`${id}-wrapper event-by-storm-chart`}
      >
        <svg ref={svgRef}>
          <defs>
            <clipPath id={`${id}`}>
              <rect x="0" y="0" width={innerDimension.w} height="100%" />
            </clipPath>
          </defs>
          <line className="cross-hairs ch-x"></line>
          <line className="cross-hairs ch-y"></line>
          <g className="content" clipPath={`url(#${id})`}></g>
          <g className="x-axis axis" />
          <g className="y-axis axis" />
          <circle
            className="focus-point"
            stroke={COLOR_ACCCENT}
            stroke-opacity="1"
            fill="none"
            stroke-width={0.5}
          />
        </svg>
      </div>

      {/* legend */}
      <div
        className="storm-legend d-flex justify-content-between flex-wrap"
        style={{ height: '25%', left: margin.left / 2, bottom: -10 }}
      >
        {STORM_EVENT_CATEGORIES.map((stormName) => {
          const color = isSelectedStorm(stormName) ? COLOR_ACCCENT : stormColorMap[stormName];
          return (
            <div
              className="legend-elem"
              key={stormName}
              onMouseEnter={() => {
                setHoveredStormEvent(stormName);
              }}
              onMouseLeave={() => {
                setHoveredStormEvent(null);
              }}
              onClick={() => {
                // when clicking on a new event choose that
                // when reclicking on the same one turn it off
                if (filteredStormEvent === stormName) {
                  setFilteredStormEvent(null);
                } else {
                  setFilteredStormEvent(stormName);
                }
              }}
            >
              <div
                className="legend-color"
                style={{
                  backgroundColor: `${color}`,
                }}
              ></div>
              <span
                style={{
                  fontWeight: hoveredStormEvent === stormName ? 'bold' : 'normal',
                }}
              >
                {stormName}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MultiLineChart;

type DisplayData = {
  key: StormEventCategoryType;
  values: StateDataDimensions[];
};
