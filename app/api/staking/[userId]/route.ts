import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"
import { errorResponse, successResponse } from "@/lib/api-utils"

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params

    // Vérifier que l'userId est valide
    if (!userId || typeof userId !== "string") {
      return errorResponse("ID utilisateur invalide", 400)
    }

    // Vérifier que l'utilisateur existe
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (userError || !user) {
      return errorResponse("Utilisateur non trouvé", 404)
    }

    // Récupérer les données de staking de l'utilisateur
    const { data: stakingData, error } = await supabase
      .from("staking")
      .select("*")
      .eq("user_id", userId)
      .order("start_date", { ascending: false })

    if (error) {
      console.error("Erreur Supabase:", error)
      return errorResponse("Erreur lors de la récupération des données de staking", 500)
    }

    // Calculer les récompenses potentielles (exemple simple)
    const stakingWithRewards = stakingData.map((stake) => {
      const startDate = new Date(stake.start_date)
      const now = new Date()
      const stakingDurationMs = now.getTime() - startDate.getTime()
      const stakingDurationDays = stakingDurationMs / (1000 * 60 * 60 * 24)

      // Exemple: 0.5% de récompense par jour
      const rewardRate = 0.005
      const potentialReward = stake.amount * rewardRate * stakingDurationDays

      return {
        ...stake,
        duration_days: stakingDurationDays.toFixed(2),
        potential_reward: potentialReward.toFixed(2),
      }
    })

    return successResponse({
      user_id: userId,
      staking: stakingWithRewards,
      total_staked: stakingData.reduce((sum, stake) => sum + stake.amount, 0),
    })
  } catch (error) {
    console.error("Erreur inattendue:", error)
    return errorResponse("Une erreur inattendue s'est produite", 500)
  }
}
