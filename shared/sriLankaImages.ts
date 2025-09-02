// Sri Lanka Region Image Mapping
// Free stock images from Unsplash for different regions and experiences

export interface RegionImageMapping {
  region: string;
  images: string[];
  keywords: string[];
  description: string;
}

export const sriLankaImageMapping: RegionImageMapping[] = [
  // South Coast - Beaches, Stilt Fishermen, Palm Coast
  {
    region: "southern",
    images: [
      "https://images.unsplash.com/photo-1605540436563-5bca919ae766?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Sri Lankan stilt fishermen
      "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Galle Fort coastal view
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Tropical beach with palms
      "https://images.unsplash.com/photo-1548013146-72479768bada?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Coastal sunset
    ],
    keywords: ["galle", "mirissa", "unawatuna", "weligama", "matara", "tangalle", "beach", "coast", "surf"],
    description: "South Coast beaches, stilt fishermen, and palm-fringed coastline"
  },

  // Hill Country - Tea Plantations, Trains, Misty Hills
  {
    region: "central",
    images: [
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Tea plantation workers
      "https://images.unsplash.com/photo-1590736969955-71cc94901144?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Hill country train
      "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Misty tea hills
      "https://images.unsplash.com/photo-1548013146-72479768bada?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Mountain landscape
    ],
    keywords: ["kandy", "nuwara eliya", "ella", "hatton", "badulla", "tea", "plantation", "train", "hill", "mountain"],
    description: "Hill Country tea estates, scenic train rides, and misty mountains"
  },

  // Cultural Triangle - Temples, Sigiriya Rock, Stupas
  {
    region: "north central",
    images: [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Sigiriya Rock Fortress
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Ancient Buddhist temple
      "https://images.unsplash.com/photo-1590736969955-71cc94901144?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Buddhist stupa
      "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Ancient ruins at sunset
    ],
    keywords: ["anuradhapura", "sigiriya", "polonnaruwa", "dambulla", "temple", "ancient", "cultural", "heritage", "rock"],
    description: "Ancient temples, Sigiriya Rock fortress, and cultural heritage sites"
  },

  // East Coast - Surf, White Sand, Fishing Boats
  {
    region: "eastern",
    images: [
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Arugam Bay surf waves
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // White sand beach
      "https://images.unsplash.com/photo-1605540436563-5bca919ae766?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Traditional fishing boats
      "https://images.unsplash.com/photo-1548013146-72479768bada?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Eastern coast palm trees
    ],
    keywords: ["trincomalee", "arugam bay", "batticaloa", "surf", "beach", "fishing", "boat", "wave", "coast"],
    description: "East Coast surf breaks, pristine beaches, and traditional fishing communities"
  },

  // North - Kovils, Lagoons, Local Culture
  {
    region: "northern",
    images: [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Colorful Hindu kovil
      "https://images.unsplash.com/photo-1590736969955-71cc94901144?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Jaffna lagoon
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Tamil cultural site
      "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Traditional architecture
    ],
    keywords: ["jaffna", "mannar", "kilinochchi", "kovil", "lagoon", "culture", "tamil", "hindu", "temple"],
    description: "Northern Tamil culture, colorful kovils, and serene lagoons"
  },

  // West Coast - Negombo, Colombo, Kalpitiya
  {
    region: "western",
    images: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Negombo lagoon
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Kalpitiya kitesurfing
      "https://images.unsplash.com/photo-1605540436563-5bca919ae766?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Colombo cityscape
      "https://images.unsplash.com/photo-1548013146-72479768bada?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Fish market scene
    ],
    keywords: ["colombo", "negombo", "kalpitiya", "lagoon", "kite", "surf", "city", "beach", "urban"],
    description: "West Coast lagoons, Colombo city life, and water sports"
  },

  // Safari Zones - Elephants, Leopards, Jeep Safaris
  {
    region: "uva",
    images: [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Sri Lankan elephant
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Leopard in Sri Lankan jungle
      "https://images.unsplash.com/photo-1590736969955-71cc94901144?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Safari jeep in Yala
      "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Wildlife landscape
    ],
    keywords: ["yala", "wilpattu", "minneriya", "safari", "elephant", "leopard", "wildlife", "national park"],
    description: "Wildlife safaris, elephants, leopards, and national park adventures"
  },

  // North Western Province
  {
    region: "north western",
    images: [
      "https://images.unsplash.com/photo-1605540436563-5bca919ae766?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Coconut plantation
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Coastal area
      "https://images.unsplash.com/photo-1548013146-72479768bada?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Beach scene
    ],
    keywords: ["kurunegala", "puttalam", "chilaw", "coconut", "beach", "coast"],
    description: "Coconut triangle region with coastal beauty"
  },

  // Sabaragamuwa Province
  {
    region: "sabaragamuwa",
    images: [
      "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Mountain forest
      "https://images.unsplash.com/photo-1590736969955-71cc94901144?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Gem mining area
      "https://images.unsplash.com/photo-1548013146-72479768bada?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200", // Rivers and waterfalls
    ],
    keywords: ["ratnapura", "kegalle", "gem", "mountain", "forest", "river"],
    description: "Gem country with lush forests and rivers"
  }
];

// Fallback image for unrecognized regions
export const fallbackSriLankaImage = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200";

// Function to get appropriate image for a trip
export function getSriLankanTripImage(region: string, fromLocation: string = "", toLocation: string = ""): string {
  const normalizedRegion = region.toLowerCase();
  const searchText = `${fromLocation} ${toLocation}`.toLowerCase();
  
  // Find matching region mapping
  const regionMapping = sriLankaImageMapping.find(mapping => {
    // Check direct region match first
    if (mapping.region === normalizedRegion) return true;
    
    // Check if any keywords match the locations or region
    return mapping.keywords.some(keyword => 
      normalizedRegion.includes(keyword) || 
      searchText.includes(keyword)
    );
  });
  
  if (regionMapping && regionMapping.images.length > 0) {
    // Return a random image from the matching region
    const randomIndex = Math.floor(Math.random() * regionMapping.images.length);
    return regionMapping.images[randomIndex];
  }
  
  // Return fallback image if no match found
  return fallbackSriLankaImage;
}

// Function to get all available regions
export function getSriLankanRegions(): string[] {
  return sriLankaImageMapping.map(mapping => mapping.region);
}

// Function to get region description
export function getSriLankanRegionDescription(region: string): string {
  const mapping = sriLankaImageMapping.find(m => m.region === region.toLowerCase());
  return mapping?.description || "Beautiful Sri Lankan destination";
}