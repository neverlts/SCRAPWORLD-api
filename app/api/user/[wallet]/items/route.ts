import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"
import { errorResponse, successResponse } from "@/lib/api-utils"

// GET /api/user/:wallet/items
export async function GET(request: NextRequest, { params }: { params: { wallet: string } }) {
  try {
    const { wallet } = params

    // Get user by wallet address
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("wallet_address", wallet)
      .single()

    if (userError || !user) {
      return errorResponse("Utilisateur non trouvé", 404)
    }

    // Get user items
    const { data: userItems, error: itemsError } = await supabase
      .from("user_items")
      .select(`
        quantity,
        items:item_id (
          id,
          name,
          type,
          image_url
        )
      `)
      .eq("user_id", user.id)

    if (itemsError) {
      return errorResponse(itemsError.message, 500)
    }

    // Format response
    const formattedItems = userItems.map((item) => ({
      ...item.items,
      quantity: item.quantity,
    }))

    return successResponse(formattedItems)
  } catch (error) {
    console.error("Error fetching user items:", error)
    return errorResponse("Erreur lors de la récupération des objets", 500)
  }
}
