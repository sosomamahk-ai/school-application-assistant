import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticate } from '@/utils/auth';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = await authenticate(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { applicationId } = req.query;
    const format = (req.query.format as string) || 'json';

    // Fetch application with related data
    const application = await prisma.application.findUnique({
      where: { id: applicationId as string },
      include: {
        template: true,
        profile: {
          include: {
            user: {
              select: {
                email: true
              }
            }
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Check ownership
    if (application.profile.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const formData = application.formData as any;
    const fieldsData = application.template.fieldsData as any[];

    // Build export data
    const exportData = {
      school: application.template.schoolName,
      program: application.template.program,
      applicant: {
        name: application.profile.fullName,
        email: application.profile.user.email,
        phone: application.profile.phone,
      },
      submittedAt: application.submittedAt,
      status: application.status,
      formData: formData,
    };

    // Handle different export formats
    switch (format.toLowerCase()) {
      case 'json':
        res.setHeader('Content-Type', 'application/json');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${application.template.schoolId}-application.json"`
        );
        return res.status(200).json(exportData);

      case 'txt':
        const txtContent = generateTextFormat(exportData, fieldsData);
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${application.template.schoolId}-application.txt"`
        );
        return res.status(200).send(txtContent);

      case 'html':
        const htmlContent = generateHTMLFormat(exportData, fieldsData);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${application.template.schoolId}-application.html"`
        );
        return res.status(200).send(htmlContent);

      default:
        return res.status(400).json({ error: 'Unsupported format' });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
}

function generateTextFormat(data: any, fields: any[]): string {
  let content = '';
  
  content += `==========================================\n`;
  content += `学校申请表\n`;
  content += `==========================================\n\n`;
  
  content += `学校: ${data.school}\n`;
  content += `项目: ${data.program}\n\n`;
  
  content += `申请人信息:\n`;
  content += `姓名: ${data.applicant.name || 'N/A'}\n`;
  content += `邮箱: ${data.applicant.email || 'N/A'}\n`;
  content += `电话: ${data.applicant.phone || 'N/A'}\n\n`;
  
  content += `申请状态: ${data.status}\n`;
  if (data.submittedAt) {
    content += `提交时间: ${new Date(data.submittedAt).toLocaleString('zh-CN')}\n`;
  }
  content += `\n==========================================\n\n`;
  
  // Add form fields
  if (fields && Array.isArray(fields)) {
    fields.forEach((field: any) => {
      if (field.type === 'section') {
        content += `\n【${field.label}】\n`;
        content += `${'='.repeat(40)}\n`;
        if (field.fields && Array.isArray(field.fields)) {
          field.fields.forEach((subField: any) => {
            const value = data.formData[subField.id] || '';
            content += `\n${subField.label}:\n${value}\n`;
          });
        }
      } else {
        const value = data.formData[field.id] || '';
        content += `\n${field.label}:\n${value}\n`;
      }
    });
  }
  
  return content;
}

function generateHTMLFormat(data: any, fields: any[]): string {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.school} - 申请表</title>
    <style>
        body {
            font-family: "Microsoft YaHei", Arial, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #1e40af;
            margin-bottom: 10px;
        }
        .header .subtitle {
            color: #6b7280;
            font-size: 18px;
        }
        .info-section {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .info-row {
            margin-bottom: 10px;
        }
        .info-label {
            font-weight: bold;
            color: #374151;
            display: inline-block;
            width: 100px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            background: #2563eb;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
        }
        .field {
            margin-bottom: 20px;
            padding: 15px;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 5px;
        }
        .field-label {
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 8px;
            font-size: 16px;
        }
        .field-value {
            color: #4b5563;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            color: #9ca3af;
            font-size: 14px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
        @media print {
            body {
                margin: 0;
                padding: 20px;
            }
            .header {
                page-break-after: avoid;
            }
            .section {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${data.school}</h1>
        <div class="subtitle">${data.program}</div>
    </div>
    
    <div class="info-section">
        <div class="info-row">
            <span class="info-label">申请人:</span>
            <span>${data.applicant.name || 'N/A'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">邮箱:</span>
            <span>${data.applicant.email || 'N/A'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">电话:</span>
            <span>${data.applicant.phone || 'N/A'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">状态:</span>
            <span>${data.status}</span>
        </div>
        ${data.submittedAt ? `
        <div class="info-row">
            <span class="info-label">提交时间:</span>
            <span>${new Date(data.submittedAt).toLocaleString('zh-CN')}</span>
        </div>
        ` : ''}
    </div>
    
    ${generateHTMLFields(fields, data.formData)}
    
    <div class="footer">
        <p>此申请表由学校申请助手系统生成</p>
        <p>生成时间: ${new Date().toLocaleString('zh-CN')}</p>
    </div>
</body>
</html>
  `;
}

function generateHTMLFields(fields: any[], formData: any): string {
  if (!fields || !Array.isArray(fields)) return '';
  
  let html = '';
  
  fields.forEach((field: any) => {
    if (field.type === 'section') {
      html += `<div class="section">`;
      html += `<div class="section-title">${field.label}</div>`;
      if (field.fields && Array.isArray(field.fields)) {
        field.fields.forEach((subField: any) => {
          const value = formData[subField.id] || '（未填写）';
          html += `
            <div class="field">
              <div class="field-label">${subField.label}</div>
              <div class="field-value">${escapeHtml(String(value))}</div>
            </div>
          `;
        });
      }
      html += `</div>`;
    } else {
      const value = formData[field.id] || '（未填写）';
      html += `
        <div class="field">
          <div class="field-label">${field.label}</div>
          <div class="field-value">${escapeHtml(String(value))}</div>
        </div>
      `;
    }
  });
  
  return html;
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

