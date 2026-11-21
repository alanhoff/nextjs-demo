import { cacheLife } from "next/cache";

export const regions = ["West", "Southwest", "Northeast"] as const;

export type Site = {
  code: string;
  slug: string;
  name: string;
  state: string;
  region: (typeof regions)[number];
  image: string;
  imageAlt: string;
  description: string;
  viewpoint: string;
  coordinates: string;
  notes: string[];
  sourceUrl: string;
};

export const sites: Site[] = [
  {
    code: "JOTR",
    slug: "joshua-tree",
    name: "Joshua Tree",
    state: "California",
    region: "West",
    image: "/images/joshua-tree.webp",
    imageAlt: "Joshua trees silhouetted against pink and lavender dusk at Quail Springs",
    description:
      "At Hidden Valley, rounded granite boulders and the crooked arms of Joshua trees cut into the sky.",
    viewpoint: "Hidden Valley",
    coordinates: "34.011° N, 116.168° W",
    notes: [
      "Hidden Valley has a designated stargazing lot. Set up beside your car rather than walking the trail; the park asks night viewers to stay within 20 feet of their vehicle.",
      "For less glow from the towns to the north, try a marked pullout on Pinto Basin Road between the Cholla Cactus Garden and Cottonwood.",
    ],
    sourceUrl: "https://www.nps.gov/jotr/planyourvisit/stargazing.htm",
  },
  {
    code: "BIBE",
    slug: "big-bend",
    name: "Big Bend",
    state: "Texas",
    region: "Southwest",
    image: "/images/big-bend.webp",
    imageAlt: "Chisos Mountains above a wide, scrub-covered desert plain",
    description:
      "Look west from Sotol Vista. The notch in the distant mesa is the mouth of Santa Elena Canyon.",
    viewpoint: "Sotol Vista",
    coordinates: "29.215° N, 103.377° W",
    notes: [
      "Turn off the Ross Maxwell Scenic Drive onto the paved loop at Sotol Vista. Arrive before sunset to pick out the canyon before the mesa becomes a silhouette.",
      "Bring a printed sky chart and a red light. Try using the curve of the Big Dipper’s handle to find Arcturus before looking up the rest of the sky.",
    ],
    sourceUrl: "https://www.nps.gov/thingstodo/night-sky-big-bend.htm",
  },
  {
    code: "BRCA",
    slug: "bryce-canyon",
    name: "Bryce Canyon",
    state: "Utah",
    region: "Southwest",
    image: "/images/bryce-canyon.webp",
    imageAlt: "Red hoodoos of Bryce Amphitheater lit by the rising sun",
    description:
      "Limestone pinnacles stand below the rim at Paria View. In the last light you can trace the valley out past the cliffs.",
    viewpoint: "Paria View",
    coordinates: "37.595° N, 112.171° W",
    notes: [
      "Use the paved overlook rather than descending into the hoodoos after dark. Paria View sits off the spur road to Bryce Point.",
      "The Paria View road closes to cars in winter. Sunset Point and Sunrise Point are two other rim overlooks the park recommends for stargazing.",
    ],
    sourceUrl: "https://www.nps.gov/thingstodo/stargazing-at-bryce-canyon.htm",
  },
  {
    code: "GRBA",
    slug: "great-basin",
    name: "Great Basin",
    state: "Nevada",
    region: "West",
    image: "/images/great-basin.webp",
    imageAlt: "The Milky Way rising above Wheeler Peak",
    description:
      "A short path from the Lehman Caves visitor center leads to an amphitheater built for watching the sky.",
    viewpoint: "Astronomy Amphitheater",
    coordinates: "39.009° N, 114.218° W",
    notes: [
      "On a ranger program night, park at the Lehman Caves visitor center and follow the red lights. Leave white flashlights off at the amphitheater.",
      "For a night on your own, the park also suggests Mather Overlook on Wheeler Peak Scenic Drive. Neither spot permits overnight camping.",
    ],
    sourceUrl: "https://www.nps.gov/grba/planyourvisit/great-basin-stargazing.htm",
  },
  {
    code: "DEVA",
    slug: "death-valley",
    name: "Death Valley",
    state: "California",
    region: "West",
    image: "/images/death-valley.webp",
    imageAlt: "Low light grazing the ridges of Mesquite Flat Sand Dunes",
    description:
      "Wind shifts the ridges of the Mesquite Flat dunes. Beyond them the mountains make a second, darker horizon.",
    viewpoint: "Mesquite Flat Sand Dunes",
    coordinates: "36.607° N, 117.116° W",
    notes: [
      "The dune field is just east of Stovepipe Wells on CA-190. There is a paved parking lot but no marked trail across the sand.",
      "Look for a patch of open sky clear of the mountains. At low sites like Badwater Basin, the ridgelines can hide stars close to the horizon.",
    ],
    sourceUrl: "https://www.nps.gov/deva/night-exploration.htm",
  },
  {
    code: "ACAD",
    slug: "acadia",
    name: "Acadia",
    state: "Maine",
    region: "Northeast",
    image: "/images/acadia.webp",
    imageAlt: "Stars over a wooded cove reflected in still water",
    description:
      "From Sand Beach, Great Head and Otter Cliffs frame a patch of open Atlantic. The breakers are easier to hear than to see.",
    viewpoint: "Sand Beach",
    coordinates: "44.330° N, 68.184° W",
    notes: [
      "From the parking lot on Park Loop Road, a long staircase leads down to the beach. Scout the steps in daylight and bring a layer for the wind.",
      "Spread a blanket above the tide line and face out toward Old Soaker. Night viewing is allowed here, but not camping or overnight parking.",
    ],
    sourceUrl: "https://www.nps.gov/thingstodo/stargazing-sand-beach.htm",
  },
];

export async function getSites() {
  "use cache";
  cacheLife("days");
  return sites;
}

export async function getSite(slug: string) {
  return (await getSites()).find((site) => site.slug === slug);
}

export function filterSites(list: Site[], region = "", q = "") {
  const term = q.trim().toLowerCase();
  const area = region.trim().toLowerCase();
  return list.filter(
    (site) =>
      (!area || site.region.toLowerCase() === area) &&
      (site.name.toLowerCase().includes(term) ||
        site.state.toLowerCase().includes(term) ||
        site.viewpoint.toLowerCase().includes(term)),
  );
}
