import type { NextApiRequest, NextApiResponse } from "next";
import saveMappingHandler from "@/modules/autofill/api/saveMapping";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return saveMappingHandler(req, res);
}
