import * as d3 from 'd3';
import { useRef, useEffect, useState, MutableRefObject } from 'react';
import { GeoRegionUSType, StormDataType } from './data/types';
import useResizeObserver from './useResizeObserver';
import { Margin } from './types';
import { COLOR_RANGE, YEAR_RANGE } from './data/constants';
import GlobalTempData from './data/Global_Temp_Data';
import { allStates } from './data/states';

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
  const innerRadius = 80;

  const [stormDataByStateAndYear, setStormDataByStateAndYear] = useState<StormByStateAndYearMap>(
    new Map()
  );
  const [yearFilter, setYearFilter] = useState(YEAR_RANGE.min);

  const svgContent: MutableRefObject<d3.Selection<d3.BaseType, unknown, null, undefined>> =
    useRef();
  const arcGenerator: MutableRefObject<d3.Arc<unknown, DisplayData>> = useRef();
  const tempScale: MutableRefObject<any> = useRef();
  const timeScale: MutableRefObject<any> = useRef();

  useEffect(() => {
    if (!stormData) {
      return;
    }

    let eventsMax = 0;
    const dataByYear = d3.group(stormData, (d) => d.YEAR);
    const stormDataByState = d3.group(stormData, (d) => d.STATE);
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
      tempScale.current = d3
        .scaleLinear()
        .domain([d3.min(GlobalTempData, getTemp), d3.max(GlobalTempData, getTemp)])
        // @ts-ignore
        .range(COLOR_RANGE.slice(1));

      arcGenerator.current = d3
        .arc<DisplayData>()
        .innerRadius(innerRadius)
        .outerRadius((d) => eventsScale(d.numberOfStorms))
        .startAngle((d) => stateBandScale(d.state))
        .endAngle((d) => stateBandScale(d.state) + stateBandScale.bandwidth())
        .padAngle(0.03)
        .padRadius(80);
    });

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
      .attr('y1', innerRadius - 10)
      .transition()
      .attr('transform', (d) => `rotate(${timeScale.current(d)})`);

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
      .attr('fill', tempScale.current(tempDataMapped[yearFilter]));
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
    }, 500);
    return () => window.clearInterval(interval);
  }, [stormData, margin, id]);

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
        <g className="clock-hand-group" style={{ transform: 'translate(50%, 50%)' }}>
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
      </svg>
    </div>
  );
};

export default CircleBarChart;
