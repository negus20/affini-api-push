
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const REQUIRED_TOKEN = process.env.MARKET_API_TOKEN || "";

export async function POST(req: NextRequest) {
  if (REQUIRED_TOKEN) {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token || token !== REQUIRED_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let data;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  console.log("Affini API received:", JSON.stringify(data, null, 2));

  const { vehicle_name, vehicle_year, stats } = data;

  return NextResponse.json(
    {
      status: "ok",
      received_at: new Date().toISOString(),
      vehicle_name,
      vehicle_year,
      stats
    },
    { status: 200 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      status: "Affini API is live",
      endpoint: "/api/market-data",
      time: new Date().toISOString()
    },
    { status: 200 }
  );
}
