import logger from '../../config/logger';
import type { ShareSession } from '../../generated/prisma/browser';
import type { Request, Response } from 'express';
import { renderAccount } from './accountController';

export async function renderSharedFiles(
  shareSession: ShareSession,
  req: Request,
  res: Response,
) {
  req.shareSessionTemp = shareSession.id;

  await renderAccount(req, res);
  return;
}
