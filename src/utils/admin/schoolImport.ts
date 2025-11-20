export type ParseIssue = {
  line: number;
  message: string;
};

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

const DETECTABLE_DELIMITERS: Array<{ value: string; type: 'char' | 'regex' }> = [
  { value: '\t', type: 'char' },
  { value: ',', type: 'char' },
  { value: ';', type: 'char' },
  { value: '|', type: 'char' },
  { value: '\\s{2,}', type: 'regex' }
];

const splitWithDelimiter = (line: string, delimiter: { value: string; type: 'char' | 'regex' }): string[] => {
  if (delimiter.type === 'char') {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        const isEscapedQuote = line[i + 1] === '"';
        if (isEscapedQuote) {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === delimiter.value && !inQuotes) {
        cells.push(current);
        current = '';
        continue;
      }

      current += char;
    }

    cells.push(current);
    return cells;
  }

  return line.split(new RegExp(delimiter.value));
};

const detectDelimiter = (line: string): { value: string; type: 'char' | 'regex' } => {
  let best = DETECTABLE_DELIMITERS[0];
  let bestCount = 0;

  DETECTABLE_DELIMITERS.forEach((candidate) => {
    const count =
      candidate.type === 'char'
        ? line.split(candidate.value).length - 1
        : line.split(new RegExp(candidate.value)).length - 1;
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  });

  return bestCount > 0 ? best : { value: '\t', type: 'char' };
};

const splitMultiValue = (value: string) =>
  value
    .split(/[\n;,，；]+/)
    .map((item) => item.trim())
    .filter(Boolean);

export function parsePastedTable(text: string): { rows: AdminSchoolPayload[]; headers: string[]; issues: ParseIssue[] } {
  const sanitized = text.replace(/\r/g, '');
  const rawLines = sanitized.split('\n');
  const issues: ParseIssue[] = [];

  const firstDataLineIndex = rawLines.findIndex((line) => line.trim().length > 0);
  if (firstDataLineIndex === -1) {
    issues.push({ line: 1, message: '未检测到任何有效数据，请确认已粘贴内容。' });
    return { rows: [], headers: [], issues };
  }

  const headerLine = rawLines[firstDataLineIndex];
  const delimiter = detectDelimiter(headerLine);
  const rawHeaders = splitWithDelimiter(headerLine, delimiter).map((header) => header.replace(/^\uFEFF/, '').trim());
  const normalizedHeaders = rawHeaders.map((header) => FIELD_ALIASES[normalizeHeader(header)] ?? null);

  if (!normalizedHeaders.includes('templateId')) {
    issues.push({ line: firstDataLineIndex + 1, message: '未找到模板ID列，请添加“模板”或“模板ID”列。' });
  }

  const rows: AdminSchoolPayload[] = [];

  for (let i = firstDataLineIndex + 1; i < rawLines.length; i += 1) {
    const originalLine = rawLines[i];
    if (!originalLine || !originalLine.trim()) continue;

    const cells = splitWithDelimiter(originalLine, delimiter);
    if (cells.every((cell) => !cell.trim())) continue;

    const payload: Partial<AdminSchoolPayload> = {};
    cells.forEach((cell, idx) => {
      const key = normalizedHeaders[idx];
      if (!key) return;
      const value = cell.trim();
      if (!value) return;

      if (key === 'requirements' || key === 'requiredDocuments') {
        const parsed = splitMultiValue(value);
        if (parsed.length) {
          payload[key] = parsed;
        }
      } else {
        payload[key] = value;
      }
    });

    if (!payload.templateId) {
      issues.push({ line: i + 1, message: '缺少模板ID，已跳过该行。' });
      continue;
    }

    rows.push(payload as AdminSchoolPayload);
  }

  if (rows.length === 0 && issues.length === 0) {
    issues.push({
      line: firstDataLineIndex + 1,
      message: '解析完成，但没有任何行包含有效的模板ID。'
    });
  }

  return { rows, headers: rawHeaders, issues };
}


