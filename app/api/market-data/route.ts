import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Last snapshot payload
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

    let data: any;
    try {
        data = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    LAST_RECEIVED_AT = new Date().toISOString();
    LAST_PAYLOAD = {
        ...data,
        _received_at: LAST_RECEIVED_AT,
    };

    console.log("Affini API received snapshot:");
    console.log(JSON.stringify(LAST_PAYLOAD, null, 2));

    const vehicleCount = Array.isArray(data?.vehicles)
        ? data.vehicles.length
        : undefined;

    return NextResponse.json(
        {
            status: "ok",
            received_at: LAST_RECEIVED_AT,
            vehicle_count: vehicleCount,
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
                    "No market snapshot has been posted to this runtime instance since the last deploy.",
            },
            { status: 200 }
        );
    }

    return NextResponse.json(
        {
            status: "ok",
            last_received_at: LAST_RECEIVED_AT,
            snapshot: LAST_PAYLOAD,
        },
        { status: 200 }
    );
}
