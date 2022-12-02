import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';
import { GlobalTempDataType } from './data/types';
import { Margin } from './types';
import useResizeObserver from './useResizeObserver';
import { COLOR_UI_ERROR, COLOR_UI_PRIMARY, YEAR_RANGE } from './data/constants';
import chevronRightSvg from './svg/chevron-arrow-right.svg';

import './LineChartBrushed.scss';

type Props = {
  // data: StormDataColumns;
  data: GlobalTempDataType[];
  margin: Margin;
  title?: string;
  onBrush?: (selectionYears: [number, number]) => unknown;
  lineColor?: string;
  id?: string;
};

const LineChart = ({ data, margin, id, title, onBrush }: Props) => {
  // Sort of like the constructor
  const svgRef = useRef(null);
  const wrapperRef = useRef(null); // Parent of SVG
  const dimensions = useResizeObserver(wrapperRef);
  const [innerDimensions, setInnerDimensions] = useState({ width: 0, height: 0 });
  const [coverIsActive, setCoverIsActive] = useState(true);
  const [modalIsActive, setModalIsActive] = useState(false);
  const [userHasBrushed, setUserHasBrushed] = useState(false);

  useEffect(() => {
    const svg = d3.select(svgRef.current);

    const { width: svgWidth, height: svgHeight } =
      dimensions || wrapperRef.current.getBoundingClientRect();
    const innerWidth = svgWidth - margin.left - margin.right;
    const innerHeight = svgHeight - margin.top - margin.bottom;
    setInnerDimensions({
      width: innerWidth,
      height: innerHeight,
    });

    svg.attr('width', svgWidth).attr('height', svgHeight);
    const svgContent = svg
      .select('.content')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const xScale = d3
      .scaleLinear()
      .range([0, innerWidth])
      .domain(d3.extent(data, (d) => d.year));

    const yScale = d3
      .scaleLinear()
      .range([innerHeight, 0])
      .domain([-0.2, d3.max(data, (d) => d.smoothed)]);

    const lineGenerator = d3
      .line()
      // @ts-ignore
      .x((d: GlobalTempDataType) => xScale(d.year))
      // @ts-ignore
      .y((d: GlobalTempDataType) => yScale(d.smoothed))
      .curve(d3.curveMonotoneX);

    // draw the baseline temp
    d3.select('.baseline-temp')
      .data([
        [
          { year: YEAR_RANGE.min, smoothed: 0 },
          { year: YEAR_RANGE.max, smoothed: 0 },
        ],
      ])
      .attr('stroke', COLOR_UI_PRIMARY)
      .attr('stroke-width', '1')
      .attr('stroke-opacity', '0.7')
      .attr('fill', 'none')
      // @ts-ignore
      .attr('d', lineGenerator);

    d3.select('.baseline-label')
      .attr('y', yScale(0) - 3)
      .attr('x', xScale(2022) - 10)
      .style('fill', COLOR_UI_PRIMARY)
      .style('font-size', 13)
      .attr('text-anchor', 'end');

    svgContent
      .selectAll('.line-path')
      .data([data])
      .join('path')
      .classed('line-path', true)
      .style('filter', 'url(#glow-line-temp)')
      .transition()
      .duration(500)
      .ease(d3.easeSinInOut)
      .attr('stroke', COLOR_UI_ERROR)
      .attr('stroke-width', '1.5')
      .attr('fill', 'none')
      // @ts-ignore
      .attr('d', lineGenerator);

    // Axis
    const xAxis = d3.axisBottom(xScale).tickFormat((d) => d.toString());
    const yAxis = d3.axisLeft(yScale).tickFormat(d3.format('.1f')).ticks(5);

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

    // Brushing
    const brushElem = svg.select('.brush-group');
    const brush = d3
      .brushX()
      .extent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .on('brush end', (event) => {
        const { selection } = event;
        const [left, right] = selection || [0, innerWidth];
        const start = xScale.invert(left);
        const end = xScale.invert(right);
        if (Math.abs(start - end) < 1) return;

        setUserHasBrushed(true);
        onBrush(end > start ? [start, end] : [end, start]);
      });

    brushElem.call(brush);
  }, [data, margin]);

  return (
    <div
      ref={wrapperRef}
      style={{ width: '100%', height: '100%', position: 'relative' }}
      className={`${id}-wrapper global-temp-chart`}
      onMouseLeave={(event) => {
        event.stopPropagation();
        if (!userHasBrushed) setCoverIsActive(true);
      }}
    >
      <div
        className={`cover ${coverIsActive ? 'active' : 'inactive'}`}
        style={{
          width: innerDimensions.width + 5,
          height: innerDimensions.height + 2,
          left: margin.left + 4,
          top: margin.top - 2,
        }}
      >
        <div
          className="cover-text"
          onMouseEnter={(event) => {
            event.stopPropagation();
            setCoverIsActive(false);
          }}
        >
          <div className="arrow-box">
            <img src={chevronRightSvg} className="arrow left" />
          </div>
          <div className="prompt">
            <p>Click and Drag</p>
            <small>over the temperature chart to zoom in on a time range</small>
          </div>
          <div className="arrow-box">
            <img src={chevronRightSvg} className="arrow right" height="10%" width="10%" />
          </div>
        </div>
      </div>
      <div className="title" style={{ position: 'absolute', top: -12, left: margin.left + 4 }}>
        <p className="m-0">
          {title}
          <span
            className={`info ${modalIsActive ? 'active' : 'inactie'}`}
            onClick={() => setModalIsActive(!modalIsActive)}
          >
            i
          </span>
        </p>
      </div>
      <div
        className={`global-temp-modal ${modalIsActive ? 'active' : 'inactive'}`}
        style={{
          width: innerDimensions.width + 5,
          height: innerDimensions.height + 2,
          left: margin.left,
          top: margin.top - 2,
        }}
      >
        <div className="modal-text">
          "Temperature anomaly" means a departure from a reference value or long-term average. A
          positive anomaly indicates the temperature was warmer than the reference value, while a
          negative anomaly indicates the temperature was cooler.
        </div>
      </div>

      <svg ref={svgRef}>
        <defs>
          <clipPath id={id}>
            <rect x="0" y="0" width="100%" height="100%" />
          </clipPath>
          <filter id="glow-line-temp">
            <feGaussianBlur stdDeviation="15" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g className="content">
          <path className="line-path"></path>
          <text className="baseline-label">Baseline/Avg. Temp Anomaly </text>
          <path className="baseline-temp"></path>
          <g className="brush-group"></g>
        </g>
        <g className="x-axis axis" />
        <g className="y-axis axis" />
        <g className="title">
          <text>{title}</text>
        </g>
      </svg>
    </div>
  );
};

export default LineChart;
