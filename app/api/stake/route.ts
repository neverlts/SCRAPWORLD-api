import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"
import { errorResponse, successResponse, handleZodError } from "@/lib/api-utils"
import { stakeSchema } from "@/lib/schemas"
import { z } from "zod"

// POST /api/stake
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validatedData = stakeSchema.parse(body)
    const { user_id, amount } = validatedData

    // Check if user exists
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", user_id).single()

    if (userError || !user) {
      return errorResponse("Utilisateur non trouvé", 404)
    }

    // Check if user has enough SCRAP
    if (user.scrap < amount) {
      return errorResponse("Solde SCRAP insuffisant", 400)
    }

    // Deduct SCRAP from user
    const { error: updateError } = await supabase
      .from("users")
      .update({ scrap: user.scrap - amount })
      .eq("id", user_id)

    if (updateError) {
      return errorResponse(updateError.message, 500)
    }

    // Create staking record
    const { data: staking, error: stakingError } = await supabase
      .from("staking")
      .insert({
        user_id,
        amount,
        start_date: new Date().toISOString(),
      })
      .select()
      .single()

    if (stakingError) {
      return errorResponse(stakingError.message, 500)
    }

    return successResponse(staking)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }
    console.error("Error staking SCRAP:", error)
    return errorResponse("Erreur lors du staking", 500)
  }
}

// GET /api/stake
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const user_id = url.searchParams.get("user_id")

    if (!user_id) {
      return errorResponse("user_id est requis", 400)
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", user_id).single()

    if (userError || !user) {
      return errorResponse("Utilisateur non trouvé", 404)
    }

    // Get user's staking records
    const { data: stakingRecords, error } = await supabase
      .from("staking")
      .select("*")
      .eq("user_id", user_id)
      .order("start_date", { ascending: false })

    if (error) {
      return errorResponse(error.message, 500)
    }

    return successResponse(stakingRecords)
  } catch (error) {
    console.error("Error fetching staking records:", error)
    return errorResponse("Erreur lors de la récupération des données de staking", 500)
  }
}
