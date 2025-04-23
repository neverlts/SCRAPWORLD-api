import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"
import { errorResponse, successResponse, handleZodError } from "@/lib/api-utils"
import { fusionSchema } from "@/lib/schemas"
import { z } from "zod"

// POST /api/fusion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validatedData = fusionSchema.parse(body)
    const { token_id, sticker_id, user_id } = validatedData

    // Check if token exists and belongs to user
    const { data: token, error: tokenError } = await supabase
      .from("tokens")
      .select("*")
      .eq("id", token_id)
      .eq("owner_id", user_id)
      .single()

    if (tokenError || !token) {
      return errorResponse("NFT non trouvé ou n'appartient pas à l'utilisateur", 404)
    }

    // Check if user has the sticker
    const { data: userItem, error: itemError } = await supabase
      .from("user_items")
      .select("*")
      .eq("user_id", user_id)
      .eq("item_id", sticker_id)
      .single()

    if (itemError || !userItem || userItem.quantity < 1) {
      return errorResponse("Utilisateur ne possède pas ce sticker", 404)
    }

    // Start a transaction
    // Note: Supabase JS client doesn't support transactions directly, so we'll do multiple operations

    // 1. Update token attributes
    const currentAttributes = token.attributes as Record<string, any>
    const updatedAttributes = {
      ...currentAttributes,
      stickers: [...(currentAttributes.stickers || []), sticker_id],
    }

    const { error: updateError } = await supabase
      .from("tokens")
      .update({ attributes: updatedAttributes })
      .eq("id", token_id)

    if (updateError) {
      return errorResponse(updateError.message, 500)
    }

    // 2. Decrease user's sticker quantity
    const { error: decreaseError } = await supabase
      .from("user_items")
      .update({ quantity: userItem.quantity - 1 })
      .eq("user_id", user_id)
      .eq("item_id", sticker_id)

    if (decreaseError) {
      return errorResponse(decreaseError.message, 500)
    }

    // 3. Log the fusion
    const { error: logError } = await supabase.from("fusion_logs").insert({
      user_id,
      token_id,
      sticker_id,
      date: new Date().toISOString(),
    })

    if (logError) {
      return errorResponse(logError.message, 500)
    }

    // Get updated token
    const { data: updatedToken, error: fetchError } = await supabase
      .from("tokens")
      .select("*")
      .eq("id", token_id)
      .single()

    if (fetchError) {
      return errorResponse(fetchError.message, 500)
    }

    return successResponse(updatedToken)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }
    console.error("Error applying fusion:", error)
    return errorResponse("Erreur lors de la fusion", 500)
  }
}
