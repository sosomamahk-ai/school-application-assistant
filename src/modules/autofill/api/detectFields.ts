import type { NextApiRequest, NextApiResponse } from "next";

import { authenticate } from "@/utils/auth";

import { isAutofillEnabled } from "../index";
import { matchFields } from "../utils/matcher";

export async function detectFieldsHandler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (!isAutofillEnabled()) {
    return res.status(403).json({ disabled: true, message: "Autofill disabled" });
  }

  const userId = await authenticate(req).catch(() => null);

  const { domFields, domain } = req.body ?? {};
  if (!Array.isArray(domFields)) {
    return res.status(400).json({ error: "domFields must be an array" });
  }

  const matched = await matchFields(domFields, userId, domain);

  return res.json({ matched, domFields });
}

