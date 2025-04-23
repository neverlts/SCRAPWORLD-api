import fs from "fs"
import path from "path"
import { createCanvas, loadImage } from "canvas"
import { v4 as uuidv4 } from "uuid"

// Types pour les éléments visuels
type Layer = {
  name: string
  elements: LayerElement[]
  position: { x: number; y: number }
}

type LayerElement = {
  name: string
  filename: string
  weight: number
}

type NFTAttribute = {
  trait_type: string
  value: string
}

type NFTMetadata = {
  name: string
  description: string
  image: string
  attributes: NFTAttribute[]
}

// Configuration
const width = 1000
const height = 1000
const dir = {
  input: path.join(__dirname, "../assets/layers"),
  output: path.join(__dirname, "../output"),
  outputImages: path.join(__dirname, "../output/images"),
  outputMetadata: path.join(__dirname, "../output/metadata"),
}
const collectionSize = 100
const collectionName = "ScrapWorld"
const description = "ScrapWorld NFT Collection - Fusion-ready digital collectibles"

// Assurez-vous que les répertoires de sortie existent
if (!fs.existsSync(dir.output)) fs.mkdirSync(dir.output)
if (!fs.existsSync(dir.outputImages)) fs.mkdirSync(dir.outputImages)
if (!fs.existsSync(dir.outputMetadata)) fs.mkdirSync(dir.outputMetadata)

// Fonction pour charger les couches depuis le répertoire des assets
async function loadLayers(): Promise<Layer[]> {
  const layers: Layer[] = []

  // Lire les dossiers de couches
  const layerFolders = fs.readdirSync(dir.input)

  for (const folder of layerFolders) {
    const layerPath = path.join(dir.input, folder)
    if (fs.statSync(layerPath).isDirectory()) {
      // Extraire le nom et la position de la couche depuis le nom du dossier
      // Format attendu: "01-Background-0-0" (index-nom-posX-posY)
      const folderParts = folder.split("-")
      const layerName = folderParts[1]
      const posX = Number.parseInt(folderParts[2] || "0")
      const posY = Number.parseInt(folderParts[3] || "0")

      const elements: LayerElement[] = []

      // Lire les éléments de la couche
      const files = fs.readdirSync(layerPath)
      for (const file of files) {
        if (file.endsWith(".png") || file.endsWith(".jpg")) {
          // Format attendu: "01-ElementName-10.png" (index-nom-poids.extension)
          const fileParts = path.basename(file, path.extname(file)).split("-")
          const elementName = fileParts[1]
          const weight = Number.parseInt(fileParts[2] || "10")

          elements.push({
            name: elementName,
            filename: path.join(layerPath, file),
            weight,
          })
        }
      }

      if (elements.length > 0) {
        layers.push({
          name: layerName,
          elements,
          position: { x: posX, y: posY },
        })
      }
    }
  }

  return layers
}

// Fonction pour sélectionner un élément aléatoire en fonction de son poids
function selectElement(elements: LayerElement[]): LayerElement {
  const totalWeight = elements.reduce((sum, element) => sum + element.weight, 0)
  let random = Math.floor(Math.random() * totalWeight)

  for (const element of elements) {
    random -= element.weight
    if (random < 0) {
      return element
    }
  }

  return elements[0] // Fallback
}

// Fonction pour générer un NFT unique
async function generateNFT(index: number, layers: Layer[]): Promise<NFTMetadata> {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext("2d")

  // Fond transparent
  ctx.clearRect(0, 0, width, height)

  const attributes: NFTAttribute[] = []

  // Dessiner chaque couche
  for (const layer of layers) {
    const element = selectElement(layer.elements)
    const image = await loadImage(element.filename)

    ctx.drawImage(image, layer.position.x, layer.position.y, image.width, image.height)

    attributes.push({
      trait_type: layer.name,
      value: element.name,
    })
  }

  // Générer un identifiant unique pour le NFT
  const tokenId = uuidv4()

  // Sauvegarder l'image
  const imageFileName = `${tokenId}.png`
  const imageBuffer = canvas.toBuffer("image/png")
  fs.writeFileSync(path.join(dir.outputImages, imageFileName), imageBuffer)

  // Créer les métadonnées
  const metadata: NFTMetadata = {
    name: `${collectionName} #${index + 1}`,
    description,
    image: `ipfs://<CID_PLACEHOLDER>/${imageFileName}`, // À remplacer par le vrai CID après upload IPFS
    attributes,
  }

  // Sauvegarder les métadonnées
  fs.writeFileSync(path.join(dir.outputMetadata, `${tokenId}.json`), JSON.stringify(metadata, null, 2))

  return metadata
}

// Fonction principale pour générer la collection
async function generateCollection() {
  console.log("Chargement des couches...")
  const layers = await loadLayers()

  console.log(`Génération de ${collectionSize} NFTs...`)
  const collection: NFTMetadata[] = []

  for (let i = 0; i < collectionSize; i++) {
    const metadata = await generateNFT(i, layers)
    collection.push(metadata)
    console.log(`NFT #${i + 1} généré`)
  }

  // Sauvegarder la collection complète
  fs.writeFileSync(path.join(dir.output, "collection.json"), JSON.stringify(collection, null, 2))

  console.log("Génération terminée!")
  console.log(`Images sauvegardées dans: ${dir.outputImages}`)
  console.log(`Métadonnées sauvegardées dans: ${dir.outputMetadata}`)
}

// Exécuter le générateur
generateCollection().catch(console.error)
