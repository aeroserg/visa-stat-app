import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const D3Chart: React.FC = () => {
  const chartRef = useRef(null);

  useEffect(() => {
    const svg = d3.select(chartRef.current)
      .append('svg')
      .attr('width', 500)
      .attr('height', 500);

    svg.append('circle')
      .attr('cx', 250)
      .attr('cy', 250)
      .attr('r', 100)
      .style('fill', 'blue');
  }, []);

  return <div ref={chartRef} />;
};

export default D3Chart;
