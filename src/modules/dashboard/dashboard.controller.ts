import { Request, Response } from 'express';
import { z } from 'zod';

import { sendResponse } from '../../core/response';
import { asyncHandler } from '../../utils/async-handler';
import { getDashboardOverview } from './dashboard.service';

const overviewQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d']).optional(),
});

export const getOverview = asyncHandler(async (req: Request, res: Response) => {
  const { period = '30d' } = overviewQuerySchema.parse(req.query);
  const overview = await getDashboardOverview(period);

  return sendResponse(res, {
    success: true,
    message: 'Dashboard overview fetched successfully',
    data: overview,
  });
});
