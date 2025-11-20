export interface TemplateOption {
  id: string;
  label: string;
}

export interface School {
  id: string;
  name: string;
  shortName: string | null;
  templateId: string;
  applicationStart?: string | null;
  applicationEnd?: string | null;
  interviewTime?: string | null;
  examTime?: string | null;
  resultTime?: string | null;
  officialLink?: string | null;
  notes?: string | null;
}


