// Location details and ratings are maintained manually; no Google API is connected.
export const clubLocations = [
  {
    id: 'cemara',
    name: 'Black Padel Cemara',
    address:
      'Jl. Cemara No. 51, Pulo Brayan Bengkel Baru, Medan Timur, Kota Medan, Sumatera Utara 20237, Indonesia.',
    mapsUrl: 'https://maps.app.goo.gl/a5b6EUoXWiCnqQVj8',
    coordinates: [98.6904522, 3.6294502],
    openingHours: '06.00–00.00',
    rating: '4.8'
  },
  {
    id: 's-parman',
    name: 'Black Padel S. Parman',
    address:
      'Jl. S. Parman No.269-283, Petisah Hulu, Kec. Medan Baru, Kota Medan, Sumatera Utara 20152',
    mapsUrl: 'https://maps.google.com/maps?ftid=0x3031310010a25ae9:0x14bf370c5ed5f418',
    coordinates: [98.6674286, 3.5802102],
    openingHours: '06.00–00.00',
    rating: '4.9'
  }
] as const;
