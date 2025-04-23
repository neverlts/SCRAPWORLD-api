import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"
import { errorResponse, successResponse, handleZodError } from "@/lib/api-utils"
import { boosterOpenSchema } from "@/lib/schemas"
import { z } from "zod"

// GET /api/booster/open
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const user_id = url.searchParams.get("user_id")
    const booster_id = url.searchParams.get("booster_id")

    if (!user_id) {
      return errorResponse("user_id est requis", 400)
    }

    // Validate parameters
    const validatedData = boosterOpenSchema.parse({ user_id, booster_id })

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", validatedData.user_id)
      .single()

    if (userError || !user) {
      return errorResponse("Utilisateur non trouvé", 404)
    }

    // Find an unopened booster
    const query = supabase.from("boosters").select("*").eq("user_id", validatedData.user_id).eq("opened", false)

    // If booster_id is provided, use it
    if (validatedData.booster_id) {
      query.eq("id", validatedData.booster_id)
    }

    const { data: booster, error: boosterError } = await query.limit(1).single()

    if (boosterError || !booster) {
      return errorResponse("Booster non trouvé ou déjà ouvert", 404)
    }

    // Mark booster as opened
    const { error: updateError } = await supabase.from("boosters").update({ opened: true }).eq("id", booster.id)

    if (updateError) {
      return errorResponse(updateError.message, 500)
    }

    // Generate random rewards based on booster type
    const rewards = await generateBoosterRewards(booster.type)

    // Apply rewards to user
    await applyRewardsToUser(validatedData.user_id, rewards)

    return successResponse({
      message: "Booster ouvert avec succès",
      booster_id: booster.id,
      rewards,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }
    console.error("Error opening booster:", error)
    return errorResponse("Erreur lors de l'ouverture du booster", 500)
  }
}

// Helper function to generate random rewards
async function generateBoosterRewards(boosterType: string) {
  // Get all available items
  const { data: items } = await supabase.from("items").select("*")

  const rewards: Record<string, any> = {
    items: [],
    xp: 0,
    scrap: 0,
  }

  // Different reward logic based on booster type
  switch (boosterType) {
    case "common":
      // 1-3 common items
      const commonItems = items?.filter((item) => item.type !== "rare") || []
      const numCommonItems = Math.floor(Math.random() * 3) + 1
      for (let i = 0; i < numCommonItems; i++) {
        if (commonItems.length > 0) {
          const randomIndex = Math.floor(Math.random() * commonItems.length)
          rewards.items.push({
            id: commonItems[randomIndex].id,
            quantity: 1,
          })
        }
      }
      rewards.xp = Math.floor(Math.random() * 50) + 10
      rewards.scrap = Math.floor(Math.random() * 20) + 5
      break

    case "rare":
      // 1-2 rare items, higher XP and SCRAP
      const rareItems = items?.filter((item) => item.type === "rare") || []
      const numRareItems = Math.floor(Math.random() * 2) + 1
      for (let i = 0; i < numRareItems; i++) {
        if (rareItems.length > 0) {
          const randomIndex = Math.floor(Math.random() * rareItems.length)
          rewards.items.push({
            id: rareItems[randomIndex].id,
            quantity: 1,
          })
        }
      }
      rewards.xp = Math.floor(Math.random() * 100) + 50
      rewards.scrap = Math.floor(Math.random() * 50) + 20
      break

    case "legendary":
      // 1 rare item guaranteed, higher chance for multiple items, highest XP and SCRAP
      const legendaryItems = items?.filter((item) => item.type === "rare") || []
      if (legendaryItems.length > 0) {
        const randomIndex = Math.floor(Math.random() * legendaryItems.length)
        rewards.items.push({
          id: legendaryItems[randomIndex].id,
          quantity: 1,
        })
      }

      // Add some common items too
      const legendaryCommonItems = items?.filter((item) => item.type !== "rare") || []
      const numLegendaryCommonItems = Math.floor(Math.random() * 4) + 2
      for (let i = 0; i < numLegendaryCommonItems; i++) {
        if (legendaryCommonItems.length > 0) {
          const randomIndex = Math.floor(Math.random() * legendaryCommonItems.length)
          rewards.items.push({
            id: legendaryCommonItems[randomIndex].id,
            quantity: 1,
          })
        }
      }
      rewards.xp = Math.floor(Math.random() * 200) + 100
      rewards.scrap = Math.floor(Math.random() * 100) + 50
      break

    default:
      // Default case - basic rewards
      if (items && items.length > 0) {
        const randomIndex = Math.floor(Math.random() * items.length)
        rewards.items.push({
          id: items[randomIndex].id,
          quantity: 1,
        })
      }
      rewards.xp = Math.floor(Math.random() * 30) + 5
      rewards.scrap = Math.floor(Math.random() * 10) + 2
  }

  return rewards
}

// Helper function to apply rewards to user
async function applyRewardsToUser(userId: string, rewards: Record<string, any>) {
  // Get current user data
  const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

  if (userError || !user) {
    throw new Error("Utilisateur non trouvé")
  }

  // Update user XP and SCRAP
  const { error: updateError } = await supabase
    .from("users")
    .update({
      xp: user.xp + (rewards.xp || 0),
      scrap: user.scrap + (rewards.scrap || 0),
    })
    .eq("id", userId)

  if (updateError) {
    throw new Error(updateError.message)
  }

  // Add items to user inventory
  if (rewards.items && rewards.items.length > 0) {
    for (const item of rewards.items) {
      // Check if user already has this item
      const { data: existingItem, error: itemError } = await supabase
        .from("user_items")
        .select("*")
        .eq("user_id", userId)
        .eq("item_id", item.id)
        .single()

      if (existingItem) {
        // Increment quantity
        const { error: updateItemError } = await supabase
          .from("user_items")
          .update({ quantity: existingItem.quantity + (item.quantity || 1) })
          .eq("user_id", userId)
          .eq("item_id", item.id)

        if (updateItemError) {
          throw new Error(updateItemError.message)
        }
      } else {
        // Add new item
        const { error: insertError } = await supabase.from("user_items").insert({
          user_id: userId,
          item_id: item.id,
          quantity: item.quantity || 1,
        })

        if (insertError) {
          throw new Error(insertError.message)
        }
      }
    }
  }
}
