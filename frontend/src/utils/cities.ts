export interface City {
  name: string;
  state: string;
  label: string; // "City, State" format
  lat: number;
  lng: number;
}

export const popularCities: City[] = [
  { name: "New York", state: "NY", label: "New York, NY", lat: 40.7128, lng: -74.0060 },
  { name: "Los Angeles", state: "CA", label: "Los Angeles, CA", lat: 34.0522, lng: -118.2437 },
  { name: "Chicago", state: "IL", label: "Chicago, IL", lat: 41.8781, lng: -87.6298 },
  { name: "Houston", state: "TX", label: "Houston, TX", lat: 29.7604, lng: -95.3698 },
  { name: "Phoenix", state: "AZ", label: "Phoenix, AZ", lat: 33.4484, lng: -112.0740 },
  { name: "Philadelphia", state: "PA", label: "Philadelphia, PA", lat: 39.9526, lng: -75.1652 },
  { name: "San Antonio", state: "TX", label: "San Antonio, TX", lat: 29.4241, lng: -98.4936 },
  { name: "San Diego", state: "CA", label: "San Diego, CA", lat: 32.7157, lng: -117.1611 },
  { name: "Dallas", state: "TX", label: "Dallas, TX", lat: 32.7767, lng: -96.7970 },
  { name: "San Jose", state: "CA", label: "San Jose, CA", lat: 37.3382, lng: -121.8863 },
  { name: "Austin", state: "TX", label: "Austin, TX", lat: 30.2672, lng: -97.7431 },
  { name: "Jacksonville", state: "FL", label: "Jacksonville, FL", lat: 30.3322, lng: -81.6557 },
  { name: "Fort Worth", state: "TX", label: "Fort Worth, TX", lat: 32.7555, lng: -97.3308 },
  { name: "Columbus", state: "OH", label: "Columbus, OH", lat: 39.9612, lng: -82.9988 },
  { name: "San Francisco", state: "CA", label: "San Francisco, CA", lat: 37.7749, lng: -122.4194 },
  { name: "Charlotte", state: "NC", label: "Charlotte, NC", lat: 35.2271, lng: -80.8431 },
  { name: "Indianapolis", state: "IN", label: "Indianapolis, IN", lat: 39.7684, lng: -86.1581 },
  { name: "Seattle", state: "WA", label: "Seattle, WA", lat: 47.6062, lng: -122.3321 },
  { name: "Denver", state: "CO", label: "Denver, CO", lat: 39.7392, lng: -104.9903 },
  { name: "Washington", state: "DC", label: "Washington, DC", lat: 38.9072, lng: -77.0369 },
  { name: "Boston", state: "MA", label: "Boston, MA", lat: 42.3601, lng: -71.0589 },
  { name: "Nashville", state: "TN", label: "Nashville, TN", lat: 36.1627, lng: -86.7816 },
  { name: "Detroit", state: "MI", label: "Detroit, MI", lat: 42.3314, lng: -83.0458 },
  { name: "Oklahoma City", state: "OK", label: "Oklahoma City, OK", lat: 35.4676, lng: -97.5164 },
  { name: "Portland", state: "OR", label: "Portland, OR", lat: 45.5152, lng: -122.6784 },
  { name: "Las Vegas", state: "NV", label: "Las Vegas, NV", lat: 36.1699, lng: -115.1398 },
  { name: "Memphis", state: "TN", label: "Memphis, TN", lat: 35.1495, lng: -90.0490 },
  { name: "Louisville", state: "KY", label: "Louisville, KY", lat: 38.2527, lng: -85.7585 },
  { name: "Baltimore", state: "MD", label: "Baltimore, MD", lat: 39.2904, lng: -76.6122 },
  { name: "Milwaukee", state: "WI", label: "Milwaukee, WI", lat: 43.0389, lng: -87.9065 },
  { name: "Albuquerque", state: "NM", label: "Albuquerque, NM", lat: 35.0844, lng: -106.6504 },
  { name: "Tucson", state: "AZ", label: "Tucson, AZ", lat: 32.2226, lng: -110.9747 },
  { name: "Fresno", state: "CA", label: "Fresno, CA", lat: 36.7378, lng: -119.7871 },
  { name: "Mesa", state: "AZ", label: "Mesa, AZ", lat: 33.4152, lng: -111.8315 },
  { name: "Sacramento", state: "CA", label: "Sacramento, CA", lat: 38.5816, lng: -121.4944 },
  { name: "Atlanta", state: "GA", label: "Atlanta, GA", lat: 33.7490, lng: -84.3880 },
  { name: "Kansas City", state: "MO", label: "Kansas City, MO", lat: 39.0997, lng: -94.5786 },
  { name: "Colorado Springs", state: "CO", label: "Colorado Springs, CO", lat: 38.8339, lng: -104.8214 },
  { name: "Miami", state: "FL", label: "Miami, FL", lat: 25.7617, lng: -80.1918 },
  { name: "Raleigh", state: "NC", label: "Raleigh, NC", lat: 35.7796, lng: -78.6382 },
  { name: "Omaha", state: "NE", label: "Omaha, NE", lat: 41.2565, lng: -95.9345 },
  { name: "Long Beach", state: "CA", label: "Long Beach, CA", lat: 33.7701, lng: -118.1937 },
  { name: "Virginia Beach", state: "VA", label: "Virginia Beach, VA", lat: 36.8529, lng: -75.9780 },
  { name: "Oakland", state: "CA", label: "Oakland, CA", lat: 37.8044, lng: -122.2712 },
  { name: "Minneapolis", state: "MN", label: "Minneapolis, MN", lat: 44.9778, lng: -93.2650 },
  { name: "Tulsa", state: "OK", label: "Tulsa, OK", lat: 36.1540, lng: -95.9928 },
  { name: "Tampa", state: "FL", label: "Tampa, FL", lat: 27.9506, lng: -82.4572 },
  { name: "Arlington", state: "TX", label: "Arlington, TX", lat: 32.7357, lng: -97.1081 },
  { name: "New Orleans", state: "LA", label: "New Orleans, LA", lat: 29.9511, lng: -90.0715 },
  { name: "Cleveland", state: "OH", label: "Cleveland, OH", lat: 41.4993, lng: -81.6944 },
  { name: "Pittsburgh", state: "PA", label: "Pittsburgh, PA", lat: 40.4406, lng: -79.9959 },
  { name: "Cincinnati", state: "OH", label: "Cincinnati, OH", lat: 39.1031, lng: -84.5120 },
  { name: "Orlando", state: "FL", label: "Orlando, FL", lat: 28.5383, lng: -81.3792 },
  { name: "St. Louis", state: "MO", label: "St. Louis, MO", lat: 38.6270, lng: -90.1994 },
  { name: "Salt Lake City", state: "UT", label: "Salt Lake City, UT", lat: 40.7608, lng: -111.8910 },
  { name: "Richmond", state: "VA", label: "Richmond, VA", lat: 37.5407, lng: -77.4360 },
  { name: "Buffalo", state: "NY", label: "Buffalo, NY", lat: 42.8864, lng: -78.8784 },
];

// Helper function to calculate distance between two coordinates (Haversine formula)
export function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Find the closest city to given coordinates
export function findClosestCity(lat: number, lng: number): City {
  let closestCity = popularCities[0];
  let minDistance = getDistance(lat, lng, closestCity.lat, closestCity.lng);

  for (const city of popularCities) {
    const distance = getDistance(lat, lng, city.lat, city.lng);
    if (distance < minDistance) {
      minDistance = distance;
      closestCity = city;
    }
  }

  return closestCity;
}
