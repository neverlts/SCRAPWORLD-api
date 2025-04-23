import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"
import { errorResponse, successResponse, handleZodError } from "@/lib/api-utils"
import { updateTokenSchema } from "@/lib/schemas"
import { z } from "zod"

// GET /api/token/:id
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const { data: token, error } = await supabase.from("tokens").select("*").eq("id", id).single()

    if (error) {
      return errorResponse(error.message, 500)
    }

    if (!token) {
      return errorResponse("NFT non trouvé", 404)
    }

    return successResponse(token)
  } catch (error) {
    console.error("Error fetching token:", error)
    return errorResponse("Erreur lors de la récupération du NFT", 500)
  }
}

// PATCH /api/token/:id
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()

    // Validate request body
    const validatedData = updateTokenSchema.parse(body)

    // Check if token exists
    const { data: token, error: tokenError } = await supabase.from("tokens").select("*").eq("id", id).single()

    if (tokenError || !token) {
      return errorResponse("NFT non trouvé", 404)
    }

    // Check if sticker exists
    const { data: sticker, error: stickerError } = await supabase
      .from("items")
      .select("*")
      .eq("id", validatedData.sticker_id)
      .eq("type", "sticker")
      .single()

    if (stickerError || !sticker) {
      return errorResponse("Sticker non trouvé", 404)
    }

    // Update token attributes
    const currentAttributes = token.attributes as Record<string, any>
    const updatedAttributes = {
      ...currentAttributes,
      stickers: [...(currentAttributes.stickers || []), validatedData.sticker_id],
    }

    const { data: updatedToken, error: updateError } = await supabase
      .from("tokens")
      .update({ attributes: updatedAttributes })
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      return errorResponse(updateError.message, 500)
    }

    return successResponse(updatedToken)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }
    console.error("Error updating token:", error)
    return errorResponse("Erreur lors de la mise à jour du NFT", 500)
  }
}
