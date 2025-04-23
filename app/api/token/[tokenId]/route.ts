import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"
import { errorResponse, successResponse } from "@/lib/api-utils"

export async function GET(request: NextRequest, { params }: { params: { tokenId: string } }) {
  try {
    const { tokenId } = params

    // Vérifier que le tokenId est valide
    if (!tokenId || typeof tokenId !== "string") {
      return errorResponse("ID de token invalide", 400)
    }

    // Récupérer les métadonnées du NFT depuis Supabase
    const { data: token, error } = await supabase.from("tokens").select("*").eq("id", tokenId).single()

    if (error) {
      console.error("Erreur Supabase:", error)
      return errorResponse("Erreur lors de la récupération du token", 500)
    }

    if (!token) {
      return errorResponse("Token non trouvé", 404)
    }

    return successResponse(token)
  } catch (error) {
    console.error("Erreur inattendue:", error)
    return errorResponse("Une erreur inattendue s'est produite", 500)
  }
}

// PATCH /api/token/:tokenId
export async function PATCH(request: NextRequest, { params }: { params: { tokenId: string } }) {
  try {
    const { tokenId } = params
    const body = await request.json()

    // Valider les données de la requête
    const { sticker_id } = body

    if (!sticker_id) {
      return errorResponse("sticker_id est requis", 400)
    }

    // Vérifier que le token existe
    const { data: token, error: tokenError } = await supabase.from("tokens").select("*").eq("id", tokenId).single()

    if (tokenError || !token) {
      return errorResponse("Token non trouvé", 404)
    }

    // Vérifier que le sticker existe
    const { data: sticker, error: stickerError } = await supabase
      .from("items")
      .select("*")
      .eq("id", sticker_id)
      .eq("type", "sticker")
      .single()

    if (stickerError || !sticker) {
      return errorResponse("Sticker non trouvé", 404)
    }

    // Mettre à jour les attributs du token
    const currentAttributes = token.attributes as Record<string, any>
    const updatedAttributes = {
      ...currentAttributes,
      stickers: [...(currentAttributes.stickers || []), sticker_id],
    }

    const { data: updatedToken, error: updateError } = await supabase
      .from("tokens")
      .update({ attributes: updatedAttributes })
      .eq("id", tokenId)
      .select()
      .single()

    if (updateError) {
      return errorResponse(updateError.message, 500)
    }

    return successResponse(updatedToken)
  } catch (error) {
    console.error("Erreur lors de la mise à jour du token:", error)
    return errorResponse("Une erreur inattendue s'est produite", 500)
  }
}
