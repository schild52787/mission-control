import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { homedir } from "os";
import path from "path";

const DATA_PATH = path.join(
  homedir(),
  ".openclaw/workspace/data/finance.json"
);

export interface FinanceData {
  benefits: {
    amex_plat: {
      airline: number;
      digital: number;
      hotel: number;
      uber: number;
      walmart: number;
      saks: number;
      clear: number;
    };
    csr: { travel: number };
    delta_reserve: { delta_stays: number };
  };
  last_updated: string;
}

const DEFAULT_DATA: FinanceData = {
  benefits: {
    amex_plat: {
      airline: 0,
      digital: 0,
      hotel: 0,
      uber: 0,
      walmart: 0,
      saks: 0,
      clear: 0,
    },
    csr: { travel: 0 },
    delta_reserve: { delta_stays: 0 },
  },
  last_updated: "",
};

// Handle both flat number AND nested {used, log} formats from finance.py
function getUsed(val: unknown): number {
  if (typeof val === "number") return val;
  if (val && typeof val === "object" && "used" in val) {
    return typeof (val as { used: unknown }).used === "number"
      ? (val as { used: number }).used
      : 0;
  }
  return 0;
}

function normalizeData(raw: Record<string, unknown>): FinanceData {
  const b = (raw.benefits ?? {}) as Record<string, unknown>;
  const ap = (b.amex_plat ?? {}) as Record<string, unknown>;
  const csr = (b.csr ?? {}) as Record<string, unknown>;
  const dr = (b.delta_reserve ?? {}) as Record<string, unknown>;
  return {
    benefits: {
      amex_plat: {
        airline: getUsed(ap.airline),
        digital: getUsed(ap.digital),
        hotel: getUsed(ap.hotel),
        uber: getUsed(ap.uber),
        walmart: getUsed(ap.walmart),
        saks: getUsed(ap.saks),
        clear: getUsed(ap.clear),
      },
      csr: { travel: getUsed(csr.travel) },
      delta_reserve: { delta_stays: getUsed(dr.delta_stays) },
    },
    last_updated:
      typeof raw.last_updated === "string"
        ? raw.last_updated
        : typeof (raw.meta as Record<string, unknown>)?.last_updated === "string"
        ? ((raw.meta as Record<string, unknown>).last_updated as string)
        : "",
  };
}

export async function GET() {
  try {
    let data: FinanceData;
    try {
      const raw = await readFile(DATA_PATH, "utf-8");
      data = normalizeData(JSON.parse(raw));
    } catch {
      data = DEFAULT_DATA;
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("Finance API error:", err);
    return NextResponse.json(DEFAULT_DATA);
  }
}
