import { AsyncZodQueryEncoder } from '../helpers/query-encoder';
import * as zod from 'zod';
import { Widget } from './Widget';
import {
  decodeLocationDateVariantSelector,
  encodeLocationDateVariantSelector,
  LocationDateVariantSelectorEncodedSchema,
} from '../data/LocationDateVariantSelector';
import { HospitalizationDeathChart, HospitalizationDeathChartProps } from './HospitalizationDeathChart';
import { DetailedSampleAggDataset } from '../data/sample/DetailedSampleAggDataset';

export const HospitalizationDeathChartWidget = new Widget(
  new AsyncZodQueryEncoder(
    zod.object({
      sampleSet: LocationDateVariantSelectorEncodedSchema,
      field: zod.enum(['hospitalized', 'died']),
      extendedMetrics: zod.boolean().optional(),
      relativeToOtherVariants: zod.boolean().optional(),
    }),
    async (decoded: HospitalizationDeathChartProps) => ({
      sampleSet: encodeLocationDateVariantSelector(decoded.variantSampleSet.getSelector()),
      field: decoded.field,
      extendedMetrics: decoded.extendedMetrics,
      relativeToOtherVariants: decoded.relativeToOtherVariants,
    }),
    async (encoded, signal) => {
      const variantSelector = decodeLocationDateVariantSelector(encoded.sampleSet);
      const wholeSelector = {
        ...variantSelector,
        variant: undefined,
      };
      return {
        variantSampleSet: await DetailedSampleAggDataset.fromApi(variantSelector, signal),
        wholeSampleSet: await DetailedSampleAggDataset.fromApi(wholeSelector, signal),
        field: encoded.field,
        variantName: variantSelector.variant?.pangoLineage ?? 'unnamed variant',
        extendedMetrics: encoded.extendedMetrics,
        relativeToOtherVariants: encoded.relativeToOtherVariants,
      };
    }
  ),
  HospitalizationDeathChart,
  'HospitalizationDeathChart'
);