import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';
import { GlobalTempDataType } from '../../data/types';
// import { responsivefy } from './helpers';
import { Margin } from './types';

type Props = {
  // data: StormDataColumns;
  data: GlobalTempDataType[];
  margin: Margin;
  title: string;
  onBrush: (...args) => unknown;
  lineColor: string;
};

const TimelineBrush = ({ data, margin, title, lineColor = 'blue' }: Props): JSX.Element => {
  // Sort of like the constructor
  const svgRef = useRef(null);
  const svgContainer = useRef(null); // Parent of SVG

  console.log(lineColor);

  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  // This function calculates width and height of the container
  const getSvgContainerSize = () => {
    const newWidth = svgContainer.current.clientWidth;
    setWidth(newWidth);

    const newHeight = svgContainer.current.clientHeight;
    setHeight(newHeight);
  };

  const svgWidth = width + margin.left + margin.right;
  const svgHeight = height + margin.top + margin.bottom;

  // const formatDate = d3.timeFormat('%Y');
  // const parseDate = d3.timeParse('%Y');
  let svg: d3.Selection<any, unknown, null, undefined>;

  // let displayData: unknown;

  useEffect(() => {
    // detect 'width' and 'height' on render
    getSvgContainerSize();
    // listen for resize changes, and detect dimensions again when they change
    window.addEventListener('resize', getSvgContainerSize);
    // cleanup event listener
    return () => window.removeEventListener('resize', getSvgContainerSize);
  }, []);

  // this runs once on init
  useEffect(() => {

    console.log("init")
    svg = d3
      .select(svgRef.current)
      .classed('line-chart-svg', true)
      .attr('width', svgWidth)
      .attr('height', svgHeight)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    // .call(responsivefy);

    addClipPath();
    addTitle();

    // vis.brush = d3.brushX()
    // .extent([[0, 0], [vis.width, vis.height]])
    // .on("brush", brushed);
  }, []);

  // this reruns everytime the data or dimensions prop updates
  useEffect(() => {
    console.log("update")
    wrangleData();
    draw();
  }, [data, margin]);

  const wrangleData = () => {
    // data transformations
  };

  const draw = () => {
    const xScale = d3
      .scaleLinear()
      .range([0, svgWidth])
      .domain(d3.extent(data, (d) => d.year));
      
    const yScale = d3
      .scaleLinear()
      .range([svgHeight, 0])
      .domain(d3.extent(data, (d) => d.smoothed));

    // const xAxis = d3.axisBottom(xScale);
    // const yAxis = d3.axisLeft(yScale);

    // const xAxisGroup = svg.append('g').attr('class', 'axis axis--x').attr('transform', `translate(0, ${svgHeight})`);
    // const yAxisGroup = svg.append('g').attr('class', 'ais, axis--y');

    svg = d3.select(svgRef.current);
    // const chart = svg.select('g');
    const pathGroup = svg.append('g').attr('class', 'pathGroup');

    const globalTempPath = pathGroup.append('path').attr('class', 'global-temp-path');
    // const stateTempPath = pathGroup.append('path').attr('class', 'state-temp-path');

    const line = d3
      .line()
      .x((d) => xScale(d['year']))
      .y((d) => yScale(d['smoothed']))
      .curve(d3.curveMonotoneX);

    globalTempPath
      .selectAll('timeline-path')
      .data([data])
      .join((enter) =>
        enter
          .append('path')
          .classed('line-path', true)
          // @ts-ignore
          .attr('d', line)
          .style('fill', lineColor)
      )
      .classed('timeline-path', true)
      .transition()
      .duration(500)
      // @ts-ignore
      .attr('d', line);
  };

  const addTitle = () => {
    svg
      .append('g')
      .attr('class', 'title')
      .append('text')
      .text(title)
      .attr('transform', `translate(${svgWidth / 2}, 20)`)
      .attr('text-anchor', 'middle');
  };

  const addClipPath = () => {
    svg
      .append('defs')
      .append('clipPath')
      .attr('id', 'clip')
      .append('rect')
      .attr('width', svgWidth)
      .attr('height', svgHeight);
  };

  return (
    <div ref={svgContainer} className="line-chart" style={{ width: '100%' }}>
      <svg ref={svgRef} width={svgWidth} height={svgHeight} />
    </div>
  );
};

export default TimelineBrush;
