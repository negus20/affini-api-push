import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// In-memory list of all posted payloads (for debugging / viewing)
// NOTE: This resets on redeploy / cold start and is not persistent.
type MarketPayload = {
    vehicle_name?: string;
    vehicle_year?: number;
    stats?: any;
    [key: string]: any;
};

const VEHICLE_DATA: MarketPayload[] = [];
let LAST_RECEIVED_AT: string | null = null;

const REQUIRED_TOKEN = process.env.MARKET_API_TOKEN || "";

export async function POST(req: NextRequest) {
    // Optional bearer auth
    if (REQUIRED_TOKEN) {
        const authHeader = req.headers.get("authorization") || "";
        const token = authHeader.replace("Bearer ", "").trim();
        if (!token || token !== REQUIRED_TOKEN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    let data: MarketPayload;
    try {
        data = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    LAST_RECEIVED_AT = new Date().toISOString();

    const enriched: MarketPayload = {
        ...data,
        _updated_at: LAST_RECEIVED_AT,
    };

    VEHICLE_DATA.push(enriched);

    console.log("Affini API received payload:");
    console.log(JSON.stringify(enriched, null, 2));

    return NextResponse.json(
        {
            status: "ok",
            received_at: LAST_RECEIVED_AT,
            count_now: VEHICLE_DATA.length,
        },
        { status: 200 }
    );
}

export async function GET() {
    if (VEHICLE_DATA.length === 0) {
        return NextResponse.json(
            {
                status: "no_data_yet",
                message:
                    "No market data has been cached in this runtime instance since the last deploy.",
            },
            { status: 200 }
        );
    }

    return NextResponse.json(
        {
            status: "ok",
            last_received_at: LAST_RECEIVED_AT,
            vehicle_count: VEHICLE_DATA.length,
            vehicles: VEHICLE_DATA,
        },
        { status: 200 }
    );
}
