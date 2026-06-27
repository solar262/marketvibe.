"use client";

import Papa from "papaparse";
import { useState } from "react";
import { inputClass } from "@/lib/ui";

const required = ["title", "description", "image_url", "category", "supplier_url", "supplier_cost", "selling_price", "stock", "tags"];

export default function AdminImportPage() {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(result) {
        const fields = result.meta.fields || [];
        const missing = required.filter((field) => !fields.includes(field));
        setErrors(missing.map((field) => `Missing required column: ${field}`));
        setRows(result.data);
      },
    });
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-semibold text-stone-950">CSV import</h1>
      <p className="mt-2 text-sm text-stone-600">Required columns: {required.join(", ")}</p>
      <div className="mt-6 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <input type="file" accept=".csv" className={inputClass} onChange={handleFile} />
        {errors.length > 0 && <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{errors.map((error) => <p key={error}>{error}</p>)}</div>}
      </div>
      {rows.length > 0 && (
        <section className="mt-6 overflow-x-auto rounded-lg border border-stone-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-stone-500"><tr>{Object.keys(rows[0]).map((key) => <th key={key} className="px-3 py-2">{key}</th>)}</tr></thead>
            <tbody>{rows.slice(0, 10).map((row, index) => <tr key={index} className="border-t border-stone-100">{Object.values(row).map((value, cell) => <td key={cell} className="px-3 py-2">{value}</td>)}</tr>)}</tbody>
          </table>
          <div className="border-t border-stone-100 p-4"><button className="rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white">Save previewed products</button></div>
        </section>
      )}
    </main>
  );
}
