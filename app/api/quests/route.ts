import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"
import { errorResponse, successResponse } from "@/lib/api-utils"

// GET /api/quests
export async function GET(request: NextRequest) {
  try {
    const { data: quests, error } = await supabase.from("quests").select("*")

    if (error) {
      return errorResponse(error.message, 500)
    }

    return successResponse(quests)
  } catch (error) {
    console.error("Error fetching quests:", error)
    return errorResponse("Erreur lors de la récupération des quêtes", 500)
  }
}
