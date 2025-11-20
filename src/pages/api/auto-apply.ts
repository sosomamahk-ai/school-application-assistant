import type { NextApiRequest, NextApiResponse } from "next";

import { autoApplyController } from "@/modules/auto-apply/autoApplyController";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return autoApplyController(req, res);
}

