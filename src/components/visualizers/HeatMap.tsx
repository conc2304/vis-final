import * as d3 from 'd3';
import { useState, useRef, useEffect, MutableRefObject } from 'react';
import { geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import { Feature, Geometry, FeatureCollection } from 'geojson';
import {
  GeoJsonFeatureType,
  GeoRegionUSType,
  SelectedDimensionsType,
  StateDataDimensions,
  StormDataType,
  StormEventCategoryType,
} from './data/types';
import useResizeObserver from './useResizeObserver';
import { Margin } from './types';
import {
  COLOR_GREY,
  COLOR_RANGE,
  COLOR_SERIES_TOP_3,
  COLOR_UI_PRIMARY,
  STORM_EVENT_REGIONS,
  STORM_UI_SELECT_VALUES,
  YEAR_RANGE,
} from './data/constants';
import { getFormat } from './RadarChart/WrangleRadarData';
import clickIcon from './svg/click-icon.svg';

import './HeatMap.scss';

// eslint-disable-next-line @typescript-eslint/no-var-requires
// const uuid = require('react-uuid');
type Props = {
  stormData: StormDataType[];
  margin: Margin;
  id: string;
  yearFilter: [number, number] | null;
  eventFilter: StormEventCategoryType | 'ALL';
  colorsRange?: string[];
  selectedDimension: SelectedDimensionsType;
  handleOnStateSelect?: (selectedRegion: GeoRegionUSType | 'ALL') => void;
  regionSelected: GeoRegionUSType | 'ALL';
  topStatesList: GeoRegionUSType[];
  hideHex?: boolean;
};

const HeatMap = ({
  id,
  stormData,
  margin,
  selectedDimension,
  colorsRange = COLOR_RANGE,
  yearFilter = null,
  eventFilter = null,
  regionSelected = 'ALL',
  handleOnStateSelect,
  topStatesList = [],
}: Props) => {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null); // Parent of SVG
  const dimensions = useResizeObserver(wrapperRef);
  const tooltipRef = useRef(null);

  type MyGeometry = Array<Feature<Geometry | null>> | Array<FeatureCollection> | [];
  const [geographies, setGeographies] = useState<MyGeometry>([]);
  const [isHexGrid, setIsHexGrid] = useState(false);
  const [innerDimensions, setInnerDimensions] = useState({ width: 0, height: 0 });
  const [stateIsHovered, setStateIsHovered] = useState(false);
  const [svgIsHovered, setSvgIsHovered] = useState(false);
  const [stateIsSelected, setStateIsSelected] = useState(false);
  const [coverIsActive, setCoverIsActive] = useState(true);
  const [userHasInteracted, setUserHasInteracted] = useState(false);

  const topStatesColorScale: MutableRefObject<d3.ScaleOrdinal<string, unknown, never>> = useRef();

  const wrangleData = (): StateDataDimensions[] => {
    // first, filter according to selectedTimeRange, init empty array
    let filteredData: StormDataType[] = [];

    // if there is a region or year selected
    if (yearFilter || eventFilter || regionSelected) {
      stormData.forEach((row) => {
        // if none is set default to our data's range
        const [yearMin, yearMax] = !!yearFilter ? yearFilter : [YEAR_RANGE.min, YEAR_RANGE.max];

        // if 'ALL' then the condition is true ef not then check to see if we match
        const eventConditionIsTrue = eventFilter === 'ALL' ? true : row.EVENT === eventFilter;
        const yearConditionIsTrue = yearMin <= row.YEAR && row.YEAR <= yearMax;

        if (yearConditionIsTrue && eventConditionIsTrue) {
          filteredData.push(row);
        }
      });
    } else {
      filteredData = stormData;
    }

    // prep data by state
    const stormDataByState = Array.from(
      d3.group(filteredData, (d) => d.STATE),
      ([key, value]) => ({ key, value })
    );

    // merge
    const stateData: StateDataDimensions[] = [];

    stormDataByState.forEach((state) => {
      const { key: stateName } = state;
      if (!STORM_EVENT_REGIONS.includes(stateName)) return;

      let DAMAGE_PROPERTY_EVENT_SUM = 0;
      let DEATHS_DIRECT_COUNT = 0;
      let DEATHS_INDIRECT_COUNT = 0;
      let DEATHS_TOTAL_COUNT = 0;
      let INJURIES_DIRECT_COUNT = 0;
      let TOTAL_EVENTS = 0;
      const COUNTS_BY_EVENT: Record<StormEventCategoryType, number> = {} as Record<
        StormEventCategoryType,
        number
      >;

      // sum up the totals per state
      state.value.forEach((entry: StormDataType) => {
        const eventType = entry.EVENT || 'misc';

        DAMAGE_PROPERTY_EVENT_SUM += entry.DAMAGE_PROPERTY_EVENT_SUM;
        DEATHS_DIRECT_COUNT += entry.DEATHS_DIRECT_COUNT;
        DEATHS_INDIRECT_COUNT += entry.DEATHS_INDIRECT_COUNT;
        DEATHS_TOTAL_COUNT += entry.DEATHS_DIRECT_COUNT + entry.DEATHS_INDIRECT_COUNT;
        INJURIES_DIRECT_COUNT += entry.INJURIES_DIRECT_COUNT;
        TOTAL_EVENTS += entry.EVENT_COUNT;

        if (eventType in COUNTS_BY_EVENT) {
          COUNTS_BY_EVENT[eventType] += entry.EVENT_COUNT;
        } else {
          COUNTS_BY_EVENT[eventType] = entry.EVENT_COUNT;
        }
      });

      stateData.push({
        STATE: stateName,
        DAMAGE_PROPERTY_EVENT_SUM,
        DEATHS_DIRECT_COUNT,
        DEATHS_INDIRECT_COUNT,
        DEATHS_TOTAL_COUNT,
        INJURIES_DIRECT_COUNT,
        TOTAL_EVENTS,
        COUNTS_BY_EVENT,
      });
    }); // end foreach

    return stateData;
  };

  // load geo data on init
  useEffect(() => {
    const geoDataURL = isHexGrid
      ? 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/us_states_hexgrid.geojson.json'
      : 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

    // ONINIT Callback
    d3.json(geoDataURL).then((geoData) => {
      let usaGeoFeatures;
      if (isHexGrid) {
        usaGeoFeatures = geoData['features'];
      } else {
        usaGeoFeatures = feature(
          // @ts-ignore
          geoData,
          // @ts-ignore
          geoData.objects.states
        )['features'];
      }

      setGeographies(usaGeoFeatures);
    });
  }, [isHexGrid]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);

    let stateDataDisplay: StateDataDimensions[];
    if (!!stormData) {
      stateDataDisplay = wrangleData();
    } else {
      return;
    }
    if (!geographies) return;

    // use resized dimensions
    // but fall back to getBoundingClientRect, if no dimensions yet.
    const { width: svgWidth, height: svgHeight } =
      dimensions || wrapperRef.current.getBoundingClientRect();

    svg.attr('width', svgWidth).attr('height', svgHeight);

    const [min, max] = d3.extent(stateDataDisplay, (d) => d[selectedDimension]);
    const stepSize = (max - min) / colorsRange.length;
    const metricsDomain = d3.range(min, max, stepSize);

    const colorScale = d3
      .scaleLinear()
      .domain(metricsDomain)
      // @ts-ignore
      .range(colorsRange);

    const colorSeries = COLOR_SERIES_TOP_3;
    topStatesColorScale.current = !!topStatesList
      ? d3.scaleOrdinal().range(colorSeries).domain(topStatesList)
      : null;

    const innerWidth = svgWidth - margin.left - margin.right;
    const innerHeight = svgHeight - margin.top - margin.bottom;
    setInnerDimensions({
      width: innerWidth,
      height: innerHeight,
    });
    // End additions

    const svgContent = svg
      .select('.content')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const translationValues: [number, number] = isHexGrid
      ? [920, svgHeight]
      : [svgWidth / 2 + 20, svgHeight / 2 - 35];
    const projectionFn = isHexGrid ? d3.geoMercator : d3.geoAlbersUsa;
    const scale = svgHeight * 1.5;
    const projection = projectionFn()
      .translate([920, svgHeight])
      .translate(translationValues)
      .scale(isHexGrid ? 350 : scale);

    // Map Legend
    const linearGradient = d3.select('#linear-gradient');

    linearGradient
      .selectAll('stop')
      .data(colorScale.range())
      .enter()
      .append('stop')
      .attr('offset', (d, i) => i / (colorScale.range().length - 1))
      .attr('stop-color', (d) => d);

    const legendWidth = svgWidth / 2;
    const legendHeight = 10;
    d3.select('#legend-rect')
      .attr('height', legendHeight)
      .attr('width', legendWidth)
      .attr('x', svgWidth / 2 - legendWidth / 2)
      .attr('y', svgHeight * 0.9);

    const legendScale = d3
      .scaleLinear()
      .domain([0, [...metricsDomain].pop()])
      .range([0, legendWidth]);

    d3.select('#legend-title').attr(
      'transform',
      `translate(${svgWidth / 2}, ${svgHeight * 0.9 - legendHeight * 1.2})`
    );

    const tickValues = [0, ...[...metricsDomain].slice(1)].map((value, i, arr) =>
      i < arr.length - 1 && value > 1000 ? Math.ceil(value / 1000) * 1000 : value
    );

    const legendAxis = d3
      .axisBottom(legendScale)
      .tickSize(7)
      .tickValues(tickValues)
      .tickFormat(
        getFormat({
          value: metricsDomain[1],
          isMoney: selectedDimension === 'DAMAGE_PROPERTY_EVENT_SUM',
        })
      );

    svg
      .select('.legend-axis')
      .attr(
        'transform',
        `translate(${svgWidth / 2 - legendWidth / 2}, ${svgHeight * 0.9 + legendHeight + 0.5})`
      )
      // @ts-ignore
      .call(legendAxis);

    const pathGenerator = geoPath().projection(projection);

    const statePaths = svgContent

      .selectAll('.state')
      // @ts-ignore
      .data(geographies)
      .join('path')
      .classed('state', true)
      .classed('top-state',(d) =>{
        const stateName: GeoRegionUSType = d.properties.name.toUpperCase() || '';
        const isTopState = topStatesList.includes(stateName);
        return isTopState
      } )
      .classed('invalid-state', (feature) => getFillColor(feature, stateDataDisplay) === COLOR_GREY);

    statePaths
      .transition()
      .duration(500)
      .attr('fill', (feature) => getFillColor(feature, stateDataDisplay))
      .attr('d', pathGenerator);

    statePaths.on('click', onStateClick);
    statePaths.on('mouseenter', onStateHover);
    statePaths.on('mousemove', onStateMove);
    statePaths.on('mouseout', onStateExit);
    svg.on('click', onCountryClick);
    svg.on('mouseenter', onSvgHover);
    svg.on('mouseout', onSvgExit);

    // Internal Functions
    function getFillColor(d: GeoJsonFeatureType, stateData: StateDataDimensions[]) {
      const stateVar = isHexGrid ? 'google_name' : 'name';
      const { [stateVar]: name } = d.properties;
      const cleanedName = (name as string).replace('(United States)', '').trim();
      const stateName = cleanedName as GeoRegionUSType;
      const stateInfo = getStateInfoByStateName(stateName, stateData);

      if (stateInfo) return colorScale(stateInfo[selectedDimension]);
      return COLOR_GREY;
    }

    function getStateInfoByStateName(
      stateName: GeoRegionUSType,
      statedData: StateDataDimensions[]
    ) {
      for (const localData of statedData) {
        if (localData.STATE.toLowerCase() === stateName.toLowerCase()) return localData;
      }
      return null;
    }
  }, [
    yearFilter,
    eventFilter,
    selectedDimension,
    regionSelected,
    stormData,
    geographies,
    topStatesList,
  ]);

  const handleOnMapViewToggle = () => {
    setIsHexGrid(!isHexGrid);
  };

  function onStateClick(e: MouseEvent, d: GeoJsonFeatureType) {
    e.stopPropagation();

    const stateVar = isHexGrid ? 'google_name' : 'name';
    const { [stateVar]: name } = d.properties;
    const cleanedName = (name as string).replace('(United States)', '').trim();
    const stateName = cleanedName as GeoRegionUSType;

    // clicking on the same state again unselects its
    if (stateName.toLowerCase() === regionSelected.toLowerCase()) {
      document.querySelectorAll('path.state').forEach((elem) => {
        elem.classList.remove('selected');
        elem.classList.remove('unselected');
      });

      handleOnStateSelect('ALL');
      setStateIsSelected(false);
    } else {
      document.querySelectorAll('path.state').forEach((elem) => {
        elem.classList.remove('selected');
        elem.classList.add('unselected');
      });

      this.classList.remove('unselected');
      this.classList.add('selected');

      handleOnStateSelect(stateName);
      setStateIsSelected(true);
      setUserHasInteracted(true);
    }
  }

  function onCountryClick() {
    document.querySelectorAll('path.state').forEach((elem) => {
      elem.classList.remove('selected');
      elem.classList.remove('unselected');
    });

    setStateIsSelected(false);
    handleOnStateSelect('ALL');
  }

  function onStateHover(e: MouseEvent, d: GeoJsonFeatureType) {
    e.stopPropagation();
    setStateIsHovered(true);
    setSvgIsHovered(true);

    showTooltipData(e, d);
  }

  function onStateMove(e: MouseEvent) {
    const xPos = e.offsetX + 15;
    const yPos = e.offsetY;

    const tooltip = tooltipRef.current;
    const { width, height } = tooltip.getBoundingClientRect();

    tooltip.style.left = `${xPos - width - 25}px`;
    tooltip.style.top = `${yPos - height}px`;
  }

  const showTooltipData = (e: MouseEvent, d: GeoJsonFeatureType) => {
    const stateVar = isHexGrid ? 'google_name' : 'name';
    const { [stateVar]: name } = d.properties;
    const cleanedName = (name as string).replace('(United States)', '').trim();
    const stateName = cleanedName as GeoRegionUSType;
    const xPos = e.offsetX;
    const yPos = e.offsetY;

    const tooltip = tooltipRef.current;

    tooltip.innerHTML = `<div>${stateName}<div>`;
    const { width, height } = tooltip.getBoundingClientRect();
    tooltip.style.left = `${xPos - width - 25}px`;
    tooltip.style.top = `${yPos - height}px`;
    tooltip.classList.add('active');
  };

  const hideTooltipData = () => {
    const tooltip = tooltipRef.current;
    tooltip.classList.remove('active');
  };

  function onStateExit(e: MouseEvent, d: GeoJsonFeatureType) {
    e.stopPropagation();
    setStateIsHovered(false);
    setSvgIsHovered(true);

    hideTooltipData();
  }

  function onSvgHover(e: MouseEvent, d: GeoJsonFeatureType) {
    setSvgIsHovered(true);
  }

  function onSvgExit(e: MouseEvent, d: GeoJsonFeatureType) {
    setSvgIsHovered(false);
  }

  return (
    <div
      ref={wrapperRef}
      style={{ width: '100%', height: '100%', position: 'relative' }}
      className={`${id}-wrapper heatmap-chart-wrapper`}
      onMouseLeave={() => {
        if (!userHasInteracted) setCoverIsActive(true);
      }}
    >
      <div
        className={`map-cover ${coverIsActive && !!stormData ? 'active' : 'inactive'}`}
        onMouseEnter={() => {
          setCoverIsActive(false);
        }}
        style={{
          width: innerDimensions.width,
          height: innerDimensions.height,
          left: margin.right - 2,
        }}
      >
        <div className="cover-text">
          <p className="welcome">
            <strong>WELCOME</strong>
          </p>

          <p>
            Explore Severe Weather Events in the USA
            <br />
            Click on any US State to begin.
          </p>
          <div className="icon-wrapper">
            <img src={clickIcon} className="icon" />
          </div>
        </div>
      </div>

      <svg
        ref={svgRef}
        className={`heatmap ${stateIsSelected && svgIsHovered && !stateIsHovered ? 'hover' : ''}`}
      >
        <defs>
          <linearGradient id="linear-gradient"></linearGradient>
        </defs>

        <g className="content"></g>
        <g className="legend-group">
          <rect id="legend-rect" style={{ fill: 'url("#linear-gradient")' }} />
          <text
            id="legend-title"
            style={{ textAnchor: 'middle', fill: COLOR_UI_PRIMARY, fontSize: 14 }}
          >
            {
              STORM_UI_SELECT_VALUES.find(
                (elem) => elem.value.toLowerCase() === selectedDimension.toLowerCase()
              ).label
            }
          </text>
          <g className="legend-axis axis" />
        </g>
      </svg>
      {/* {!hideHex && (
        <FormControlLabel
          style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)' }}
          label={`Switch To ${isHexGrid ? 'Map' : 'Hex Grid'} View`}
          control={<Switch checked={isHexGrid} onChange={handleOnMapViewToggle} size="small" />}
        />
      )} */}

      <div ref={tooltipRef} className="tooltip-ui"></div>
    </div>
  );
};

export default HeatMap;
