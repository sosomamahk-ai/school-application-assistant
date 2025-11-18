import { useEffect, useMemo, useState } from 'react';

type FieldKind = 'text' | 'textarea' | 'select' | 'checkbox' | 'date' | 'number';

export interface ApplicationField {
  id: string;
  label: string;
  type: FieldKind;
  value: string | number | boolean | null;
  options?: Array<{ label: string; value: string }>;
}

export interface ApplicationTab {
  id: string;
  title: string;
  fields: ApplicationField[];
}

export interface ApplicationFormState {
  id: string;
  name: string;
  tabs: ApplicationTab[];
}

interface ApplicationFormProps {
  application: ApplicationFormState;
  onApplicationChange?: (nextApplication: ApplicationFormState) => void;
}

export default function ApplicationForm({ application, onApplicationChange }: ApplicationFormProps) {
  const [currentApp, setCurrentApp] = useState<ApplicationFormState>(application);
  const [activeTabId, setActiveTabId] = useState<string>(() => application.tabs[0]?.id ?? '');

  useEffect(() => {
    setCurrentApp(application);
    if (!application.tabs.some((tab) => tab.id === activeTabId)) {
      setActiveTabId(application.tabs[0]?.id ?? '');
    }
  }, [application, activeTabId]);

  const activeTab = useMemo<ApplicationTab | undefined>(
    () => currentApp.tabs.find((tab) => tab.id === activeTabId && tab.fields.length > 0),
    [currentApp.tabs, activeTabId]
  );

  const handleFieldChange = (tabId: string, fieldId: string, nextValue: string | number | boolean) => {
    setCurrentApp((previous) => {
      const updatedTabs = previous.tabs.map((tab) => {
        if (tab.id !== tabId) {
          return tab;
        }

        const updatedFields = tab.fields.map((field) =>
          field.id === fieldId ? { ...field, value: nextValue } : field
        );

        return { ...tab, fields: updatedFields };
      });

      const nextApplication: ApplicationFormState = { ...previous, tabs: updatedTabs };
      onApplicationChange?.(nextApplication);
      return nextApplication;
    });
  };

  const renderFieldInput = (tabId: string, field: ApplicationField) => {
    const baseClass =
      'w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500';

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={field.id}
            name={field.id}
            value={typeof field.value === 'string' ? field.value : ''}
            rows={4}
            onChange={(event) => handleFieldChange(tabId, field.id, event.currentTarget.value)}
            className={baseClass}
          />
        );
      case 'select':
        return (
          <select
            id={field.id}
            name={field.id}
            value={typeof field.value === 'string' ? field.value : ''}
            onChange={(event) => handleFieldChange(tabId, field.id, event.currentTarget.value)}
            className={baseClass}
          >
            <option value="">请选择</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'checkbox':
        return (
          <input
            id={field.id}
            name={field.id}
            type="checkbox"
            checked={Boolean(field.value)}
            onChange={(event) => handleFieldChange(tabId, field.id, event.currentTarget.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        );
      case 'date':
        return (
          <input
            id={field.id}
            name={field.id}
            type="date"
            value={typeof field.value === 'string' ? field.value : ''}
            onChange={(event) => handleFieldChange(tabId, field.id, event.currentTarget.value)}
            className={baseClass}
          />
        );
      case 'number':
        return (
          <input
            id={field.id}
            name={field.id}
            type="number"
            value={typeof field.value === 'number' ? field.value : ''}
            onChange={(event) => handleFieldChange(tabId, field.id, Number(event.currentTarget.value))}
            className={baseClass}
          />
        );
      case 'text':
      default:
        return (
          <input
            id={field.id}
            name={field.id}
            type="text"
            value={typeof field.value === 'string' ? field.value : ''}
            onChange={(event) => handleFieldChange(tabId, field.id, event.currentTarget.value)}
            className={baseClass}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">{currentApp.name}</h1>
      </header>

      {currentApp.tabs.length > 0 && (
        <nav className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
          {currentApp.tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTabId(tab.id)}
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                tab.id === activeTabId
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.title}
            </button>
          ))}
        </nav>
      )}

      {activeTab && (
        <section className="space-y-6">
          {activeTab.fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <label htmlFor={field.id} className="block text-sm font-medium text-gray-700">
                {field.label}
              </label>
              {renderFieldInput(activeTab.id, field)}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

