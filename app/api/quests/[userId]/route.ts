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

    // Récupérer toutes les quêtes
    const { data: allQuests, error: questsError } = await supabase.from("quests").select("*")

    if (questsError) {
      return errorResponse("Erreur lors de la récupération des quêtes", 500)
    }

    // Récupérer les quêtes de l'utilisateur
    const { data: userQuests, error: userQuestsError } = await supabase
      .from("user_quest")
      .select("*")
      .eq("user_id", userId)

    if (userQuestsError) {
      return errorResponse("Erreur lors de la récupération des quêtes de l'utilisateur", 500)
    }

    // Créer un map des quêtes de l'utilisateur pour un accès rapide
    const userQuestsMap = new Map()
    userQuests.forEach((uq) => {
      userQuestsMap.set(uq.quest_id, uq)
    })

    // Combiner les données pour la réponse
    const questsWithStatus = allQuests.map((quest) => {
      const userQuest = userQuestsMap.get(quest.id)

      return {
        ...quest,
        status: userQuest ? userQuest.status : "not_started",
        progress: userQuest ? userQuest.progress : null,
        completed_at: userQuest ? userQuest.completed_at : null,
      }
    })

    // Organiser les quêtes par statut
    const completed = questsWithStatus.filter((q) => q.status === "completed")
    const inProgress = questsWithStatus.filter((q) => q.status === "in_progress")
    const notStarted = questsWithStatus.filter((q) => q.status === "not_started")

    return successResponse({
      user_id: userId,
      completed,
      in_progress: inProgress,
      available: notStarted,
      total_quests: allQuests.length,
      completed_count: completed.length,
    })
  } catch (error) {
    console.error("Erreur inattendue:", error)
    return errorResponse("Une erreur inattendue s'est produite", 500)
  }
}
