// Centralizes the server-side Descope client so authentication code uses one configured instance.
import descopeSdk from '@descope/node-sdk';
import { z } from 'zod';

const descopeConfigSchema = z.object({
  DESCOPE_PROJECT_ID: z.string().min(1),
  DESCOPE_MANAGEMENT_KEY: z.string().min(1),
});

const { DESCOPE_PROJECT_ID, DESCOPE_MANAGEMENT_KEY } = descopeConfigSchema.parse(process.env);

export const descopeClient = descopeSdk({
  projectId: DESCOPE_PROJECT_ID,
  managementKey: DESCOPE_MANAGEMENT_KEY,
});
