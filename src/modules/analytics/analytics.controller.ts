import { Request, Response } from 'express';
import { z } from 'zod';

import { sendResponse } from '../../core/response';
import { asyncHandler } from '../../utils/async-handler';
import { getAnalyticsOverview } from './analytics.service';

const overviewQuerySchema = z
  .object({
    range: z.enum(['today', '7d', '30d', '90d', 'custom']).optional(),
    startDate: z.string().trim().optional(),
    endDate: z.string().trim().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.range === 'custom') {
      if (!value.startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Start date is required for a custom range',
          path: ['startDate'],
        });
      }

      if (!value.endDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'End date is required for a custom range',
          path: ['endDate'],
        });
      }
    }
  });

export const getOverview = asyncHandler(async (req: Request, res: Response) => {
  const query = overviewQuerySchema.parse(req.query);
  const overview = await getAnalyticsOverview(query);

  return sendResponse(res, {
    success: true,
    message: 'Analytics overview fetched successfully',
    data: overview,
  });
});
