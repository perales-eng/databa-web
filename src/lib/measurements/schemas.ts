/**
 * Zod schemas for the polymorphic `config` JSON column on BehaviorMethod.
 *
 * Each method type has its own configuration shape. These schemas are the source
 * of truth — use parseMethodConfig() before reading/writing config in code.
 *
 * Mirrors the per-method fields from Android's BehaviorMethodEntity.
 */
import { z } from "zod";

export const FrequencyConfig = z.object({
  saveFrequency: z.boolean().default(true),
  saveTotalOccurrences: z.boolean().default(true),
  saveIRT: z.boolean().default(false),
});

export const DurationConfig = z.object({
  saveIndividualDurations: z.boolean().default(true),
  saveAverageDuration: z.boolean().default(true),
});

export const LatencyConfig = z.object({
  maxTimeSeconds: z.number().int().positive().nullable().default(null),
  saveIndividualTimes: z.boolean().default(true),
  saveAverageTime: z.boolean().default(true),
});

export const IntensityConfig = z.object({
  maxMeasurements: z.number().int().positive().nullable().default(null),
  scaleMin: z.number().default(1),
  scaleMax: z.number().default(10),
  saveIndividualValues: z.boolean().default(true),
  saveAverage: z.boolean().default(true),
});

export const OpportunityConfig = z.object({
  maxOpportunities: z.number().int().positive().nullable().default(null),
  maxTimeMinutes: z.number().int().positive().nullable().default(null),
  opportunityDescription: z.string().default(""),
  correctResponseDescription: z.string().default(""),
  saveOpportunityDetails: z.boolean().default(true),
});

export const TemporalSamplingConfig = z.object({
  samplingType: z.enum(["PARTIAL", "WHOLE", "MOMENTARY"]),
  intervalDurationSeconds: z.number().int().positive(),
  totalDurationSeconds: z.number().int().positive(),
  saveIntervalDetails: z.boolean().default(true),
  saveSummary: z.boolean().default(true),
});

export const EventSamplingConfig = z.object({
  sessionDurationMinutes: z.number().int().positive(),
  intensityScale: z.number().int().min(1).max(10).nullable().default(null),
  dataSaveType: z.enum(["INDIVIDUAL", "AVERAGE", "BOTH"]).default("BOTH"),
});

export const AnecdotalConfig = z.object({
  // Anecdóticos no requiere config — los campos van en cada registro.
});

export const ABCConfig = z.object({
  // ABC no requiere config — los campos van en cada registro.
});

export const methodConfigSchemas = {
  FREQUENCY: FrequencyConfig,
  DURATION: DurationConfig,
  LATENCY: LatencyConfig,
  INTENSITY: IntensityConfig,
  PERCENTAGE_OPPORTUNITY: OpportunityConfig,
  TEMPORAL_SAMPLING: TemporalSamplingConfig,
  EVENT_SAMPLING: EventSamplingConfig,
  ANECDOTAL: AnecdotalConfig,
  ABC: ABCConfig,
} as const;

export type MethodType = keyof typeof methodConfigSchemas;

export function parseMethodConfig<T extends MethodType>(methodType: T, raw: unknown) {
  const schema = methodConfigSchemas[methodType];
  return schema.parse(raw) as z.infer<(typeof methodConfigSchemas)[T]>;
}
