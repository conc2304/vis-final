import * as d3 from 'd3';
import { useRef, useEffect, useState, MutableRefObject } from 'react';
import { GeoRegionUSType, StormDataType } from './data/types';
import useResizeObserver from './useResizeObserver';
import { Margin } from './types';
import { COLOR_RANGE, COLOR_UI_ERROR, COLOR_UI_PRIMARY, YEAR_RANGE } from './data/constants';
import GlobalTempData from './data/Global_Temp_Data';
import { allStates, stateNameToAbbreviation } from './data/states';

import './CircleBarChart.scss';

interface DisplayData {
  state: GeoRegionUSType;
  numberOfStorms: number;
}

type StormByStateAndYearMap = d3.InternMap<number, DisplayData[]>;
// type ScalesType = d3.ScaleLinear | d3.ScaleRadial;

interface Props {
  stormData: StormDataType[];
  margin?: Margin;
  colorRange?: string[];
  id: string;
}

const tempDataMapped = GlobalTempData.reduce((prev, curr) => ({
  ...prev,
  [curr.year]: curr.smoothed,
}));

const CircleBarChart = ({
  stormData,
  margin = {
    top: 10,
    bottom: 10,
    right: 10,
    left: 10,
  },
  id,
}: Props) => {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null); // Parent of SVG
  const dimensions = useResizeObserver(wrapperRef);
  const innerRadius = 150;

  const [stormDataByStateAndYear, setStormDataByStateAndYear] = useState<StormByStateAndYearMap>(
    new Map()
  );
  const [yearFilter, setYearFilter] = useState(YEAR_RANGE.min);

  const svgContent: MutableRefObject<d3.Selection<d3.BaseType, unknown, null, undefined>> =
    useRef();
  const arcGenerator: MutableRefObject<d3.Arc<unknown, DisplayData>> = useRef();
  const tempRadiusScale: MutableRefObject<any> = useRef();
  const tempColorScale: MutableRefObject<any> = useRef();
  const timeScale: MutableRefObject<any> = useRef();

  useEffect(() => {
    if (!stormData) {
      return;
    }

    let eventsMax = 0;
    const dataByYear = d3.group(stormData, (d) => d.YEAR);
    const stormDataByState = d3.group(stormData, (d) => d.STATE);
    stormDataByState.forEach((entry, key) => {
      // remove any items which are not actual states (+ DC)
      if (!stateNameToAbbreviation(key)) {
        stormDataByState.delete(key);
      }
    });
    const stormCountByYear: StormByStateAndYearMap = new Map();

    dataByYear.forEach((value, year) => {
      if (isNaN(year)) {
        dataByYear.delete(year);
        return;
      }
      const sumYearEvents = d3.rollup(
        value,
        (v) => d3.sum(v, (d) => d.EVENT_COUNT),
        (d) => d.STATE
      );
      const dataByState = Array.from(sumYearEvents, ([state, numberOfStorms]) => ({
        state,
        numberOfStorms,
      }));

      stormCountByYear.set(year, dataByState);
      const maxSum = d3.max(dataByState, (d) => d.numberOfStorms);
      if (maxSum > eventsMax) {
        eventsMax = maxSum;
      }
    });

    const svg = d3.select(svgRef.current);

    const { width: svgWidth, height: svgHeight } =
      dimensions || wrapperRef.current.getBoundingClientRect();

    const innerWidth = svgWidth - margin.left - margin.right;
    const innerHeight = svgHeight - margin.top - margin.bottom;

    const radiusMax = d3.min([innerWidth / 2, innerHeight / 2]);

    svg.attr('width', svgWidth).attr('height', svgHeight);
    svgContent.current = svg
      .select('.content')
      .attr('transform', `translate(${svgWidth / 2}, ${svgHeight / 2})`);

    d3.select('.clock-hand-group').attr(
      'transform',
      `translate(${svgWidth / 2}, ${svgHeight / 2})`
    );

    d3.select('.temp-anomaly-group').attr(
      'transform',
      `translate(${svgWidth / 2}, ${svgHeight / 2})`
    );

    const eventsScale = d3.scaleRadial().range([innerRadius, radiusMax]).domain([0, eventsMax]);
    const stateBandScale = d3
      .scaleBand()
      .domain(allStates)
      .range([0, 2 * Math.PI]);
    const getTemp = (d) => d.smoothed;

    timeScale.current = d3
      .scaleBand()
      // @ts-ignore
      .domain(d3.range(YEAR_RANGE.min, YEAR_RANGE.max, 1))
      .range([0, 360]);

    const tempDomain = [d3.min(GlobalTempData, getTemp), d3.max(GlobalTempData, getTemp)];
    tempColorScale.current = d3
      .scaleLinear()
      .domain(tempDomain)
      // @ts-ignore
      .range(COLOR_RANGE.slice(1));

    tempRadiusScale.current = d3
      .scaleLinear()
      .domain([-1, 1])
      // @ts-ignore
      .range([innerRadius, radiusMax]);

    arcGenerator.current = d3
      .arc<DisplayData>()
      .innerRadius(innerRadius)
      .outerRadius((d) => eventsScale(d.numberOfStorms))
      .startAngle((d) => stateBandScale(d.state))
      .endAngle((d) => stateBandScale(d.state) + stateBandScale.bandwidth())
      .padAngle(0.03)
      .padRadius(80);

    const stateAxis = (g) =>
      g.attr('class', 'axis state-axis').call((g) =>
        g
          .selectAll('g')
          .data(allStates)
          .join('g')
          .attr('transform', (d) => {
            const transform = `rotate(${
              ((stateBandScale(d) + stateBandScale.bandwidth() / 2) * 180) / Math.PI - 90
            })
              translate(${innerRadius},0)
            `;
            return transform;
          })
          .call((g) => g.append('line').attr('x2', -5).attr('stroke', '#000'))
          .call((g) =>
            g
              .append('text')
              .attr('transform', (d) => {
                const transform =
                  (stateBandScale(d) + stateBandScale.bandwidth() / 2 + Math.PI / 2) %
                    (2 * Math.PI) <
                  Math.PI
                    ? 'rotate(90)translate(0,16)'
                    : 'rotate(-90)translate(0,-9)';
                return transform;
              })
              .text((d) => stateNameToAbbreviation(d))
          )
      );

    d3.select('.temp-circle-zero').attr('r', tempRadiusScale.current(0));
    d3.select('.temp-circle-zero-background').attr("cx", tempRadiusScale.current(0))
    d3.select('.temp-circle-zero-value').attr("x", tempRadiusScale.current(0))

    const eventsAxis = (g) =>
      g
        .attr('class', 'axis event-axis')
        .call((g) =>
          g
            .append('text')
            .attr('class', 'title')
            .attr('y', () => -eventsScale(eventsScale.ticks(5).pop()))
            .attr('dy', '-1em')
            .text('Total Storm Events')
        )
        .call((g) =>
          g
            .selectAll('g')
            .data(eventsScale.ticks(5).slice(1))
            .join('g')
            .attr('fill', 'none')
            .call((g) => g.append('circle').attr('r', eventsScale))
            .call((g) =>
              g
                .append('text')
                .attr('y', (d) => -eventsScale(d))
                .attr('dy', '0.35em')
                .attr('stroke', '#fff')
                .text(eventsScale.tickFormat(5, 's'))
            )
        );

    svgContent.current.append('g').call(stateAxis);
    svgContent.current.append('g').call(eventsAxis);

    setStormDataByStateAndYear(stormCountByYear);
  }, [stormData]);

  useEffect(() => {
    if (!stormDataByStateAndYear.size || !svgContent.current) {
      return;
    }
    const displayData = stormDataByStateAndYear.get(yearFilter);

    d3.select('.clock-hand')
      .datum(yearFilter)
      .style('stroke', 'white')
      .style('stroke-width', 3)
      .attr('x0', 0)
      .attr('x1', 0)
      .attr('y0', 0)
      .attr('y1', innerRadius - 50)
      .transition()
      .attr('transform', (d) => `rotate(${timeScale.current(d)})`);

    // Add Circle for the temperature anomaly scale
    d3.select('.temp-circle')
      .datum(yearFilter)
      .style('stroke', COLOR_UI_ERROR)
      .style('stroke-width', 2)
      .style('fill', 'none')
      .transition()
      .attr('r', (d) => {
        const tempForYear = GlobalTempData.find((entry) => entry.year === d).smoothed;
        return tempRadiusScale.current(tempForYear);
      });

    const rectWidth = 60;
    const rectHeight = 30;

    d3.select('.temp-background')
      .datum(yearFilter)
      .attr('x', 0)
      .transition()
      .attr('cy', (d) => {
        const tempForYear = GlobalTempData.find((entry) => entry.year === d).smoothed;
        return tempRadiusScale.current(tempForYear);
      });

    d3.select('.temp-anomaly-value')
      .datum(yearFilter)
      .text((d) => GlobalTempData.find((entry) => entry.year === d).smoothed)
      .transition()
      .attr('y', (d) => {
        const tempForYear = GlobalTempData.find((entry) => entry.year === d).smoothed;
        return tempRadiusScale.current(tempForYear);
      });

    const arcs = svgContent.current
      .selectAll<SVGPathElement, DisplayData>('path')
      .data(displayData, (d) => d.state);

    arcs
      .enter()
      .append('path')
      .merge(arcs)
      .attr('class', (d) => `state-${d.state}-${d.numberOfStorms}`)
      .transition()
      .attr('d', (d) => {
        if (!arcGenerator.current) {
          return 0;
        }
        return arcGenerator.current(d);
      })
      .attr('fill', tempColorScale.current(tempDataMapped[yearFilter]));
    arcs.exit().remove();
  }, [stormDataByStateAndYear, yearFilter]);

  useEffect(() => {
    if (!stormData) {
      return;
    }

    const interval = window.setInterval(() => {
      setYearFilter((prevState) => {
        if (prevState === YEAR_RANGE.max) {
          return YEAR_RANGE.min;
        }
        return prevState + 1;
      });
    }, 400);
    return () => window.clearInterval(interval);
  }, [stormData, margin, id]);

  useEffect(() => {
    // draw a cirlce to represent the change in temperature over the years
    // console.log('yearFilter ', yearFilter);
  }, [yearFilter]);

  return (
    <div
      ref={wrapperRef}
      style={{ width: '100%', height: '100%', position: 'relative' }}
      className={`${id}-wrapper`}
    >
      <svg ref={svgRef}>
        <defs>
          <clipPath id={id}>
            <rect x="0" y="0" width="100%" height="100%" />
          </clipPath>
        </defs>
        <g className="content"></g>
        <g className="clock-hand-group">
          <line className="clock-hand"></line>
          <circle
            cx="24"
            cy="12"
            r="24"
            style={{ fill: 'black', transform: 'translate(-24px, -13px)' }}
          ></circle>
          <text
            x="0"
            y="0"
            style={{ fill: '#fff', textAnchor: 'middle', dominantBaseline: 'middle' }}
          >
            {yearFilter}
          </text>
        </g>
        <g className="temp-anomaly-group">
          <circle cx="0" cy="0" className="temp-circle" />
          <circle
            cx="0"
            cy="0"
            r="200"
            className="temp-circle-zero"
            style={{
              fill: 'none',
              stroke: COLOR_UI_PRIMARY,
              strokeWidth: 1.5,
            }}
          />

          <circle
            className="temp-circle-zero-background"
            y="0"
            r="20"
            style={{
              fill: '#000',
              fillOpacity: 0.8,
              stroke: COLOR_UI_PRIMARY,
              strokeWidth: 1,
              strokeOpacity: 0.8
            }}
          />
          <text
            className="temp-circle-zero-value"
            y="0"
            style={{
              fill: '#fff',
              textAnchor: 'middle',
              dominantBaseline: 'mathematical',
              fontWeight: 'bold',
            }}
          >0</text>

          <circle
            className="temp-background"
            x="0"
            r="25"
            style={{
              fill: '#000',
              fillOpacity: 0.8,
              stroke: COLOR_UI_ERROR,
              strokeWidth: 1.5,
            }}
          />
          <text
            className="temp-anomaly-value"
            x="0"
            style={{
              fill: '#fff',
              textAnchor: 'middle',
              dominantBaseline: 'mathematical',
              fontWeight: 'bold',
            }}
          />
        </g>
      </svg>
    </div>
  );
};

export default CircleBarChart;
