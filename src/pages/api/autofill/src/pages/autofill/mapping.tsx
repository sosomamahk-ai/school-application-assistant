import { useState } from "react";

interface Field {
  id: string;
  label?: string;
  name?: string;
}

export default function MappingPage() {
  const [fields, setFields] = useState<Field[]>([]);

  async function scan() {
    const res = await fetch("/api/autofill/detect", { method: "POST", body: JSON.stringify({ domFields: [] }) });
    const data = await res.json();
    setFields(data.domFields);
  }

  async function save(domId: string, profileField: string) {
    await fetch("/api/autofill/save-mapping", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ domId, profileField }),
    });
  }

  return (
    <div>
      <h1>Field Mapping</h1>
      <button onClick={scan}>Scan</button>
      <ul>
        {fields.map((f) => (
          <li key={f.id}>
            {f.label || f.name}
            <input onBlur={(e) => save(f.id, e.target.value)} placeholder="Assign profile field" />
          </li>
        ))}
      </ul>
    </div>
  );
}
