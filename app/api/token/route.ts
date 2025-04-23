import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"
import { errorResponse, successResponse, handleZodError } from "@/lib/api-utils"
import { createTokenSchema } from "@/lib/schemas"
import { z } from "zod"

// POST /api/token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validatedData = createTokenSchema.parse(body)

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", validatedData.owner_id)
      .single()

    if (userError || !user) {
      return errorResponse("Utilisateur non trouvé", 404)
    }

    // Create token
    const { data: token, error } = await supabase
      .from("tokens")
      .insert({
        name: validatedData.name,
        image_url: validatedData.image_url,
        attributes: validatedData.attributes,
        owner_id: validatedData.owner_id,
      })
      .select()
      .single()

    if (error) {
      return errorResponse(error.message, 500)
    }

    return successResponse(token)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }
    console.error("Error creating token:", error)
    return errorResponse("Erreur lors de la création du NFT", 500)
  }
}
