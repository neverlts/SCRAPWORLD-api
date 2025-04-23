import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"
import { errorResponse, successResponse, handleZodError } from "@/lib/api-utils"
import { completeQuestSchema } from "@/lib/schemas"
import { z } from "zod"

// POST /api/quests/complete
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validatedData = completeQuestSchema.parse(body)
    const { quest_id, user_id } = validatedData

    // Check if quest exists
    const { data: quest, error: questError } = await supabase.from("quests").select("*").eq("id", quest_id).single()

    if (questError || !quest) {
      return errorResponse("Quête non trouvée", 404)
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", user_id).single()

    if (userError || !user) {
      return errorResponse("Utilisateur non trouvé", 404)
    }

    // Check if quest is already completed
    const { data: existingCompletion, error: completionError } = await supabase
      .from("user_quest")
      .select("*")
      .eq("user_id", user_id)
      .eq("quest_id", quest_id)
      .single()

    if (existingCompletion) {
      return errorResponse("Quête déjà complétée", 400)
    }

    // Mark quest as completed
    const { error: markError } = await supabase.from("user_quest").insert({
      user_id,
      quest_id,
      completed_at: new Date().toISOString(),
    })

    if (markError) {
      return errorResponse(markError.message, 500)
    }

    // Apply rewards
    const reward = quest.reward as Record<string, any>

    // Update user XP and SCRAP if provided in reward
    if (reward.xp || reward.scrap) {
      const updates: Record<string, any> = {}

      if (reward.xp) {
        updates.xp = user.xp + reward.xp

        // Check if user should level up (simple level up logic)
        const newLevel = Math.floor(updates.xp / 1000) + 1
        if (newLevel > user.level) {
          updates.level = newLevel
        }
      }

      if (reward.scrap) {
        updates.scrap = user.scrap + reward.scrap
      }

      const { error: updateError } = await supabase.from("users").update(updates).eq("id", user_id)

      if (updateError) {
        return errorResponse(updateError.message, 500)
      }
    }

    // Add items if provided in reward
    if (reward.items && Array.isArray(reward.items)) {
      for (const item of reward.items) {
        // Check if user already has this item
        const { data: existingItem, error: itemError } = await supabase
          .from("user_items")
          .select("*")
          .eq("user_id", user_id)
          .eq("item_id", item.id)
          .single()

        if (existingItem) {
          // Increment quantity
          const { error: updateError } = await supabase
            .from("user_items")
            .update({ quantity: existingItem.quantity + (item.quantity || 1) })
            .eq("user_id", user_id)
            .eq("item_id", item.id)

          if (updateError) {
            return errorResponse(updateError.message, 500)
          }
        } else {
          // Add new item
          const { error: insertError } = await supabase.from("user_items").insert({
            user_id,
            item_id: item.id,
            quantity: item.quantity || 1,
          })

          if (insertError) {
            return errorResponse(insertError.message, 500)
          }
        }
      }
    }

    // Add boosters if provided in reward
    if (reward.boosters && Array.isArray(reward.boosters)) {
      const boosterInserts = reward.boosters.map((booster: any) => ({
        user_id,
        type: booster.type,
        opened: false,
      }))

      const { error: boosterError } = await supabase.from("boosters").insert(boosterInserts)

      if (boosterError) {
        return errorResponse(boosterError.message, 500)
      }
    }

    // Get updated user data
    const { data: updatedUser, error: fetchError } = await supabase.from("users").select("*").eq("id", user_id).single()

    if (fetchError) {
      return errorResponse(fetchError.message, 500)
    }

    return successResponse({
      message: "Quête complétée avec succès",
      user: updatedUser,
      rewards: quest.reward,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }
    console.error("Error completing quest:", error)
    return errorResponse("Erreur lors de la complétion de la quête", 500)
  }
}
