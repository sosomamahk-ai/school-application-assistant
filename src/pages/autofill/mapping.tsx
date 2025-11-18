import { useState, useEffect } from "react";

// Chrome 扩展 API 类型声明
declare global {
  interface Window {
    chrome?: {
      tabs: {
        query: (queryInfo: { active: boolean; currentWindow: boolean }) => Promise<Array<{ id?: number }>>;
        sendMessage: (tabId: number, message: any, responseCallback?: (response: any) => void) => void;
      };
    };
  }
  
  // 全局 chrome 对象（如果存在）
  const chrome: {
    tabs?: {
      query: (queryInfo: { active: boolean; currentWindow: boolean }) => Promise<Array<{ id?: number }>>;
      sendMessage: (tabId: number, message: any, responseCallback?: (response: any) => void) => void;
    };
  } | undefined;
}

export default function MappingPage() {
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExtensionAvailable, setIsExtensionAvailable] = useState(false);

  useEffect(() => {
    // 检查是否在扩展环境中
    const checkExtension = () => {
      if (typeof window !== 'undefined' && window.chrome && window.chrome.tabs) {
        setIsExtensionAvailable(true);
      } else {
        // 使用类型断言检查全局 chrome 对象
        const globalChrome = (typeof window !== 'undefined' && (window as any).chrome) || 
                             (typeof (globalThis as any).chrome !== 'undefined' ? (globalThis as any).chrome : null);
        if (globalChrome && globalChrome.tabs) {
          setIsExtensionAvailable(true);
        }
      }
    };
    checkExtension();
  }, []);

  async function fetchScanFromActiveTab() {
    if (!isExtensionAvailable) {
      alert("Chrome extension API is not available. This page should be used within the extension context.");
      return;
    }

    setLoading(true);
    try {
      // 使用类型断言，因为我们已经检查了可用性
      const chromeApi = (window.chrome || (globalThis as any).chrome) as any;
      if (!chromeApi || !chromeApi.tabs) {
        throw new Error('Chrome API not available');
      }
      const [tab] = await chromeApi.tabs.query({ active: true, currentWindow: true });
      
      chromeApi.tabs.sendMessage(
        tab.id!,
        { action: "scan" },
        async (response: { fields: any[]; origin: string } | undefined) => {
          if (!response) {
            alert("Content script did not respond. Make sure the extension is loaded.");
            setLoading(false);
            return;
          }
          const { fields: scannedFields, origin } = response;
          const r = await fetch("/api/autofill/detect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ domFields: scannedFields, domain: origin }),
          });
          const data = await r.json();
          setFields(data.matched || []);
          setLoading(false);
        },
      );
    } catch (error) {
      console.error("Error scanning tab:", error);
      alert("Failed to scan tab. Make sure you're using this page within the extension context.");
      setLoading(false);
    }
  }

  async function saveMapping(field: any, profileField: string) {
    await fetch("/api/autofill/save-mapping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        domain: window.location.hostname,
        selector: field.selector,
        domId: field.id,
        domName: field.name,
        profileField,
      }),
    });
    alert("Saved");
  }

  if (!isExtensionAvailable) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Autofill - Field Mapping</h1>
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p className="font-bold">Chrome Extension API Not Available</p>
          <p className="mt-2">
            This page requires the Chrome extension API. Please use the extension popup or access this page from within the extension context.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Autofill - Field Mapping</h1>
      <button onClick={fetchScanFromActiveTab} className="btn-primary mb-4" disabled={loading}>
        {loading ? "Scanning..." : "Scan active tab and match"}
      </button>

      <ul>
        {fields.map((f, i) => (
          <li key={i} className="mb-3 border p-3 rounded">
            <div>
              <strong>Label:</strong> {f.label || f.name || f.selector}
            </div>
            <div>
              <strong>Auto-mapped:</strong> {f.mappedField || "—"} (confidence: {f.confidence})
            </div>
            <div className="mt-2 flex gap-2">
              <input
                placeholder="profile_field (e.g. given_name)"
                id={`pfield-${i}`}
                className="border rounded px-2 py-1 flex-1"
              />
              <button
                onClick={() => {
                  const input = document.getElementById(`pfield-${i}`) as HTMLInputElement | null;
                  const val = input?.value?.trim();
                  if (!val) {
                    alert("Please enter a profile field key.");
                    return;
                  }
                  saveMapping(f, val);
                }}
                className="btn-secondary"
              >
                Save mapping
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

