import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';
import { GlobalTempDataType } from './data/types';
import { Margin } from './types';
import useResizeObserver from './useResizeObserver';

import './LineChartBrushed.scss';
import { COLOR_UI_ERROR } from './data/constants';

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

    svgContent
      .selectAll('.line-path')
      .data([data])
      .join('path')
      .classed('line-path', true)
      .transition()
      .duration(500)
      .ease(d3.easeSinInOut)
      .attr('stroke', COLOR_UI_ERROR)
      .attr('stroke-width', '2')
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

        onBrush(end > start ? [start, end] : [end, start]);
      });

    brushElem.call(brush);
  }, [data, margin]);

  return (
    <div
      ref={wrapperRef}
      style={{ width: '100%', height: '100%', position: 'relative' }}
      className={`${id}-wrapper global-temp-chart`}
    >
      <div
        className={`cover ${coverIsActive ? 'active' : 'inactive'}`}
        style={{
          width: innerDimensions.width + 5,
          height: innerDimensions.height + 2,
          left: margin.right,
          top: margin.top - 2,
        }}
      >
        <div className="cover-text" onMouseEnter={() => setCoverIsActive(false)}>
          <strong>
            Click and Drag
            <br /> to zoom in on a time range
          </strong>
        </div>
      </div>
      <div className="title" style={{ position: 'absolute', top: -10, left: margin.left + 20 }}>
        <p className="m-0">
          {title}{' '}
          <span className={`question ${modalIsActive ? 'active' : 'inactive'}`} onClick={() => setModalIsActive(!modalIsActive)}>
            ?
          </span>
        </p>
      </div>
      <div
        className={`global-temp-modal ${modalIsActive ? 'active' : 'inactive'}`}
        style={{
          width: innerDimensions.width + 5,
          height: innerDimensions.height + 2,
          left: margin.right,
          top: margin.top - 2,
        }}
      >
        <div className="modal-text" >
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
        </defs>
        <g className="content">
          <path className="line-path"></path>
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

{
  /* <g> // todo maybe make this a pop up
          <text
            className="description"
            style={{ fontSize: '12px', lineHeight: '12px', width: '80%', margin: '0 auto' }}
          >
            The term temperature anomaly means a departure from a reference value or long-term average. A positive
            anomaly indicates that the observed temperature was warmer than the reference value, while a negative
            anomaly indicates that the observed temperature was cooler than the reference value.
          </text>
        </g> */
}
