import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// in-memory cache for last payload (per edge region, non-persistent)
let LAST_PAYLOAD: any = null;
let LAST_RECEIVED_AT: string | null = null;

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

    // Save in memory
    LAST_PAYLOAD = data;
    LAST_RECEIVED_AT = new Date().toISOString();

    console.log("Affini API received:", JSON.stringify(data, null, 2));

    const { vehicle_name, vehicle_year, stats } = data || {};

    return NextResponse.json(
        {
            status: "ok",
            received_at: LAST_RECEIVED_AT,
            vehicle_name,
            vehicle_year,
            stats,
        },
        { status: 200 }
    );
}

export async function GET() {
    if (!LAST_PAYLOAD) {
        return NextResponse.json(
            {
                status: "no_data_yet",
                message:
                    "No market data has been posted to this endpoint in this region since the last deploy.",
            },
            { status: 200 }
        );
    }

    return NextResponse.json(
        {
            status: "ok",
            last_received_at: LAST_RECEIVED_AT,
            payload: LAST_PAYLOAD,
        },
        { status: 200 }
    );
}
