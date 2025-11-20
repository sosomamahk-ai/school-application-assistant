const FIELD_ALIASES: Record<string, keyof AdminSchoolPayload> = {
  'school_name': 'name',
  '学校名称': 'name',
  'name': 'name',
  '简称': 'shortName',
  'shortname': 'shortName',
  '短名': 'shortName',
  'templateid': 'templateId',
  '模版id': 'templateId',
  '模版': 'templateId',
  '模板': 'templateId',
  '开始申请时间': 'applicationStart',
  'application_start': 'applicationStart',
  'start': 'applicationStart',
  '截止日期': 'applicationEnd',
  'deadline': 'applicationEnd',
  'application_end': 'applicationEnd',
  'interview_time': 'interviewTime',
  '面试时间': 'interviewTime',
  'exam_time': 'examTime',
  '笔试时间': 'examTime',
  'result_time': 'resultTime',
  '出结果时间': 'resultTime',
  'result': 'resultTime',
  'official_link': 'officialLink',
  '官网链接': 'officialLink',
  'required_documents': 'requiredDocuments',
  '申请资料': 'requiredDocuments',
  'requirements': 'requirements',
  '申请要求': 'requirements',
  '备注': 'notes',
  'notes': 'notes'
};

export type AdminSchoolPayload = {
  templateId: string;
  name?: string;
  shortName?: string;
  applicationStart?: string;
  applicationEnd?: string;
  interviewTime?: string;
  examTime?: string;
  resultTime?: string;
  officialLink?: string;
  requiredDocuments?: string[] | string;
  requirements?: string[] | string;
  notes?: string;
};

const normalizeHeader = (header: string): string =>
  header
    .trim()
    .replace(/[\s_-]+/g, '')
    .toLowerCase();

export function parsePastedTable(text: string): { rows: AdminSchoolPayload[]; headers: string[] } {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { rows: [], headers: [] };
  }

  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const rawHeaders = lines[0].split(delimiter).map((header) => header.trim());
  const normalizedHeaders = rawHeaders.map((header) => FIELD_ALIASES[normalizeHeader(header)] ?? null);

  const rows: AdminSchoolPayload[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cells = lines[i].split(delimiter);
    const payload: Partial<AdminSchoolPayload> = {};

    cells.forEach((cell, idx) => {
      const key = normalizedHeaders[idx];
      if (!key) return;
      const value = cell.trim();
      if (!value) return;

      if (key === 'requirements' || key === 'requiredDocuments') {
        payload[key] = value.split(/[\n;,，；]+/).map((item) => item.trim()).filter(Boolean);
      } else {
        payload[key] = value;
      }
    });

    if (payload.templateId) {
      rows.push(payload as AdminSchoolPayload);
    }
  }

  return { rows, headers: rawHeaders };
}


