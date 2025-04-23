import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"
import { errorResponse, successResponse, handleZodError } from "@/lib/api-utils"
import { fusionSchema } from "@/lib/schemas"
import { z } from "zod"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Valider les données de la requête
    const validatedData = fusionSchema.parse(body)
    const { user_id, nft1_id, nft2_id } = validatedData

    // Vérifier que l'utilisateur existe
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", user_id).single()

    if (userError || !user) {
      return errorResponse("Utilisateur non trouvé", 404)
    }

    // Vérifier que les NFTs existent et appartiennent à l'utilisateur
    const { data: nft1, error: nft1Error } = await supabase
      .from("tokens")
      .select("*")
      .eq("id", nft1_id)
      .eq("owner_id", user_id)
      .single()

    if (nft1Error || !nft1) {
      return errorResponse("NFT 1 non trouvé ou n'appartient pas à l'utilisateur", 404)
    }

    const { data: nft2, error: nft2Error } = await supabase
      .from("tokens")
      .select("*")
      .eq("id", nft2_id)
      .eq("owner_id", user_id)
      .single()

    if (nft2Error || !nft2) {
      return errorResponse("NFT 2 non trouvé ou n'appartient pas à l'utilisateur", 404)
    }

    // Logique de fusion des NFTs
    // Ici, nous créons un nouveau NFT avec des attributs combinés
    const combinedAttributes = {
      ...nft1.attributes,
      ...nft2.attributes,
      fusion: {
        parents: [nft1_id, nft2_id],
        date: new Date().toISOString(),
      },
    }

    const newNftName = `${nft1.name} + ${nft2.name}`

    // Créer le nouveau NFT
    const { data: newNft, error: createError } = await supabase
      .from("tokens")
      .insert({
        name: newNftName,
        image_url: nft1.image_url, // Vous pourriez avoir une logique plus complexe ici
        attributes: combinedAttributes,
        owner_id: user_id,
      })
      .select()
      .single()

    if (createError) {
      return errorResponse("Erreur lors de la création du nouveau NFT", 500)
    }

    // Enregistrer la fusion dans les logs
    const { error: logError } = await supabase.from("fusion_logs").insert({
      user_id,
      nft1_id,
      nft2_id,
      result_nft_id: newNft.id,
    })

    if (logError) {
      return errorResponse("Erreur lors de l'enregistrement de la fusion", 500)
    }

    // Optionnel: Supprimer ou marquer les NFTs parents comme fusionnés
    // Cette partie dépend de votre logique métier

    return successResponse({
      message: "Fusion réussie",
      result_nft: newNft,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }
    console.error("Erreur inattendue:", error)
    return errorResponse("Une erreur inattendue s'est produite", 500)
  }
}
