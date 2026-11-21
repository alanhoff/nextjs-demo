# Sources and credits

The places in Night Atlas are real. Each [site record](../lib/catalog.ts) links to the National Park Service’s observing guidance. Coordinates mark the suggested viewing spot, not the location of the photographer. Conditions and closures change; check the park before setting out.

## Photographs

Local WebP editions of National Park Service photographs are used throughout the app and in the README screenshot. NPS identifies photographs credited to NPS without a copyright symbol as public domain. This does not extend to all material on its website. See the [NPS image usage notice](https://www.nps.gov/media/photo/gallery-item.htm?gid=275B0E39-155D-451F-6752-DA81D6E6018D&id=274e8cfd-155d-451f-67b0-ecf4da899a97).

| Edition                               | Credit               | Original and context                                                                                                                                                                       |
| ------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cover: Sunrise Point at night         | NPS / Keith Moore    | [Photograph](https://www.nps.gov/common/uploads/cropped_image/primary/184F0F44-C369-DD72-9C001B1B4BF282B8.jpg) · [See the Night Sky](https://www.nps.gov/thingstodo/see-the-night-sky.htm) |
| Joshua Tree: Quail Springs            | NPS / Emily Hassell  | [Photograph](https://www.nps.gov/common/uploads/structured_data/306D0D93-9CCA-76E1-AD48268F8D7A7E3E.jpg) · [Joshua Tree](https://www.nps.gov/jotr/index.htm)                               |
| Big Bend: Chisos Mountains            | NPS / B. Trester     | [Photograph](https://www.nps.gov/common/uploads/structured_data/CDAD3984-DB8E-117C-DFA6B184E5058201.jpg) · [Big Bend](https://www.nps.gov/bibe/index.htm)                                  |
| Bryce Canyon: amphitheater at sunrise | NPS / Peter Densmore | [Photograph](https://www.nps.gov/common/uploads/structured_data/61F08520-E14F-18F2-BF5F3D89482631BD.jpg) · [Bryce Canyon](https://www.nps.gov/brca/index.htm)                              |
| Great Basin: Wheeler Peak             | NPS                  | [Photograph](https://npgallery.nps.gov/GetAsset/0D575687-1DD8-B71B-0BEB-5DB03EFAF04B) · [NPS Gallery record](https://npgallery.nps.gov/AssetDetail/0D575687-1DD8-B71B-0BEB-5DB03EFAF04B)   |
| Death Valley: Mesquite Flat dunes     | NPS                  | [Photograph](https://www.nps.gov/common/uploads/structured_data/65DDA8C1-A47E-F7C3-656E1533A0ECD4C0.jpg) · [Death Valley](https://www.nps.gov/deva/index.htm)                              |
| Acadia: night on the water            | NPS / Kelsey Graczyk | [Photograph](https://www.nps.gov/common/uploads/structured_data/5BBC4ED2-F4B2-FF45-A0FB1ECECE8EC285.jpg) · [Acadia](https://www.nps.gov/acad/index.htm)                                    |

## Moon phases and type

The U.S. Naval Observatory’s [Astronomical Applications API](https://aa.usno.navy.mil/data/api) supplies primary phase times. The checked-in [fallback table](../app/sky-notes/usno-2026-2028.json) contains its published results for 2026–2028 and enough events in January 2029 to finish a December search. These times are UTC, not local moonrise or moonset.

Instrument Serif and DM Sans are self-hosted Latin font subsets from Fontsource. Their SIL Open Font Licenses are included alongside the files: [Instrument Serif](../app/fonts/Instrument-Serif-LICENSE.txt) and [DM Sans](../app/fonts/DM-Sans-LICENSE.txt).
