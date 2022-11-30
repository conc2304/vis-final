import * as d3 from 'd3';
import { useRef, useEffect, useState, MutableRefObject } from 'react';
import { GeoRegionUSType, StormDataType } from './data/types';
import useResizeObserver from './useResizeObserver';
import { Margin } from './types';
import {
  COLOR_RANGE,
  COLOR_UI_ERROR,
  COLOR_UI_PRIMARY,
  COLOR_UI_SUCESS,
  YEAR_RANGE,
} from './data/constants';
import GlobalTempData from './data/Global_Temp_Data';
import { allStates, stateNameToAbbreviation } from './data/states';

import './CircleBarChart.scss';
import { arc } from 'd3';

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
  const tempColorScale: MutableRefObject<any> = useRef();
  const timeScale: MutableRefObject<any> = useRef();
  const tempArcScale: MutableRefObject<d3.ScaleLinear<number, number, never>> = useRef();
  const thermoArc: MutableRefObject<any> = useRef();
  const thermoRadius: MutableRefObject<number> = useRef();
  const thermoThickness = 2;

  useEffect(() => {
    // INIT
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

    const radiusMax = d3.min([innerWidth / 2, innerHeight / 2]) * 0.85;

    svg.attr('width', svgWidth).attr('height', svgHeight);
    svgContent.current = svg
      .select('.content')
      .attr('transform', `translate(${svgWidth / 2}, ${svgHeight / 2})`);

    d3.select('.clock-hand-group').attr(
      'transform',
      `translate(${svgWidth / 2}, ${svgHeight / 2})`
    );

    d3.select('.thermometer-group').attr(
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

    // add circular thermometer guage
    const startAngle = Math.PI / 4;
    const endAngle = (3 * Math.PI) / 4;
    thermoRadius.current = radiusMax * 1.05;

    tempArcScale.current = d3.scaleLinear().domain([-1, 1]).range([startAngle, endAngle]);

    thermoArc.current = d3
      .arc()
      .innerRadius(thermoRadius.current)
      .outerRadius(thermoRadius.current + thermoThickness)
      .startAngle(startAngle)
      .endAngle(endAngle);

    d3.select('path.thermometer-scale').attr('d', thermoArc.current);

    d3.select('.thermo-tick-high')
      .attr('cx', thermoRadius.current * Math.sin(endAngle))
      .attr('cy', thermoRadius.current * Math.cos(endAngle));
    d3.select('.thermo-tick-mid')
      .attr('cx', thermoRadius.current * Math.sin((startAngle + endAngle) / 2))
      .attr('cy', thermoRadius.current * Math.cos((startAngle + endAngle) / 2));
    d3.select('.thermo-tick-low')
      .attr('cx', thermoRadius.current * Math.cos(startAngle))
      .attr('cy', thermoRadius.current * Math.sin(startAngle));

    d3.select('.thermo-tick-high-label')
      .attr('x', thermoRadius.current * 1.05 * Math.sin(endAngle))
      .attr('y', thermoRadius.current * 1.05 * Math.cos(endAngle));
    d3.select('.thermo-tick-mid-label')
      .attr('x', thermoRadius.current * 1.05 * Math.sin((startAngle + endAngle) / 2))
      .attr('y', thermoRadius.current * 1.05 * Math.cos((startAngle + endAngle) / 2));
    d3.select('.thermo-tick-low-label')
      .attr('x', thermoRadius.current * 1.05 * Math.cos(startAngle))
      .attr('y', thermoRadius.current * 1.05 * Math.sin(startAngle));

    d3.select('.thermometer-values circle.thermo-value')
      .attr('cx', (d) => {
        const tempForYear = getTempForYear(YEAR_RANGE.min);
        return thermoRadius.current * Math.sin(tempArcScale.current(tempForYear));
      })
      .attr('cy', (d) => {
        const tempForYear = getTempForYear(YEAR_RANGE.min);
        return thermoRadius.current * Math.cos(tempArcScale.current(tempForYear));
      });

    d3.select('.temp-anomaly-value')
      .datum(yearFilter)
      .text((d) => {
        const temp = getTempForYear(YEAR_RANGE.min);
        return `${temp > 0 ? '+' : ''}${temp}°`;
      })
      .attr('x', (d) => {
        const tempForYear = getTempForYear(YEAR_RANGE.min);
        return thermoRadius.current * Math.sin(tempArcScale.current(tempForYear));
      })
      .attr('y', (d) => {
        const tempForYear = getTempForYear(YEAR_RANGE.min);
        return thermoRadius.current * Math.cos(tempArcScale.current(tempForYear));
      });

    // the red thermometer line
    d3.select('path.thermometer').attr(
      'd',
      d3
        .arc()
        .startAngle(Math.PI - tempArcScale.current(getTempForYear(YEAR_RANGE.min)))
        .endAngle(tempArcScale.current.range()[1])
        .innerRadius(thermoRadius.current)
        .outerRadius(thermoRadius.current + thermoThickness)
    );

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

    const eventsAxis = (g) =>
      g
        .attr('class', 'axis event-axis')
        .call((g) =>
          g
            .append('text')
            .attr('class', 'title')
            .attr('y', () => -eventsScale(eventsScale.ticks(5).pop()) - 5)
            .attr('dy', '-1em')
            .style('font-size', 18)
            .text('Total Storm Events Over Time')
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
                .attr('fill', '#fff')
                .attr('font-size', 12)
                .attr('font-weight', 'bold')
                .text(eventsScale.tickFormat(5, 's'))
            )
        );

    svgContent.current.append('g').call(stateAxis);
    svgContent.current.append('g').call(eventsAxis);

    setStormDataByStateAndYear(stormCountByYear);
  }, [stormData]);

  // Updates
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

    // add thermometer guage


    d3.select('path.thermometer')
      .datum(yearFilter)
      .transition()
      //@ts-ignore
      .attrTween('d', function (d, i) {

        const arc = d3.arc()
          .startAngle(Math.PI - tempArcScale.current(getTempForYear(yearFilter)))
          .endAngle(tempArcScale.current.range()[1])
          .innerRadius(thermoRadius.current)
          .outerRadius(thermoRadius.current + thermoThickness);

        return (t) => {
          //@ts-ignore
          return arc();
        };
      });

    d3.select('.thermometer-values circle.thermo-value')
      .datum(yearFilter)
      .transition()
      .attr('cx', (d) => {
        const tempForYear = getTempForYear(d);
        return thermoRadius.current * Math.sin(tempArcScale.current(tempForYear));
      })
      .attr('cy', (d) => {
        const tempForYear = getTempForYear(d);
        return thermoRadius.current * Math.cos(tempArcScale.current(tempForYear));
      });

    d3.select('.temp-anomaly-value')
      .datum(yearFilter)
      .text((d) => {
        const temp = getTempForYear(d);
        return `${temp > 0 ? '+' : ''}${temp}°`;
      })
      .transition()
      .attr('x', (d) => {
        const tempForYear = getTempForYear(d);
        return thermoRadius.current * Math.sin(tempArcScale.current(tempForYear));
      })
      .attr('y', (d) => {
        const tempForYear = getTempForYear(d);
        return thermoRadius.current * Math.cos(tempArcScale.current(tempForYear));
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

  function getTempForYear(year: number): number {
    return GlobalTempData.find((entry) => entry.year === year).smoothed;
  }

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
        <g className="thermometer-group">
          <g className="thermometer-axis">
            <path className="thermometer-scale" fill={COLOR_UI_PRIMARY}></path>
          </g>

          <g className="thermometer-ticks-labels">
            <text className="thermo-tick-high-label" fill={COLOR_UI_PRIMARY}>
              +1°
            </text>
            <text className="thermo-tick-mid-label" fill={COLOR_UI_PRIMARY}>
              0°
            </text>
            <text className="thermo-tick-low-label" fill={COLOR_UI_PRIMARY}>
              -1°
            </text>
          </g>
          <g className="thermometer-values">
            <path className="thermometer" fill={COLOR_UI_ERROR} />
            <circle className="thermo-tick-high" r="8" stroke={COLOR_UI_PRIMARY} />
            <circle className="thermo-tick-mid" r="8" stroke={COLOR_UI_PRIMARY} />
            <circle className="thermo-tick-low" r="8" stroke={COLOR_UI_PRIMARY} />
            <circle className='thermo-value'
              r="27"
              style={{
                fill: '#000',
                fillOpacity: 0.95,
                stroke: COLOR_UI_ERROR,
                strokeWidth: 1.5,
              }}
            ></circle>
            <text
              className="temp-anomaly-value"
              y="0"
              style={{
                fill: '#fff',
                textAnchor: 'middle',
                dominantBaseline: 'mathematical',
                fontWeight: 'bold',
              }}
            />
          </g>
        </g>
      </svg>
    </div>
  );
};

export default CircleBarChart;
