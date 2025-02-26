import React, { useEffect, useMemo, useState } from 'react';
import { UnifiedDay } from '../helpers/date-cache';
import { ChartAndMetricsWrapper, ChartWrapper, colors, TitleWrapper, Wrapper } from './common';
import { Area, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Metric, { MetricsWrapper } from './Metrics';
import { getTicks } from '../helpers/ticks';
import { calculateWilsonInterval } from '../helpers/wilson-interval';
import dayjs from 'dayjs';
import DownloadWrapper from './DownloadWrapper';
import { Alert, AlertVariant } from '../helpers/ui';

export type VariantTimeDistributionLineChartEntry = {
  date: UnifiedDay;
  sequenced: number;
  variantCount: number;
};

export type VariantTimeDistributionLineChartProps = {
  data: VariantTimeDistributionLineChartEntry[];
};

type PlotEntry = {
  date: Date;
  proportion: number;
  proportionCI: [number, number];
};

export function formatDate(date: number) {
  const d = new Date(date);
  return dayjs(d).format('YYYY-MM-DD');
}

const CHART_MARGIN_RIGHT = 15;

export const VariantTimeDistributionLineChartInner = React.memo(
  ({ data }: VariantTimeDistributionLineChartProps): JSX.Element => {
    const [active, setActive] = useState<PlotEntry | undefined>(undefined);

    const {
      plotData,
      ticks,
      yMax,
    }: {
      plotData: PlotEntry[];
      ticks: number[];
      yMax: number;
    } = useMemo(() => {
      const sortedData = [...data].sort((a, b) => (a.date.dayjs.isAfter(b.date.dayjs) ? 1 : -1));
      const smoothedData: VariantTimeDistributionLineChartEntry[] = [];
      for (let i = 3; i < sortedData.length - 3; i++) {
        const window = [
          sortedData[i - 3],
          sortedData[i - 2],
          sortedData[i - 1],
          sortedData[i],
          sortedData[i + 1],
          sortedData[i + 2],
          sortedData[i + 3],
        ];
        const sum = (accumulator: number, currentValue: number) => accumulator + currentValue;
        smoothedData.push({
          date: sortedData[i].date,
          sequenced: window.map(d => d.sequenced).reduce(sum) / 7,
          variantCount: window.map(d => d.variantCount).reduce(sum) / 7,
        });
      }

      const plotData: PlotEntry[] = [];
      let lastProportion = 0;
      for (let { date, sequenced, variantCount } of smoothedData) {
        if (date.dayjs.isAfter(dayjs())) {
          // We don't show values for days after today
          plotData.push({
            date: date.dayjs.toDate(),
            proportion: NaN,
            proportionCI: [NaN, NaN],
          });
          continue;
        }
        if (sequenced === 0) {
          plotData.push({
            date: date.dayjs.toDate(),
            // If we don't have data, we carry over the last available value as our "best guess". The CI is from 0 to 1.
            proportion: lastProportion,
            proportionCI: [0, 1],
          });
          continue;
        }
        lastProportion = Math.max(variantCount / sequenced, 0);
        const wilsonInterval = calculateWilsonInterval(variantCount, sequenced);
        // Math.max(..., 0) compensates for numerical inaccuracies which can lead to negative values.
        plotData.push({
          date: date.dayjs.toDate(),
          proportion: Math.max(variantCount / sequenced, 0),
          proportionCI: [Math.max(wilsonInterval[0], 0), Math.max(wilsonInterval[1], 0)],
        });
      }

      const ticks = getTicks(
        smoothedData.map(d => ({
          date: d.date.dayjs.toDate(),
        }))
      );

      // To avoid that big confidence intervals render the plot unreadable
      const yMax = Math.min(
        Math.max(...plotData.filter(d => !isNaN(d.proportion)).map(d => d.proportion * 1.5)),
        Math.max(...plotData.filter(d => !isNaN(d.proportionCI[1])).map(d => d.proportionCI[1]))
      );

      return { plotData, ticks, yMax };
    }, [data]);

    const setDefaultActive = (plotData: PlotEntry[]) => {
      if (plotData) {
        const defaultActive = plotData[plotData.length - 1];
        defaultActive !== undefined && setActive(defaultActive);
      }
    };

    useEffect(() => {
      setDefaultActive(plotData);
    }, [plotData]);

    const csvData = useMemo(() => {
      return plotData.map(({ date, proportion, proportionCI }) => ({
        date: dayjs(date).format('YYYY-MM-DD'),
        estimatedCases: proportion.toFixed(4),
        estimatedCasesCILower: proportionCI[0].toFixed(4),
        estimatedCasesCIUpper: proportionCI[1].toFixed(4),
      }));
    }, [plotData]);

    if (plotData.length === 0) {
      return <Alert variant={AlertVariant.INFO}>We do not have enough data for this plot.</Alert>;
    }

    return (
      <DownloadWrapper name='EstimatedCasesPlot' csvData={csvData}>
        <Wrapper>
          <TitleWrapper>
            Proportion of all samples
            {active !== undefined && (
              <>
                {' '}
                from <b>{formatDate(active.date.getTime() - 3 * 24 * 60 * 60 * 1000)}</b> to{' '}
                <b>{formatDate(active.date.getTime() + 3 * 24 * 60 * 60 * 1000)}</b>
              </>
            )}
          </TitleWrapper>
          <ChartAndMetricsWrapper>
            <ChartWrapper>
              <ResponsiveContainer>
                <ComposedChart
                  data={plotData}
                  margin={{ top: 6, right: CHART_MARGIN_RIGHT, left: 0, bottom: 0 }}
                >
                  <XAxis
                    dataKey='date'
                    scale='time'
                    type='number'
                    tickFormatter={formatDate}
                    domain={[(dataMin: any) => dataMin, () => plotData[plotData.length - 1].date.getTime()]}
                    ticks={ticks}
                  />
                  <YAxis
                    tickFormatter={tick => `${tick * 100}%`}
                    allowDecimals={true}
                    hide={false}
                    width={50}
                    domain={[0, yMax]}
                    allowDataOverflow={true}
                    scale='linear'
                  />
                  <Tooltip
                    active={false}
                    content={e => {
                      if (e.active && e.payload !== undefined) {
                        const newActive = e.payload[0].payload;
                        if (active === undefined || active.date.getTime() !== newActive.date.getTime()) {
                          setActive(newActive);
                        }
                      }
                      return <></>;
                    }}
                  />
                  <Area
                    type='monotone'
                    dataKey='proportionCI'
                    fill={colors.activeSecondary}
                    stroke='transparent'
                    isAnimationActive={false}
                  />
                  <Line
                    type='monotone'
                    dataKey='proportion'
                    stroke={colors.active}
                    strokeWidth={3}
                    dot={false}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartWrapper>
            <MetricsWrapper>
              <Metric
                value={active !== undefined ? (active.proportion * 100).toFixed(1) + '%' : 'NA'}
                title='Proportion'
                color={colors.active}
                helpText='Proportion relative to all samples collected (smoothed with a 7-days sliding window)'
                percent={false}
              />
              <Metric
                value={
                  active !== undefined
                    ? (active.proportionCI[0] * 100).toFixed(1) +
                      '-' +
                      (active.proportionCI[1] * 100).toFixed(1) +
                      '%'
                    : 'NA'
                }
                title='Confidence int.'
                color={colors.secondary}
                helpText='The 95% confidence interval'
                percent={false}
              />
            </MetricsWrapper>
          </ChartAndMetricsWrapper>
        </Wrapper>
      </DownloadWrapper>
    );
  }
);
