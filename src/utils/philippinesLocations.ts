// A controlled starter dataset for Philippine delivery addresses. Extend this
// map from the official PSGC dataset as the store expands; users cannot type
// arbitrary region/province/city/barangay values into these fields.
export const PHILIPPINE_LOCATIONS: Record<string, Record<string, Record<string, string[]>>> = {
  "National Capital Region": {
    "Metro Manila": {
      "Quezon City": ["Batasan Hills", "Commonwealth", "Holy Spirit", "Novaliches Proper"],
      "Manila": ["Ermita", "Malate", "Sampaloc", "Tondo"],
      "Makati": ["Bel-Air", "Poblacion", "San Lorenzo", "Urdaneta"],
    },
  },
  "Central Luzon": {
    "Bulacan": { "Malolos": ["Atlag", "Bulihan", "Santo Cristo"], "Baliwag": ["Bagong Nayon", "Poblacion", "Tiaong"] },
    "Pampanga": { "Angeles": ["Balibago", "Cutcut", "Pampang"], "San Fernando": ["Dolores", "Sindalan", "Santo Rosario"] },
  },
  "CALABARZON": {
    "Cavite": { "Bacoor": ["Molino I", "Molino III", "Talaba"], "Dasmarinas": ["Burol", "Langkaan", "Salitran"] },
    "Laguna": { "Santa Rosa": ["Balibago", "Dila", "Tagapo"], "Calamba": ["Canlubang", "Real", "Turup" ] },
  },
  "Central Visayas": {
    "Cebu": { "Cebu City": ["Apas", "Lahug", "Mabolo", "Talamban"], "Lapu-Lapu City": ["Basak", "Pajo", "Pusok"] },
  },
  "Davao Region": {
    "Davao del Sur": { "Davao City": ["Buhangin", "Ma-a", "Matina", "Poblacion"] },
  },
};

export const PHILIPPINE_REGIONS = Object.keys(PHILIPPINE_LOCATIONS);
