import * as d3 from 'd3';
import { useEffect, useState, useRef } from 'react';
import set from 'lodash.set';
import { Margin } from './types';
import useResizeObserver from './useResizeObserver';
import { COLOR_ACCCENT, COLOR_UI_PRIMARY } from './data/constants';

type RadarData = Array<{ axis: string; value: number }[]>;

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
};

const RadarChart = ({
  data,
  id,
  margin = { top: 20, right: 20, bottom: 20, left: 20 }, //The margins of the SVG
  levels = 3, //How many levels or inner circles should there be drawn
  labelFactor = 1.25, //How much farther than the radius of the outer circle should the labels be placed
  wrapWidth = 60, //The number of pixels after which a label needs to be given a new line
  opacityArea = 0.15, //The opacity of the area of the blob
  dotRadius = 4, //The size of the colored circles of each blog
  opacityCircles = 0.1, //The opacity of the circles of each blob
  strokeWidth = 2, //The width of the stroke around each blob
  roundStrokes = false, //If true the area and stroke will follow a round path (cardinal-closed)
  color = d3.schemeCategory10, //Color function
  lineType = 'linear',
}: Props) => {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null); // Parent of SVG
  const dimensions = useResizeObserver(wrapperRef);
  const [innerDimension, setInnerDimensions] = useState({ w: 0, h: 0 });

  let displayData = [];

  const wrangleData = () => {
    return [
      [
        //iPhone
        { axis: 'Battery', value: 0.22 },
        { axis: 'Brand', value: 0.28 },
        { axis: 'Contract', value: 0.29 },
        { axis: 'Design', value: 0.17 },
        { axis: 'Internet', value: 0.22 },
        { axis: 'Screen', value: 0.02 },
        { axis: 'Price', value: 0.21 },
        { axis: 'Smartphone', value: 0.5 },
      ],
      [
        //Samsung
        { axis: 'Battery', value: 0.27 },
        { axis: 'Brand', value: 0.16 },
        { axis: 'Contract', value: 0.35 },
        { axis: 'Design', value: 0.13 },
        { axis: 'Internet', value: 0.2 },
        { axis: 'Screen', value: 0.13 },
        { axis: 'Price', value: 0.35 },
        { axis: 'Smartphone', value: 0.38 },
      ],
      [
        //Nokia Smartphone
        { axis: 'Battery', value: 0.26 },
        { axis: 'Brand', value: 0.1 },
        { axis: 'Contract', value: 0.3 },
        { axis: 'Design', value: 0.14 },
        { axis: 'Internet', value: 0.22 },
        { axis: 'Screen', value: 0.04 },
        { axis: 'Price', value: 0.41 },
        { axis: 'Smartphone', value: 0.3 },
      ],
    ];
  };

  displayData = data = wrangleData();

  useEffect(() => {
    // if we dont have data yet dont renter

    if (!!data) {
      displayData = wrangleData();
    } else {
      return;
    }

    console.log('displayData');
    console.log(displayData);

    const svg = d3.select(svgRef.current);

    const { width: svgWidth, height: svgHeight } =
      dimensions || wrapperRef.current.getBoundingClientRect();
    const innerWidth = svgWidth - margin.left - margin.right;
    const innerHeight = svgHeight - margin.top - margin.bottom;
    setInnerDimensions({ w: innerWidth, h: innerHeight });

    svg.attr('width', svgWidth).attr('height', svgHeight);
    const svgContent = svg.select('.content').attr('transform', `translate(${0}, ${0})`);

    // Configure the Chart
    const axisNames = data[0].map((d) => d.axis);
    const axisQty = axisNames.length;
    const radius = Math.min(innerWidth / 2, innerHeight / 2);
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
      const axisScale = d3.scaleLinear().range([0, radius]).domain([0, axisMax]);
      set(axisScaleMap, axisName, axisScale);
    });

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

    // TODO TEXT out at the angle for each of the axis
    //Text indicating at what % each level is
    axisGrid
      .selectAll('.axisLabel')
      .data(d3.range(1, levels + 1).reverse())
      .join('text')
      .attr('class', 'axisLabel')
      .attr('x', svgWidth / 2)
      .attr('y', function (d) {
        return (-d * radius) / levels + svgHeight / 2;
      })
      .attr('dy', '2em')
      .style('font-size', '10px')
      .attr('fill', '#737373')
      .text(function (d, i) {
        // console.log('text');
        // console.log(d); // d is levels... 3,2,1
        // should be the value of that axis line
        return 'test';
        // return Format(maxValue * d/cfg.levels);
      })
      .style('text-anchor', 'middle');

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

    // const axisScale = (d) => axisScaleMap[d.axis];
    const radarLineGenerator = d3
      .lineRadial()
      .curve(lineType === 'linear' ? d3.curveLinearClosed : d3.curveCardinalClosed)
      //@ts-ignore
      .radius((d: { axis: string; value: number }) => {
        const thisScale = axisScaleMap[d.axis];
        return thisScale(d.value);
      })
      .angle((d, i) => i * angleSize);

    // add a wrapper for each item
    const radarWrapper = svgContent.selectAll('.radar-wrapper').data(data).join('radar-wrapper');

    radarWrapper.attr('transform', `translate(${svgWidth / 2}, ${svgHeight / 2})`);

    console.log(radarWrapper);

    // background of area
    radarWrapper
      .selectAll('.radar-area')
      .data(data)
      .join('path')
      .attr('class', 'radar-area')
      // @ts-ignore
      .attr('d', radarLineGenerator)
      .style('fill', COLOR_UI_PRIMARY)
      .style('fill-opacity', opacityArea)
      .on('mouseover', function (d, i) {
        //Dim all blobs
        d3.selectAll('.radar-area').transition().duration(200).style('fill-opacity', 0.1);
        //Bring back the hovered over blob
        d3.select(this).transition().duration(200).style('fill-opacity', 0.5);
      })
      .on('mouseout', function () {
        //Bring back all blobs
        d3.selectAll('.radar-area').transition().duration(200).style('fill-opacity', opacityArea);
      });

    //  add outline of shape
    radarWrapper
      .selectAll('.radar-stroke')
      .data(data)
      .join('path')
      .attr('class', 'radar-stroke')
      // @ts-ignore
      .attr('d', radarLineGenerator)
      .style('stroke-width', strokeWidth + 'px')
      .style('stroke', COLOR_UI_PRIMARY)
      .style('fill', 'none')
      .style('filter', 'url(#glow)');

    // add the data points

    radarWrapper
      .selectAll('.radar-circle')
      .data(data)
      .join('circle')
      .attr('class', 'radar-circle')
      .attr('r', dotRadius)
      .attr('test', (d, i) => {
        console.log('test');
        console.log(d, i);
        return 'test';
      })
      // .attr('cx', function (d: { axis: string; value: number }[], i) {
      //   const scale = axisScaleMap[d[i].axis];
      //   return scale(d.value) * Math.cos(angleSize * i - Math.PI / 2);
      // })
      // .attr('cy', function (d, i) {
      //   const scale = axisScaleMap[i].axis;
      //   return scale(d.value) * Math.sin(angleSize * i - Math.PI / 2);
      // })
      .style('fill', COLOR_UI_PRIMARY)
      .style('fill-opacity', 0.8);
  }, []);

  return (
    <div
      ref={wrapperRef}
      style={{ width: '100%', height: '100%', position: 'relative' }}
      className={`${id}-wrapper event-by-storm-chart`}
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
          <g className="radar-wrapper" />
        </g>
      </svg>
    </div>
  );
};

export default RadarChart;
