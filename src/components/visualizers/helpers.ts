import * as d3 from 'd3';
import { YEAR_RANGE } from './data/constants';
import { GeoRegionUSType, StateDataDimensions } from './data/types';

export const fillMissingYears = (
  yearData: StateDataDimensions[],
  minYear: number,
  maxYear: number,
  stateName: GeoRegionUSType = null
) => {
  for (let year = YEAR_RANGE.min; year < minYear; year++) {
    yearData.push({
      YEAR: year,
      STATE: stateName || null,
      DAMAGE_PROPERTY_EVENT_SUM: 0,
      DEATHS_DIRECT_COUNT: 0,
      DEATHS_INDIRECT_COUNT: 0,
      DEATHS_TOTAL_COUNT: 0,
      INJURIES_DIRECT_COUNT: 0,
      TOTAL_EVENTS: 0,
    });
  }

  for (let year = maxYear; year < YEAR_RANGE.max; year++) {
    yearData.push({
      YEAR: year,
      STATE: stateName || null,
      DAMAGE_PROPERTY_EVENT_SUM: 0,
      DEATHS_DIRECT_COUNT: 0,
      DEATHS_INDIRECT_COUNT: 0,
      DEATHS_TOTAL_COUNT: 0,
      INJURIES_DIRECT_COUNT: 0,
      TOTAL_EVENTS: 0,
    });
  }
  return yearData;
};

export const ucFirst = (string: string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

export function wrap(text, width: number) {
  text.each(function () {
    const text = d3.select(this);
    const words = text.text().split(/\s+/).reverse();
    const lineHeight = 1.4; // ems
    const y = text.attr('y');
    const x = text.attr('x');
    const dy = parseFloat(text.attr('dy'));
    let tspan = text
      .text(null)
      .append('tspan')
      .attr('x', x)
      .attr('y', y)
      .attr('dy', dy + 'em');

    let word;
    let line = [];
    let lineNumber = 0;

    while ((word = words.pop())) {
      line.push(word);
      tspan.text(line.join(' '));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(' '));
        line = [word];
        tspan = text
          .append('tspan')
          .attr('x', x)
          .attr('y', y)
          .attr('dy', ++lineNumber * lineHeight + dy + 'em')
          .text(word);
      }
    }
  });
} //wrap
