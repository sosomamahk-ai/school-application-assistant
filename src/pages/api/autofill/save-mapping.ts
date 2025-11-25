import { prisma } from "@/lib/prisma";
import { authenticate } from "@/utils/auth";
import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = await authenticate(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { domain, selector, profileField, domId, domName } = req.body;
  if (!domain || !selector || !profileField) {
    return res
      .status(400)
      .json({ error: "domain, selector and profileField required" });
  }

  try {
    const mapping = await prisma.fieldMapping.upsert({
      where: {
        userId_domain_selector: { userId, domain, selector },
      },
      update: { profileField, domId, domName },
      create: { id: randomUUID(), userId, domain, selector, profileField, domId, domName },
    });

    return res.json({ success: true, mapping });
  } catch (err) {
    console.error("saveMapping error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

