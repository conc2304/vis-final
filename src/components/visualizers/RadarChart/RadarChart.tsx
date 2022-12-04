import * as d3 from 'd3';
import { useEffect, useState, useRef, MutableRefObject } from 'react';
import set from 'lodash.set';
import { Margin } from '../types';
import useResizeObserver from '../useResizeObserver';
import { COLOR_ACCCENT, COLOR_SERIES_TOP_3, COLOR_UI_PRIMARY } from '../data/constants';
import { GeoRegionUSType } from '../data/types';
import { wrap } from '../helpers';
import { RadarData, RadarDataEntry } from './WrangleRadarData';

type Props = {
  data?: RadarData;
  id: string;
  margin?: Margin;
  levels?: number; //How many levels or inner circles should there be drawn
  labelFactor?: number; //How much farther than the radius of the outer circle should the labels be placed
  wrapWidth?: number; //The number of pixels after which a label needs to be given a new line
  opacityArea?: number; //The opacity of the area of the blob
  dotRadius?: number; //The size of the colored circles of each blog
  opacityCircles?: number; //The opacity of the circles of each blob
  strokeWidth?: number; //The width of the stroke around each blob
  roundStrokes?: boolean; //If true the area and stroke will follow a round path (cardinal-closed)
  color?: readonly string[]; //Color array
  lineType?: 'curved' | 'linear';
  areValuesNormalized?: boolean;
  selectedState?: GeoRegionUSType | 'ALL';
  title: string | JSX.Element;
};

const RadarChart = ({
  data,
  id,
  margin = { top: 50, right: 20, bottom: 50, left: 20 }, //The margins of the SVG
  levels = 3, //How many levels or inner circles should there be drawn
  labelFactor = 1.25, //How much farther than the radius of the outer circle should the labels be placed
  wrapWidth = 60, //The number of pixels after which a label needs to be given a new line
  opacityArea = 0.15, //The opacity of the area of the blob
  dotRadius = 4, //The size of the colored circles of each blog
  opacityCircles = 0.1, //The opacity of the circles of each blob
  strokeWidth = 2, //The width of the stroke around each blob
  color = d3.schemeCategory10, //Color function
  lineType = 'linear',
  areValuesNormalized = true,
  selectedState = null,
  title = '',
}: Props) => {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const wrapperRef = useRef(null); // Parent of SVG
  const dimensions = useResizeObserver(wrapperRef);

  const colorScale: MutableRefObject<d3.ScaleOrdinal<string, unknown, never>> = useRef();

  const [innerDimension, setInnerDimensions] = useState({ w: 0, h: 0 });

  useEffect(() => {
    // if we dont have data yet dont render
    if (!data || !data.length || !data[0].length) return;

    const svg = d3.select(svgRef.current);

    const { width: svgWidth, height: svgHeight } =
      dimensions || wrapperRef.current.getBoundingClientRect();
    const innerWidth = svgWidth - margin.left - margin.right;
    const innerHeight = svgHeight - margin.top - margin.bottom;
    setInnerDimensions({ w: innerWidth, h: innerHeight });

    const tooltip = tooltipRef.current;

    svg.attr('width', svgWidth).attr('height', svgHeight);
    const svgContent = svg.select('.content').attr('transform', `translate(${0}, ${0})`);

    // Configure the Chart
    const axisNames = data[0].map((d) => d.axis);
    const axisQty = axisNames.length;
    const diameter = Math.min(innerWidth, innerHeight);
    const radius = diameter / 2 / (labelFactor * 1.2);

    const angleSize = (Math.PI * 2) / axisQty;

    const getMaxByAxis = (axisName: string, data: RadarData) => {
      return d3.max(data, (i) => {
        return d3.max(
          i.map((o) => {
            if (o.axis === axisName) return o.value;
          })
        );
      });
    };

    // add all of the scales to this map for getting later
    const axisScaleMap: Record<string, d3.ScaleLinear<number, number, never>> = {};
    axisNames.forEach((axisName) => {
      const axisMax = getMaxByAxis(axisName, data);
      const axisScale = d3
        .scaleLinear()
        .range([0, radius])
        .domain([0, axisMax === 0 ? 100 : axisMax]);
      set(axisScaleMap, axisName, axisScale);
    });

    const domainMax = d3.max(data, (i) => d3.max(i.map((j) => j.value)));
    const rScale = d3
      .scaleLinear()
      .range([0, radius])
      .domain([0, domainMax === 0 ? 100 : domainMax]);

    const colorSeries = COLOR_SERIES_TOP_3;
    // not sure why it has to be in this order
    colorScale.current = d3.scaleOrdinal().range([colorSeries[2], colorSeries[0], colorSeries[1]]);

    const numberOfTopStates = 3;
    const colorDomain = [...data]
      .filter((entry) => {
        const isStateSelected = selectedState.toLowerCase() === entry[0].state;

        // filter out the selectected state if its not one of the top 3
        if (data.length > numberOfTopStates && isStateSelected) {
          return false;
        }
        return true;
      })
      .map((entry) => entry[0].state);

    colorScale.current.domain(colorDomain);

    //Draw the background circles
    const axisGrid = svg.select('.axis-grid');

    // Draw the radial axis circles
    axisGrid
      .selectAll('.gridCircle')
      .data(d3.range(1, levels + 1).reverse())
      .join('circle')
      .attr('class', 'gridCircle')
      .attr('r', (d, i) => (radius / levels) * d)
      .attr('cx', svgWidth / 2)
      .attr('cy', svgHeight / 2)
      .style('fill', 'black')
      .style('fill-opacity', opacityCircles)
      .style('stroke', COLOR_UI_PRIMARY)
      .style('stroke-opacity', 0.2)
      .style('filter', 'url(#glow)');

    // Label the Axis Markers
    const getTextAnchorValue = (d, i) => {
      const x = Math.cos(angleSize * i - Math.PI / 2);
      const y = Math.sin(angleSize * i - Math.PI / 2);

      if (y === 1 || y === -1) return 'middle';
      if (x > 0) return 'start';
      if (x < 0) return 'end';
      return 'middle';
    };

    axisGrid
      .selectAll('.axis-label')
      .data(axisNames)
      .join('text')
      .attr('class', 'axis-label')
      .attr('text-anchor', getTextAnchorValue)
      .attr('dy', '0.35em')
      .attr(
        'x',
        (d, i) => svgWidth / 2 + radius * labelFactor * Math.cos(angleSize * i - Math.PI / 2)
      )
      .attr(
        'y',
        (d, i) => svgHeight / 2 + radius * labelFactor * Math.sin(angleSize * i - Math.PI / 2)
      )
      .style('font-size', '12px')
      .style('fill', COLOR_UI_PRIMARY)
      .style('fill-opacity', 0.8)
      .text(function (d) {
        return d;
      })
      .call(wrap, wrapWidth);

    //Create the straight lines radiating outward from the center
    axisGrid
      .selectAll('.line')
      .data(axisNames)
      .join('line')
      .attr('x1', svgWidth / 2)
      .attr('y1', svgHeight / 2)
      .attr('x2', function (d, i) {
        return svgWidth / 2 + radius * Math.cos(angleSize * i - Math.PI / 2);
      })
      .attr('y2', function (d, i) {
        return svgHeight / 2 + radius * Math.sin(angleSize * i - Math.PI / 2);
      })
      .attr('class', 'line')
      .attr('mix-blend-mode', 'multiply')
      .style('stroke', COLOR_UI_PRIMARY)
      .style('stroke-opacity', '0.4')
      .style('stroke-width', '0.5px');

    // Draw the Radar Points and Lines
    const radarLineGenerator = d3
      .lineRadial()
      .curve(lineType === 'linear' ? d3.curveLinearClosed : d3.curveCardinalClosed)
      //@ts-ignore
      .radius((d: { axis: string; value: number }) => {
        const thisScale = areValuesNormalized ? rScale : axisScaleMap[d.axis];
        return thisScale(d.value);
      })
      .angle((d, i) => i * angleSize);

    // add a wrapper for each item
    const radarWrapper = svgContent
      .selectAll('.radar-wrapper')
      .data(data)
      .join('g')
      .attr('class', 'radar-wrapper')
      .attr('transform', `translate(${svgWidth / 2}, ${svgHeight / 2})`);

    radarWrapper.selectAll('.radar-area').remove();
    radarWrapper.selectAll('.radar-circle').remove();
    radarWrapper.selectAll('.radar-stroke').remove();

    // background of area
    radarWrapper
      .append('path')
      .attr('class', 'radar-area')
      // @ts-ignore
      .merge(radarWrapper)
      // @ts-ignore
      .attr('d', radarLineGenerator)
      .style('fill', (d) =>
        d[0].state.toLowerCase() === selectedState.toLowerCase()
          ? COLOR_ACCCENT
          : (colorScale.current(d[0].state) as string)
      )
      .style('fill-opacity', opacityArea)
      .on('mouseover', function (event: MouseEvent, d) {
        //Dim all blobs
        d3.selectAll('.radar-area').transition().duration(200).style('fill-opacity', 0.1);
        //Bring back the hovered over blob
        d3.select(this).transition().duration(200).style('fill-opacity', 0.5);

        // prep the tooltip
        const state = d[0].state;

        tooltip.innerHTML = backgroundAreaTooltip(state, d);
        const tWidth = 240;
        tooltip.style.width = `${tWidth}px`;
        const tooltipXPos = innerWidth - tWidth / 4;

        tooltip.style.left = `${tooltipXPos}px`;
        tooltip.style.top = `${0}px`;
        tooltip.classList.add('active');
      })
      .on('mouseout', function () {
        //Bring back all blobs
        d3.selectAll('.radar-area').transition().duration(200).style('fill-opacity', opacityArea);
        tooltip.classList.remove('active');
      });

    //  add outline of shape
    radarWrapper
      .append('path')
      .attr('class', 'radar-stroke')
      // @ts-ignore
      .merge(radarWrapper)
      // @ts-ignore
      .attr('d', radarLineGenerator)
      .style('stroke-width', strokeWidth + 'px')
      .style('stroke', (d) =>
        d[0].state.toLocaleLowerCase() === selectedState.toLocaleLowerCase()
          ? COLOR_ACCCENT
          : (colorScale.current(d[0].state) as string)
      )
      .style('fill', 'none')
      .style('filter', 'url(#glow)');

    // add the data points
    radarWrapper
      .selectAll('.radar-cirlcle')
      .data((d) => d)
      .enter()
      .append('circle')
      .attr('class', 'radar-circle')
      //  @ts-ignore
      .merge(radarWrapper)
      .attr('r', dotRadius)
      .attr('cx', (d: { axis: string; value: number }, i: number) => {
        const axisName = d.axis;
        const scale = areValuesNormalized ? rScale : axisScaleMap[axisName];
        return scale(d.value) * Math.cos(angleSize * i - Math.PI / 2);
      })
      .attr('cy', function (d, i) {
        const axisName = d.axis;
        const scale = areValuesNormalized ? rScale : axisScaleMap[axisName];
        return scale(d.value) * Math.sin(angleSize * i - Math.PI / 2);
      })
      .style('fill', (d) =>
        d.state.toLowerCase() === selectedState.toLowerCase()
          ? COLOR_ACCCENT
          : (colorScale.current(d.state) as string)
      )
      .style('fill-opacity', 0.8);

    // Radar tooltip

    const circleWrapper = svgContent
      .selectAll('.circle-wrapper')
      .data(data)
      .join('g')
      .attr('class', 'circle-wrapper')
      .attr('transform', `translate(${svgWidth / 2}, ${svgHeight / 2})`);

    circleWrapper
      .selectAll('.invisible-circle')
      .data((d) => d)
      .join('circle')
      .attr('class', 'invisible-circle')
      .attr('r', dotRadius * 1.5)
      .attr('cx', (d: { axis: string; value: number }, i: number) => {
        const axisName = d.axis;
        const scale = areValuesNormalized ? rScale : axisScaleMap[axisName];
        return scale(d.value) * Math.cos(angleSize * i - Math.PI / 2);
      })
      .attr('cy', function (d, i) {
        const axisName = d.axis;
        const scale = areValuesNormalized ? rScale : axisScaleMap[axisName];
        return scale(d.value) * Math.sin(angleSize * i - Math.PI / 2);
      })
      .attr('fill', 'none')
      .style('pointer-events', 'all')
      .on('mouseover', function (event, d) {
        const newX = parseFloat(d3.select(this).attr('cx')) + 20;
        const newY = parseFloat(d3.select(this).attr('cy')) - 16;

        tooltip.innerHTML = `<div><span>${d.state}</span>: ${d.formatFn(d.value)}</div>`;
        tooltip.style.left = `${newX + svgWidth / 2}px`;
        tooltip.style.top = `${newY + svgHeight / 2}px`;
        tooltip.style.width = '150px';
        tooltip.classList.add('active');
      })
      .on('mouseout', function () {
        tooltip.classList.remove('active');
      });
  }, [data, selectedState]);

  function backgroundAreaTooltip(state: string, data: RadarDataEntry[]) {
    const lineItem = (entry: RadarDataEntry) => `
    <div>
      <strong>${entry.axis}:</strong>
      <span>${entry.formatFn(entry.value)}</span>
    </div>`;
    ``;
    const tableData = data.map(lineItem).toString().replaceAll('</div>,', '');
    return (
      `
      <div>
        <div class="text-center"><strong >${state}</strong></div>` +
      tableData +
      `</div>`
    );
  }

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative' }}
      className={`${id}-wrapper event-by-storm-chart position-relative d-flex flex-column justify-content-center`}
    >
      <div
        className="radar-title"
        style={{ position: 'relative', top: 0, left: 10, fontSize: '14px' }}
      >
        {title}
      </div>
      <div
        ref={wrapperRef}
        style={{ width: '100%', height: '80%', position: 'relative' }}
        className={`${id}-wrapper event-by-storm-chart position-relative`}
      >
        <svg ref={svgRef}>
          <defs>
            <clipPath id={`${id}`}>
              <rect x="0" y="0" width={innerDimension.w} height="100%" />
            </clipPath>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g className="content" clipPath={`url(#${id})`}>
            <g className="axis-grid" />
          </g>
        </svg>
        <div ref={tooltipRef} className="tooltip-ui"></div>
      </div>
    </div>
  );
};

export default RadarChart;
