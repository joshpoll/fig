import _, { max, min } from 'lodash';
import React, { forwardRef } from 'react';
import { Mark, PlotContext, plotMarkReified } from '../Plot';
import { curveCatmullRom, line as d3Line } from 'd3-shape';
import { withBluefish, BBox, Measure, useBluefishLayout2 } from '../../../../bluefish';
import { NewBBox } from '../../../../NewBBox';
import { PaperScope, Point } from 'paper/dist/paper-core';
import { scaleLinear } from 'd3-scale';

export type NewLineProps<T> = Omit<
  React.SVGProps<SVGRectElement>,
  'x' | 'y' | 'fill' | 'stroke' | 'width' | 'height'
> & {
  x: keyof T;
  y: keyof T;
  color?: keyof T;
  data?: T[];
};

export const NewLine = forwardRef(function NewLine(props: NewLineProps<any>, ref: any) {
  const context = React.useContext(PlotContext);
  const data = props.data ?? context.data;
  const colorScale = context.scales.colorScale;
  console.log('colorScale', colorScale);

  return (
    <PathScale
      ref={ref}
      points={data.map((d: any) => [d[props.x], d[props.y]] as [number, number])}
      fill={'none'}
      stroke={props.color ?? 'black'}
      strokeWidth={1.5}
      strokeLinecap={'round'}
      strokeLinejoin={'round'}
      strokeMiterlimit={1}
      xScale={(width) =>
        scaleLinear(
          [min<number>(data.map((d: any) => +d[props.x]))!, max<number>(data.map((d: any) => +d[props.x]))!],
          [0, width],
        )
      }
      yScale={(height) =>
        scaleLinear(
          [min<number>(data.map((d: any) => +d[props.y]))!, max<number>(data.map((d: any) => +d[props.y]))!],
          [height, 0],
        )
      }
    />
  );
});
NewLine.displayName = 'NewLine';

export type PathProps = Omit<React.SVGProps<SVGPathElement>, 'd' | 'points'> &
  Partial<BBox> & {
    xScale: (d: any) => (y: number) => number;
    yScale: (d: any) => (y: number) => number;
    points: [number, number][];
  };

const pathMeasurePolicy = ({ points, xScale, yScale }: PathProps): Measure => {
  const canvas = document.createElement('canvas');
  const paperScope = new PaperScope();
  paperScope.setup(canvas);
  return (_measurables, constraints) => {
    const xScaleFn = xScale(constraints.width);
    const yScaleFn = yScale(constraints.height);

    const d =
      d3Line().curve(curveCatmullRom)(points.map((p) => [xScaleFn(p[0]), yScaleFn(p[1])] as [number, number])) ?? '';
    const path = new paperScope.Path(d!);

    const bounds = path.bounds;

    return {
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height,
      boundary: path /* TODO: boundary should be dependent on width & height so it can be scaled later! */,
    };
  };
};

export const PathScale = withBluefish((props: PathProps) => {
  const { points, ...rest } = props;

  const { bbox, boundary } = useBluefishLayout2({}, props, pathMeasurePolicy(props));

  return (
    <g transform={`translate(${bbox!.coord?.translate?.x ?? 0}, ${bbox!.coord?.translate?.y ?? 0})`}>
      <path {...rest} d={boundary?.pathData ?? ''} />
    </g>
  );
});
