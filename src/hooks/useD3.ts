import * as d3 from 'd3';
import { useEffect, useRef } from 'react';

export const useD3 = (renderChartFn, dependencies) => {
  const ref = useRef();
  console.log(ref)

  useEffect(() => {
    renderChartFn(d3.select(ref.current));
    return () => {};
  }, dependencies);
  return ref;
};
