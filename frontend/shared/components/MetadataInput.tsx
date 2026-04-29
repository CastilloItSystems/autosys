"use client";
import React, { useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";

interface MetadataInputProps {
  value?: Record<string, string> | null;
  onChange: (value: Record<string, string> | null) => void;
}

interface Pair {
  key: string;
  val: string;
}

function toPairs(obj?: Record<string, string> | null): Pair[] {
  if (!obj || Object.keys(obj).length === 0) return [];
  return Object.entries(obj).map(([key, val]) => ({ key, val: String(val) }));
}

function toObject(pairs: Pair[]): Record<string, string> | null {
  const filled = pairs.filter((p) => p.key.trim() !== "");
  if (filled.length === 0) return null;
  return Object.fromEntries(filled.map((p) => [p.key.trim(), p.val]));
}

export default function MetadataInput({ value, onChange }: MetadataInputProps) {
  const [pairs, setPairs] = useState<Pair[]>(() => toPairs(value));

  useEffect(() => {
    setPairs(toPairs(value));
  }, []);

  const update = (next: Pair[]) => {
    setPairs(next);
    onChange(toObject(next));
  };

  const handleKey = (i: number, key: string) => {
    const next = pairs.map((p, idx) => (idx === i ? { ...p, key } : p));
    update(next);
  };

  const handleVal = (i: number, val: string) => {
    const next = pairs.map((p, idx) => (idx === i ? { ...p, val } : p));
    update(next);
  };

  const addRow = () => update([...pairs, { key: "", val: "" }]);

  const removeRow = (i: number) => update(pairs.filter((_, idx) => idx !== i));

  return (
    <div className="flex flex-column gap-2">
      {pairs.map((pair, i) => (
        <div key={i} className="flex gap-2 align-items-center">
          <InputText
            value={pair.key}
            onChange={(e) => handleKey(i, e.target.value)}
            placeholder="Campo"
            className="w-5"
          />
          <InputText
            value={pair.val}
            onChange={(e) => handleVal(i, e.target.value)}
            placeholder="Valor"
            className="w-6"
          />
          <Button
            type="button"
            icon="pi pi-times"
            rounded
            text
            severity="danger"
            onClick={() => removeRow(i)}
            className="flex-shrink-0"
          />
        </div>
      ))}
      <div>
        <Button
          type="button"
          icon="pi pi-plus"
          label="Agregar campo"
          text
          size="small"
          onClick={addRow}
        />
      </div>
    </div>
  );
}
