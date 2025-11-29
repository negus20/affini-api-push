import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// In-memory store of market data by vehicle key
// NOTE: This is not persistent and will reset on redeploy or cold start.
// It's good for debugging / quick viewing.
type MarketPayload = {
    vehicle_name?: string;
    vehicle_year?: number;
    stats?: any;
    [key: string]: any;
};

const VEHICLE_DATA: Record<string, MarketPayload> = {};
let LAST_RECEIVED_AT: string | null = null;

const REQUIRED_TOKEN = process.env.MARKET_API_TOKEN || "";

function makeKey(payload: MarketPayload): string {
    const year = payload.vehicle_year ?? "unknown";
    const name = payload.vehicle_name ?? "unknown";
    return `${year}::${name}`;
}

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

    const key = makeKey(data);
    LAST_RECEIVED_AT = new Date().toISOString();
    VEHICLE_DATA[key] = {
        ...data,
        _updated_at: LAST_RECEIVED_AT,
    };

    console.log("Affini API received for key:", key);
    console.log(JSON.stringify(data, null, 2));

    return NextResponse.json(
        {
            status: "ok",
            received_at: LAST_RECEIVED_AT,
            vehicle_key: key,
            vehicle_name: data.vehicle_name,
            vehicle_year: data.vehicle_year,
        },
        { status: 200 }
    );
}

export async function GET() {
    const vehicles = Object.values(VEHICLE_DATA);

    if (vehicles.length === 0) {
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
            vehicle_count: vehicles.length,
            vehicles,
        },
        { status: 200 }
    );
}
