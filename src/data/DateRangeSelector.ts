import { DateRange } from './DateRange';
import { globalDateCache } from '../helpers/date-cache';
import dayjs from 'dayjs';
import * as zod from 'zod';

export const dateStringRegex = /\d{4}-\d{2}-\d{2}$/;
export const dateRangeStringRegex = /\d{4}-\d{2}-\d{2} - \d{4}-\d{2}-\d{2}$/;
export const DateStringSchema = zod.string().regex(dateStringRegex);

export interface DateRangeSelector {
  getDateRange(): DateRange;
}

export class FixedDateRangeSelector implements DateRangeSelector {
  constructor(public dateRange: DateRange) {}

  getDateRange(): DateRange {
    return this.dateRange;
  }
}

export type SpecialDateRange = 'AllTimes' | 'Y2020' | 'Y2021' | 'Past3M' | 'Past6M';
export function isSpecialDateRange(s: unknown): s is SpecialDateRange {
  return typeof s === 'string' && ['AllTimes', 'Y2020', 'Y2021', 'Past3M', 'Past6M'].includes(s);
}

export class SpecialDateRangeSelector implements DateRangeSelector {
  constructor(public mode: SpecialDateRange) {}

  getDateRange(): DateRange {
    const monthsAgo = (n: number) =>
      globalDateCache.getDayUsingDayjs(dayjs().subtract(n, 'months').weekday(0));
    switch (this.mode) {
      case 'AllTimes':
        return { dateFrom: globalDateCache.getDay('2020-01-06') };
      case 'Y2020':
        return {
          dateFrom: globalDateCache.getDay('2020-01-06'),
          dateTo: globalDateCache.getDay('2021-01-03'),
        };
      case 'Y2021':
        return {
          dateFrom: globalDateCache.getDay('2021-01-04'),
          dateTo: globalDateCache.getDay('2022-01-03'),
        };
      case 'Past3M':
        return { dateFrom: monthsAgo(3) };
      case 'Past6M':
        return { dateFrom: monthsAgo(6) };
    }
  }
}

export const FixedDateRangeSelectorEncodedSchema = zod.object({
  dateRange: zod.object({
    dateFrom: DateStringSchema.optional(),
    dateTo: DateStringSchema.optional(),
  }),
});

export const SpecialDateRangeSelectorEncodedSchema = zod.object({
  mode: zod.enum(['AllTimes', 'Y2020', 'Y2021', 'Past3M', 'Past6M']),
});

export const DateRangeSelectorEncodedSchema = zod.union([
  FixedDateRangeSelectorEncodedSchema,
  SpecialDateRangeSelectorEncodedSchema,
]);

export function encodeDateRangeSelector(
  selector: DateRangeSelector
): zod.infer<typeof DateRangeSelectorEncodedSchema> {
  if (selector instanceof FixedDateRangeSelector) {
    return FixedDateRangeSelectorEncodedSchema.parse(selector);
  } else if (selector instanceof SpecialDateRangeSelector) {
    return SpecialDateRangeSelectorEncodedSchema.parse(selector);
  }
  throw new Error('Unexpected selector');
}

export function decodeDateRangeSelector(
  encoded: zod.infer<typeof DateRangeSelectorEncodedSchema>
): DateRangeSelector {
  if ('dateRange' in encoded) {
    return new FixedDateRangeSelector({
      dateFrom: encoded.dateRange.dateFrom ? globalDateCache.getDay(encoded.dateRange.dateFrom) : undefined,
      dateTo: encoded.dateRange.dateTo ? globalDateCache.getDay(encoded.dateRange.dateTo) : undefined,
    });
  } else {
    return new SpecialDateRangeSelector(encoded.mode);
  }
}

export function addDateRangeSelectorToUrlSearchParams(selector: DateRangeSelector, params: URLSearchParams) {
  const { dateFrom, dateTo } = selector.getDateRange();
  if (dateFrom) {
    params.set('dateFrom', dateFrom.string);
  }
  if (dateTo) {
    params.set('dateTo', dateTo.string);
  }
}

export function specialDateRangeToString(dateRange: SpecialDateRange): string {
  switch (dateRange) {
    case 'AllTimes':
      return 'All times';
    case 'Past3M':
      return 'Past 3 months';
    case 'Past6M':
      return 'Past 6 months';
    case 'Y2020':
      return '2020';
    case 'Y2021':
      return '2021';
  }
}
