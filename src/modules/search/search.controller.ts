import { Request, Response } from 'express';
import { z } from 'zod';

import { sendResponse } from '../../core/response';
import { asyncHandler } from '../../utils/async-handler';
import { globalSearch } from './search.service';

const searchQuerySchema = z.object({
  q: z.string().trim().optional(),
});

export const getSearchResults = asyncHandler(async (req: Request, res: Response) => {
  const { q = '' } = searchQuerySchema.parse(req.query);
  const results = await globalSearch(q);

  return sendResponse(res, {
    success: true,
    message: 'Search results fetched successfully',
    data: results,
  });
});
