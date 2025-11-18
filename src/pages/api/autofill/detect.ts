import type { NextApiRequest, NextApiResponse } from "next";

import { detectFieldsHandler } from "@/modules/autofill/api/detectFields";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return detectFieldsHandler(req, res);
}

