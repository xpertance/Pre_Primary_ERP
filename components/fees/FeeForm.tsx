"use client";
import React, { useState, ChangeEvent } from "react";

interface FeeHead {
  title: string;
  amount: number;
}

interface InitialFeeStructure {
  name?: string;
  heads?: FeeHead[];
  finePerDay?: number;
}

interface FeeStructure {
  _id: string;
  name: string;
  heads: FeeHead[];
  finePerDay: number;
}

interface FeeStructureFormProps {
  initial?: InitialFeeStructure;
  onSaved?: (item: FeeStructure) => void;
}

export default function FeeStructureForm({ initial = {}, onSaved }: FeeStructureFormProps) {
  const [name, setName] = useState(initial.name || "");
  const [heads, setHeads] = useState<FeeHead[]>(initial.heads || [{ title: "", amount: 0 }]);
  const [finePerDay, setFinePerDay] = useState(initial.finePerDay || 0);

  function setHead(i: number, key: keyof FeeHead, val: string | number) {
    const copy = [...heads];
    copy[i] = { ...copy[i], [key]: val };
    setHeads(copy);
  }

  function addHead() {
    setHeads((p: FeeHead[]) => [...p, { title: "", amount: 0 }]);
  }

  function removeHead(i: number) {
    setHeads((p: FeeHead[]) => p.filter((_, idx) => idx !== i));
  }

  async function submit() {
    const payload = { name, heads, finePerDay };
    try {
      const res = await fetch("/api/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (d.success) {
        onSaved?.(d.item);
      } else {
        alert(d.error || "Error");
      }
    } catch {
      alert("Failed to save fee structure");
    }
  }

  return (
    <div className="space-y-3">
      <input
        placeholder="Structure name"
        value={name}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      {heads.map((h, i) => (
        <div key={i} className="flex gap-2">
          <input
            placeholder="Head"
            value={h.title}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setHead(i, "title", e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="number"
            placeholder="Amount"
            value={h.amount}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setHead(i, "amount", Number(e.target.value))}
            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="button"
            onClick={() => removeHead(i)}
            className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addHead}
        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
      >
        Add Head
      </button>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Fine per day</label>
        <input
          type="number"
          value={finePerDay}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setFinePerDay(Number(e.target.value))}
          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <button
        onClick={submit}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Save Structure
      </button>
    </div>
  );
}