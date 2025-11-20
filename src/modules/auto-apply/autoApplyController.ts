import { randomUUID } from "crypto";

import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import { autoApplyService } from "@/modules/auto-apply/autoApplyService";
import type { AutoApplyTemplateField } from "@/modules/auto-apply/engine/types";
import {
  TEMPLATE_CHILD_COLLECTION_KEYS,
  deserializeSchoolName,
  normalizeTemplateStructureInput,
  type TemplateNode,
} from "@/utils/templates";
import { authenticate } from "@/utils/auth";
import prisma from "@/lib/prisma";

const requestSchema = z.object({
  schoolId: z.string().min(1),
  templateId: z.string().min(1),
  userLogin: z
    .object({
      email: z.string().email().optional(),
      username: z.string().optional(),
      password: z.string().optional(),
      extra: z.record(z.string()).optional(),
    })
    .partial()
    .optional(),
});

export type AutoApplyRequestBody = z.infer<typeof requestSchema>;

export async function autoApplyController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const userId = await authenticate(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const body = requestSchema.parse(req.body);
    const template = await prisma.schoolFormTemplate.findUnique({
      where: { id: body.templateId },
    });

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    const [applicationData, profile, userAccount] = await Promise.all([
      prisma.applicationData.findUnique({
        where: {
          schoolId_userId: {
            schoolId: body.schoolId,
            userId,
          },
        },
      }),
      prisma.userProfile.findUnique({
        where: { userId },
        select: { id: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, username: true },
      }),
    ]);

    let structuredFormData: Record<string, unknown> = {};

    if (applicationData?.data && typeof applicationData.data === "object") {
      structuredFormData = applicationData.data as Record<string, unknown>;
    } else if (profile) {
      const application = await prisma.application.findFirst({
        where: { profileId: profile.id, templateId: body.templateId },
      });
      if (application?.formData && typeof application.formData === "object") {
        structuredFormData = application.formData as Record<string, unknown>;
      }
    }

    const templateStructure = normalizeTemplateStructureInput(template.fieldsData);
    const leafNodes = flattenTemplateLeaves(templateStructure);
    const templateFields = leafNodes.length
      ? leafNodes.map((node) => mapNodeToAutoApplyField(node, structuredFormData))
      : buildFieldsFromFormData(structuredFormData);
    const mergedLogin = mergeUserLogin(userAccount, body.userLogin);

    const runId = randomUUID();
    const payload = {
      schoolId: body.schoolId,
      template: {
        id: template.id,
        name: formatTemplateName(template.schoolName),
        fields: templateFields,
        metadata: {
          program: template.program,
        },
      },
      userLogin: mergedLogin,
      runId,
    };

    const result = await autoApplyService.run(payload);
    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request", details: error.errors });
    }
    console.error("autoApplyController error", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

function flattenTemplateLeaves(structure: TemplateNode[]): TemplateNode[] {
  const leaves: TemplateNode[] = [];

  const visit = (node: TemplateNode) => {
    let hasChildren = false;
    for (const key of TEMPLATE_CHILD_COLLECTION_KEYS) {
      const children = node[key];
      if (Array.isArray(children) && children.length) {
        hasChildren = true;
        children.forEach(visit);
      }
    }

    if (!hasChildren) {
      leaves.push(node);
    }
  };

  structure.forEach(visit);
  return leaves;
}

function mapNodeToAutoApplyField(
  node: TemplateNode,
  formData: Record<string, unknown>,
): AutoApplyTemplateField {
  const rawValue = formData[node.id ?? ""] ?? node.value;
  return {
    fieldId: node.id ?? randomUUID(),
    label: typeof node.label === "string" ? node.label : undefined,
    value: coerceFieldValue(rawValue),
    htmlType: inferHtmlType(node.type),
    metadata: {
      required: node.required,
      helpText: node.helpText,
      placeholder: node.placeholder,
      aiFillRule: node.aiFillRule,
      options: node.options,
      originalType: node.type,
    },
  };
}

function coerceFieldValue(value: unknown): string | string[] | boolean {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }
  return String(value);
}

function inferHtmlType(type?: string): AutoApplyTemplateField["htmlType"] {
  switch (type) {
    case "textarea":
    case "essay":
      return "textarea";
    case "select":
      return "select";
    case "radio":
      return "radio";
    case "checkbox":
      return "checkbox";
    case "date":
      return "date";
    default:
      return "text";
  }
}

function formatTemplateName(value: unknown): string {
  const name = deserializeSchoolName(value);
  if (typeof name === "string") {
    return name;
  }
  return name?.["en"] ?? Object.values(name ?? {})[0] ?? "School Application";
}

function mergeUserLogin(
  userAccount: { email: string; username: string | null } | null,
  override?: AutoApplyRequestBody["userLogin"],
) {
  if (!userAccount && !override) {
    return undefined;
  }
  return {
    email: override?.email ?? userAccount?.email,
    username: override?.username ?? userAccount?.username ?? undefined,
    password: override?.password,
    extra: override?.extra,
  };
}

function buildFieldsFromFormData(
  formData: Record<string, unknown>,
): AutoApplyTemplateField[] {
  return Object.entries(formData)
    .filter(([key]) => key !== "__structure")
    .map(([fieldId, value]) => ({
      fieldId,
      label: fieldId,
      value: coerceFieldValue(value),
      htmlType: "text" as const,
      metadata: {},
    }));
}

