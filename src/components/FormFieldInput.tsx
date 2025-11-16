import { FormField } from '@/types';

interface FormFieldInputProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
}

export default function FormFieldInput({ field, value, onChange }: FormFieldInputProps) {
  const renderInput = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <input
            type={field.type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            maxLength={field.maxLength}
            className="input-field"
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            className="input-field"
          />
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            className="input-field"
          >
            <option value="">Select an option</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'textarea':
      case 'essay':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            maxLength={field.maxLength}
            rows={field.type === 'essay' ? 12 : 4}
            className="input-field resize-y"
          />
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            maxLength={field.maxLength}
            className="input-field"
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </span>
      </label>
      
      {field.helpText && (
        <p className="text-sm text-gray-600">{field.helpText}</p>
      )}
      
      {renderInput()}
      
      {field.maxLength && value && (
        <div className="text-right text-sm text-gray-500">
          {value.length} / {field.maxLength} characters
        </div>
      )}
    </div>
  );
}

