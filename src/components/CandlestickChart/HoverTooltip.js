import React, { Component } from "react";
import PropTypes from "prop-types";
import GenericComponent from "react-stockcharts/lib/GenericComponent";
import { sum } from "d3-array";

import { first, last, isNotDefined, isDefined, hexToRGBA } from "react-stockcharts/lib/utils";

class HoverTooltip extends Component {
  constructor(props) {
    super(props);
    this.renderSVG = this.renderSVG.bind(this);
    this.drawOnCanvas = this.drawOnCanvas.bind(this);
  }
  drawOnCanvas(ctx, moreProps) {
   
    const pointer = helper(this.props, moreProps, ctx);
    const { height } = moreProps;

    if (isNotDefined(pointer)) return null;
    drawOnCanvas(ctx, this.props, this.context, pointer, height, moreProps);
  }
  render() {
    return <GenericComponent
      svgDraw={this.renderSVG}
      canvasDraw={this.drawOnCanvas}
      drawOn={["mousemove", "pan"/* , "mouseleave" */]}
    />;
  }
  renderSVG(moreProps) {
    const pointer = helper(this.props, moreProps);

    if (isNotDefined(pointer)) return null;

    const { bgFill, bgOpacity, backgroundShapeSVG, tooltipSVG } = this.props;
    const { bgheight, bgwidth } = this.props;
    const { height } = moreProps;

    const { x, y, content, centerX, pointWidth, bgSize } = pointer;

    const bgShape = isDefined(bgwidth) && isDefined(bgheight)
      ? { width: bgwidth, height: bgheight }
      : bgSize;

    return (
      <g>
        <rect x={centerX - pointWidth / 2}
          y={0}
          width={pointWidth}
          height={height}
          fill={bgFill}
          opacity={bgOpacity} />
        <g className="react-stockcharts-tooltip-content" transform={`translate(${x}, ${y})`}>
          {backgroundShapeSVG(this.props, bgShape)}
          {tooltipSVG(this.props, content)}
        </g>
      </g>
    );
  }
}

HoverTooltip.propTypes = {
  chartId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  yAccessor: PropTypes.func,
  tooltipSVG: PropTypes.func,
  backgroundShapeSVG: PropTypes.func,
  bgwidth: PropTypes.number,
  bgheight: PropTypes.number,
  bgFill: PropTypes.string.isRequired,
  bgOpacity: PropTypes.number.isRequired,
  tooltipContent: PropTypes.func.isRequired,
  origin: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.func
  ]).isRequired,
  fontFamily: PropTypes.string,
  fontSize: PropTypes.number,
};

HoverTooltip.contextTypes = {
  margin: PropTypes.object.isRequired,
  ratio: PropTypes.number.isRequired,
};

HoverTooltip.defaultProps = {
  // bgwidth: 150,
  // bgheight: 50,
  tooltipSVG: tooltipSVG,
  tooltipCanvas: tooltipCanvas,
  origin: origin,
  fill: "#2D3E50",
  bgFill: "#2D35E0",
  bgOpacity: 0.85,
  stroke: "#576573",
  fontFill: "#FFFFFF",
  opacity: 0.85,
  backgroundShapeSVG: backgroundShapeSVG,
  backgroundShapeCanvas: backgroundShapeCanvas,
  fontFamily: "Open Sans, Helvetica, Arial, sans-serif",
  fontSize: 12,
};

const PADDING = 5;
const X = 10;
const Y = 10;


/* eslint-disable react/prop-types */
function backgroundShapeSVG({ fill, stroke, opacity }, { height, width }) { 
  return <rect
    height={height}
    width={width}
    fill={fill}
    opacity={opacity}
    stroke={stroke} />;
}

function tooltipSVG({ fontFamily, fontSize, fontFill }, content) {
  const tspans = [];
  const startY = Y + fontSize * 0.9;

  for (let i = 0; i < content.y.length; i++) {
    const y = content.y[i];
    const textY = startY + (fontSize * (i + 1));

    tspans.push(<tspan key={`L-${i}`} x={X} y={textY} fill={y.stroke}>{y.label}</tspan>);
    tspans.push(<tspan key={i}>: </tspan>);
    tspans.push(<tspan key={`V-${i}`}>{y.value}</tspan>);
  }
  return <text fontFamily={fontFamily} fontSize={fontSize} fill={fontFill}>
    <tspan x={X} y={startY}>{content.x}</tspan>
    {tspans}
  </text>;
}
/* eslint-enable react/prop-types */

function drawOnCanvas(ctx, props, context, pointer, height) {

  const { margin, ratio } = context;
  const { bgFill, bgOpacity } = props;
  
  const { backgroundShapeCanvas, tooltipCanvas } = props;
  const originX = 0.5 * ratio + margin.left;
  const originY = 0.5 * ratio + margin.top;

  ctx.save();

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(ratio, ratio);

  ctx.translate(originX, originY);

  const { x, y, content, bgSize } = pointer;

  ctx.fillStyle = hexToRGBA(bgFill, bgOpacity);

  ctx.translate(x, y);
  backgroundShapeCanvas(props, bgSize, ctx);
  
  tooltipCanvas(props, content, ctx, bgSize);

  ctx.restore();
}

function backgroundShapeCanvas(props, { width, height }, ctx) {
  const { fill, stroke, opacity } = props;

  ctx.fillStyle = hexToRGBA(fill, opacity);
  ctx.strokeStyle = hexToRGBA(stroke);
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.fill();
  ctx.stroke();
}

function tooltipCanvas({ fontFamily, fontSize, fontFill, token1, token2 },
                         content, ctx, bgSize) {
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.textAlign = "left";
  ctx.fillStyle = fontFill;
  ctx.strokeStyle = '#202020';
  let imgToken1 = new Image();
  let imgToken2 = new Image();
  imgToken1.src = `${token1.logo}`;
  imgToken2.src = `${token2.logo}`;
  let imgSpacing = bgSize.width - 2*28 - 2*X; // 28 img width, left right margin
  let widthIn = ctx.measureText('in').width;
  if(imgToken1.width > 0)
    ctx.drawImage(imgToken1, X, Y, 28*imgToken1.width/imgToken1.height, 28);
  else
    ctx.fillText(token1.symbol, X, Y+(28+fontSize)/2);
  
  if(imgToken2.width > 0)
    ctx.drawImage(imgToken2, X + 28 + imgSpacing, Y, 
                  28*imgToken2.width/imgToken2.height, 28);
  else
    ctx.fillText(token2.symbol, X + 10 + imgSpacing, Y+(28+fontSize)/2);
  
  ctx.fillText('in', X + 28 + (imgSpacing-widthIn)/2, Y + (28+fontSize)/2);

  const upperLineHeight = Y + 28 + 7
  ctx.beginPath();
  ctx.moveTo(X, upperLineHeight);
  ctx.lineTo(bgSize.width-X, upperLineHeight);
  ctx.stroke();
  let startY = Y + upperLineHeight + 7; // margin at top

  for (let i = 0; i < content.y.length; i++) {
    startY += i > 0 ? (fontSize + 5) : 0;
    const y = content.y[i];
    const text_width = ctx.measureText(y.value).width
    ctx.fillText(y.label, X, startY);
    ctx.fillText(y.value, bgSize.width - X - text_width , startY);
  }

  // const lowerLineHeight = startY + fontSize * (content.y.length-1) + 6;
  startY += 6;
  ctx.beginPath();
  ctx.moveTo(X, startY);
  ctx.lineTo(bgSize.width-X, startY);
  ctx.stroke();

  const x = content.x;
  // const textY = lowerLineHeight + fontSize + 1;
  startY += fontSize + 2;
  const text_width = ctx.measureText(x).width
  ctx.fillText(x, (bgSize.width - text_width)/2, startY);
}


function calculateTooltipSize({ fontFamily, fontSize, fontFill }, content, ctx) {
  if (isNotDefined(ctx)) {
    const canvas = document.createElement("canvas");
    ctx = canvas.getContext("2d");
  }

  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = fontFill;
  ctx.textAlign = "left";

  const measureText = str => ({
    width: ctx.measureText(str).width,
    height: fontSize + 5,
  });

  const { width, height } = content.y
    .map(({ label, value }) => measureText(`${label}  ${value}`))
    // Sum all y and x sizes (begin with x label size)
    .reduce((res, size) => sumSizes(res, size), measureText(String(content.x)))
  ;

  return {
    width: width + 2 * X,
    height: height + 2 * Y + 42 
  };
}

function sumSizes(...sizes) {
  return {
    width: Math.max(...sizes.map(size => size.width)),
    height: sum(sizes, d => d.height),
  };
}

function normalizeX(x, bgSize, pointWidth, width) {
  // return x - bgSize.width - pointWidth / 2 - PADDING * 2 < 0
  return x < width / 2
    ? x + pointWidth / 2 + PADDING
    : x - bgSize.width - pointWidth / 2 - PADDING;
}

function normalizeY(y, bgSize) {
  return y - bgSize.height <= 0
    ? y + PADDING
    : y - bgSize.height - PADDING;
}

function origin(props, moreProps, bgSize, pointWidth) {
  const { chartId, yAccessor } = props;
  const { mouseXY, xAccessor, currentItem, xScale, chartConfig, width } = moreProps;
  let y = last(mouseXY);

  const xValue = xAccessor(currentItem);
  let x = Math.round(xScale(xValue));

  if (isDefined(chartId) && isDefined(yAccessor)
      && isDefined(chartConfig) && isDefined(chartConfig.findIndex)) {
    const yValue = yAccessor(currentItem);
    const chartIndex = chartConfig.findIndex(x => x.id === chartId);

    y = Math.round(chartConfig[chartIndex].yScale(yValue));
  }

  x = normalizeX(x, bgSize, pointWidth, width);
  y = normalizeY(y, bgSize);

  return [x, y];
}

function helper(props, moreProps, ctx) {
  const { show, xScale, currentItem, plotData } = moreProps;
  const { origin, tooltipContent } = props;
  const { xAccessor, displayXAccessor } = moreProps;

  if (!show || isNotDefined(currentItem)) return;

  const xValue = xAccessor(currentItem);

  if (!show || isNotDefined(xValue)) return;

  const content = tooltipContent({ currentItem, xAccessor: displayXAccessor });
  const centerX = xScale(xValue);
  const pointWidth = Math.abs(xScale(xAccessor(last(plotData))) - xScale(xAccessor(first(plotData)))) / (plotData.length - 1);

  const bgSize = calculateTooltipSize(props, content, ctx);

  const [x, y] = origin(props, moreProps, bgSize, pointWidth);

  return { x, y, content, centerX, pointWidth, bgSize };
}

export default HoverTooltip;