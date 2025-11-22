declare module 'mammoth' {
  interface ExtractRawTextResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
    }>;
  }

  interface ExtractOptions {
    buffer: Buffer;
    styleMap?: string[];
    includeDefaultStyleMap?: boolean;
    convertImage?: (image: any) => Promise<any>;
    ignoreEmptyParagraphs?: boolean;
  }

  export function extractRawText(options: ExtractOptions): Promise<ExtractRawTextResult>;
  export function convertToHtml(options: ExtractOptions): Promise<{ value: string; messages: any[] }>;
  export function convertToMarkdown(options: ExtractOptions): Promise<{ value: string; messages: any[] }>;
}

