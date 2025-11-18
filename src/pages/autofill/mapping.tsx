/* global chrome */

import { useState } from "react";

export default function MappingPage() {
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchScanFromActiveTab() {
    setLoading(true);
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(
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

