import * as d3 from 'd3';
import { useEffect, useRef } from 'react';
import { GlobalTempDataType } from '../../data/types';
// import { responsivefy } from './helpers';
import { Margin } from './types';
import useResizeObserver from './useResizeObserver';

type Props = {
  // data: StormDataColumns;
  data: GlobalTempDataType[];
  margin: Margin;
  title?: string;
  onBrush?: (...args) => unknown;
  lineColor?: string;
  id: string;
};

const LineChart = ({ data, margin, id = 'test' }: Props) => {
  // Sort of like the constructor
  const svgRef = useRef(null);
  const wrapperRef = useRef(null); // Parent of SVG
  const dimensions = useResizeObserver(wrapperRef);
  // const formatDate = d3.timeFormat('%Y');

  useEffect(() => {
    const svg = d3.select(svgRef.current);

    const { width: svgWidth, height: svgHeight } = dimensions || wrapperRef.current.getBoundingClientRect();
    const innerWidth = svgWidth - margin.left - margin.right; // vis.WH
    const innerHeight = svgHeight - margin.top - margin.bottom; // vis.WH

    svg.attr('width', svgWidth).attr('height', svgHeight);
    // .append('g')
    const svgContent = svg.select('.content').attr('transform', `translate(${margin.left}, ${margin.top})`);

    const xScale = d3
      .scaleLinear()
      .range([0, innerWidth])
      .domain(d3.extent(data, (d) => d.year));

    const yScale = d3
      .scaleLinear()
      .range([innerHeight, 0])
      .domain(d3.extent(data, (d) => d.smoothed));

    console.log('Y SCALE');
    console.log(yScale.domain());

    const lineGenerator = d3
      .line()
      .x((d) => {
        // console.log('SCALE');
        // console.log(d['year'], xScale(d['year']));
        return xScale(d['year']);
      })
      .y((d) => yScale(d['smoothed']))
      .curve(d3.curveMonotoneX);

    svgContent
      .selectAll('.line')
      .data([data])
      .join('path')
      .classed('line', true)
      .attr('stroke', 'red')
      .attr('stroke-width', '2')
      .attr('fill', 'none')
      .attr('cx', (value, index) => xScale(index))
      .attr('year', (d) => {
        console.log(d);
        return d['year'];
      })
      // @ts-ignore
      .attr('d', lineGenerator);

    // Axis
    // const;
    const xAxis = d3.axisBottom(xScale).tickFormat((d) => {
      console.log(d);
      return d.toString();
    });
    const yAxis = d3.axisLeft(yScale).tickFormat(d3.format('.2f'));

    // @ts-ignore
    svg
      .select('.x-axis')
      .attr('transform', `translate(0, ${innerHeight})`)
      // @ts-ignore
      .call(xAxis);
    // @ts-ignore
    svg.select('.y-axis').call(yAxis);
  }, [data, margin]);

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%' }} className={`${id}-wrapper`}>
      <svg ref={svgRef}>
        <defs>
          <clipPath id={id}>
            <rect x="0" y="0" width="100%" height="100%" />
          </clipPath>
        </defs>
        <g className="content">
          <g className="x-axis axis" />
          <g className="y-axis axis" />
        </g>
      </svg>
    </div>
  );
};

export default LineChart;
