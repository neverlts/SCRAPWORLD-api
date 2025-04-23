import { z } from "zod"

// Token schemas
export const tokenSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Le nom est requis"),
  image_url: z.string().url("URL d'image invalide"),
  attributes: z.record(z.string(), z.any()),
  owner_id: z.string().uuid(),
})

export const createTokenSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  image_url: z.string().url("URL d'image invalide"),
  attributes: z.record(z.string(), z.any()),
  owner_id: z.string().uuid(),
})

export const updateTokenSchema = z.object({
  sticker_id: z.string().uuid(),
})

// Fusion schema
export const fusionSchema = z.object({
  user_id: z.string().uuid(),
  nft1_id: z.string().uuid(),
  nft2_id: z.string().uuid(),
})

// Quest schema
export const completeQuestSchema = z.object({
  user_id: z.string().uuid(),
  quest_id: z.string().uuid(),
})

// Staking schema
export const stakingSchema = z.object({
  user_id: z.string().uuid(),
  amount: z.number().positive("Le montant doit être positif"),
})

// Assurons-nous que stakeSchema est également exporté
export const stakeSchema = z.object({
  user_id: z.string().uuid(),
  amount: z.number().positive("Le montant doit être positif"),
})

// Booster schema
export const boosterOpenSchema = z.object({
  user_id: z.string().uuid(),
  booster_id: z.string().uuid().optional(),
})
