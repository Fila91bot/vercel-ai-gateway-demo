import { gateway } from "@/lib/gateway";
import { NextResponse } from "next/server";
import { SUPPORTED_MODELS } from "@/lib/constants";

export async function GET() {
  try {
    const allModels = await gateway.getAvailableModels();
    return NextResponse.json({
      models: allModels.models.filter((model) =>
        SUPPORTED_MODELS.includes(model.id)
      ),
    });
  } catch (error) {
    console.error("Error fetching available models:", error);
    return NextResponse.json(
      { error: "Failed to fetch available models" },
      { status: 500 }
    );
  }
}
