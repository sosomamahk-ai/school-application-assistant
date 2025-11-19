import { useEffect, useMemo, useState, useRef } from 'react';

type FieldKind = 'text' | 'textarea' | 'select' | 'checkbox' | 'date' | 'number';

export interface ApplicationField {
  id: string;
  label: string;
  type: FieldKind;
  value: string | number | boolean | null;
  options?: Array<{ label: string; value: string }>;
  required?: boolean;
  helpText?: string;
  placeholder?: string;
  aiFillRule?: string;
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
  onFieldFocus?: (field: ApplicationField) => void;
}

export default function ApplicationForm({ application, onApplicationChange, onFieldFocus }: ApplicationFormProps) {
  const [currentApp, setCurrentApp] = useState<ApplicationFormState>(application);
  const [activeTabId, setActiveTabId] = useState<string>(() => application.tabs[0]?.id ?? '');
  const activeTabIdRef = useRef(activeTabId);

  // Keep ref in sync with state
  useEffect(() => {
    activeTabIdRef.current = activeTabId;
  }, [activeTabId]);

  useEffect(() => {
    setCurrentApp(application);
    // Reset activeTabId if current tab no longer exists
    if (application.tabs.length > 0 && !application.tabs.some((tab) => tab.id === activeTabIdRef.current)) {
      setActiveTabId(application.tabs[0]?.id ?? '');
    }
  }, [application]);

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

  const handleClearTabContent = (tabId: string) => {
    const targetTab = currentApp.tabs.find((tab) => tab.id === tabId);
    if (!targetTab) {
      return;
    }

    const confirmed = window.confirm('确定删除当前页面的全部内容吗？该操作不可撤销。');
    if (!confirmed) {
      return;
    }

    setCurrentApp((previous) => {
      const updatedTabs = previous.tabs.map((tab) => {
        if (tab.id !== tabId) {
          return tab;
        }

        const clearedFields = tab.fields.map((field) => {
          const emptyValue =
            field.type === 'checkbox' ? false : field.type === 'number' ? null : '';
          return { ...field, value: emptyValue };
        });

        return { ...tab, fields: clearedFields };
      });

      const nextApplication: ApplicationFormState = { ...previous, tabs: updatedTabs };
      onApplicationChange?.(nextApplication);
      return nextApplication;
    });
  };

  const renderFieldInput = (tabId: string, field: ApplicationField) => {
    const notifyFocus = () => {
      onFieldFocus?.(field);
    };
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
            placeholder={field.placeholder}
            onFocus={notifyFocus}
          />
        );
      case 'select':
        return (
          <select
            id={field.id}
            name={field.id}
            value={typeof field.value === 'string' ? field.value : ''}
            onChange={(event) => handleFieldChange(tabId, field.id, event.currentTarget.value)}
            onFocus={notifyFocus}
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
            onFocus={notifyFocus}
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
            onFocus={notifyFocus}
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
            onFocus={notifyFocus}
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
            placeholder={field.placeholder}
            onFocus={notifyFocus}
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
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>如需移除该页面内容，可点击右侧按钮，清空后可重新填写。</span>
          <button
            type="button"
            onClick={() => handleClearTabContent(activeTab.id)}
            className="rounded-md border border-red-200 px-3 py-1 text-red-600 hover:bg-red-100"
          >
            删除此页面内容
          </button>
        </div>
      )}

      {activeTab && (
        <section className="space-y-6">
          {activeTab.fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <label htmlFor={field.id} className="block text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="ml-1 text-red-500">*</span>}
              </label>
              {field.helpText && <p className="text-sm text-gray-500">{field.helpText}</p>}
              {renderFieldInput(activeTab.id, field)}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

