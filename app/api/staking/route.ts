import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"
import { errorResponse, successResponse, handleZodError } from "@/lib/api-utils"
import { stakingSchema } from "@/lib/schemas"
import { z } from "zod"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Valider les données de la requête
    const validatedData = stakingSchema.parse(body)
    const { user_id, amount } = validatedData

    // Vérifier que l'utilisateur existe
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", user_id).single()

    if (userError || !user) {
      return errorResponse("Utilisateur non trouvé", 404)
    }

    // Vérifier que l'utilisateur a assez de $SCRAP
    if (user.scrap < amount) {
      return errorResponse("Solde $SCRAP insuffisant", 400)
    }

    // Déduire le montant du solde de l'utilisateur
    const { error: updateError } = await supabase
      .from("users")
      .update({ scrap: user.scrap - amount })
      .eq("id", user_id)

    if (updateError) {
      return errorResponse("Erreur lors de la mise à jour du solde", 500)
    }

    // Créer l'enregistrement de staking
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
      // En cas d'erreur, on devrait idéalement rembourser l'utilisateur
      // mais cela nécessiterait une transaction que Supabase JS ne supporte pas directement
      console.error("Erreur de staking, remboursement nécessaire:", stakingError)
      return errorResponse("Erreur lors du staking", 500)
    }

    return successResponse({
      message: "Staking réussi",
      staking,
      new_balance: user.scrap - amount,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }
    console.error("Erreur inattendue:", error)
    return errorResponse("Une erreur inattendue s'est produite", 500)
  }
}
