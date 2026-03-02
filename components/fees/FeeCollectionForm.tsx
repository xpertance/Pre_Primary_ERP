"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FeeCollectionForm({ preStudentId }: any) {
  const [studentId, setStudentId] = useState(preStudentId || "");
  const [structureId, setStructureId] = useState("");
  const [structures, setStructures] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/fees").then(r => r.json()).then(d => { if (d.success) setStructures(d.items) });
  }, []);

  useEffect(() => {
    const s = structures.find(s => s._id === structureId);
    // eslint-disable-next-line
    if (s) setItems(s.heads || []);
  }, [structureId, structures]);

  async function collect(partial = false) {
    const payload = { studentId, structureId, items, amount: Number(amount), paymentMethod, partial };
    const res = await fetch("/api/fees/collect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const d = await res.json();
    if (d.success) {
      alert("Payment recorded");
      router.push("/fees/history");
    } else alert(d.error || "Error");
  }

  return (
    <div className="space-y-3">
      <input placeholder="Student ID" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
      <select value={structureId} onChange={(e) => setStructureId(e.target.value)}>
        <option value="">Select Structure (optional)</option>
        {structures.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
      </select>

      <div>
        <h4>Items</h4>
        {items.map((it: any, idx: number) => (
          <div key={idx} className="flex gap-2">
            <div>{it.title}</div>
            <div>₹{it.amount}</div>
          </div>
        ))}
      </div>

      <div>
        <label>Amount to collect</label>
        <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
      </div>

      <div>
        <label>Method</label>
        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          <option value="cash">Cash</option>
          <option value="razorpay">Razorpay</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button onClick={() => collect(false)}>Collect Full</button>
        <button onClick={() => collect(true)}>Record Partial</button>
      </div>
    </div>
  );
}
