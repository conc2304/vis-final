import * as d3 from 'd3';
import { useRef, useEffect, useState } from 'react';
import { SelectedDimensionsType } from './data/types';
import { Margin } from './types';
import useResizeObserver from './useResizeObserver';

type Props = {
  stormData: unknown;
  margin: Margin;
  id: string;
  yearFilter: [number, number] | null;
  // selectedDimension: SelectedDimensionsType;
};

const EventsByTempScatterPlot = ({
  stormData,
  margin,
  id,
  yearFilter = null,
  // selectedDimension = null,
}: Props) => {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null); // Parent of SVG
  const dimensions = useResizeObserver(wrapperRef);
  const [innerDimension, setInnerDimensions] = useState({ w: 0, h: 0 });

  const wrangleData = () => {

    return [];
  };

  let displayData = [];



  useEffect(() => {
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

    const xScale = d3
      .scaleLinear()
      .domain()
      // @ts-ignore
      .range([0, innerWidth]);

    // END USEEFFECT
  }, [yearFilter]);

  return (
    <div ref={wrapperRef} className={`${id}-wrapper top-states-chart`}>
      <svg ref={svgRef}>
        <defs>
          <clipPath id={`${id}`}>
            <rect x="0" y="0" width={innerDimension.w} height="100%" />
          </clipPath>
        </defs>
        <g className="content" clipPath={`url(#${id})`}></g>
        <g className="x-axis axis" />
        <g className="y-axis axis" />
      </svg>
    </div>
  );
};

export default EventsByTempScatterPlot;
