import { z } from "zod"

// Token schemas
export const tokenAttributeSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]))

export const tokenSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Le nom est requis"),
  image_url: z.string().url("URL d'image invalide"),
  attributes: tokenAttributeSchema,
  owner_id: z.string(),
})

export const createTokenSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  image_url: z.string().url("URL d'image invalide"),
  attributes: tokenAttributeSchema,
  owner_id: z.string(),
})

export const updateTokenSchema = z.object({
  sticker_id: z.string(),
})

// Fusion schema
export const fusionSchema = z.object({
  token_id: z.string(),
  sticker_id: z.string(),
  user_id: z.string(),
})

// Quest schemas
export const completeQuestSchema = z.object({
  quest_id: z.string(),
  user_id: z.string(),
})

// Staking schemas
export const stakeSchema = z.object({
  user_id: z.string(),
  amount: z.number().positive("Le montant doit être positif"),
})

// Booster schema
export const boosterOpenSchema = z.object({
  user_id: z.string(),
  booster_id: z.string().optional(),
})
