import { useEffect, useState } from "react";

export type PSGCPlace = { code: string; name: string };
const BASE = "https://psgc.gitlab.io/api";
export const fetchPhilippinePlaces = async (path: string): Promise<PSGCPlace[]> => {
  const response = await fetch(`${BASE}${path}`);
  if (!response.ok) throw new Error("Unable to load Philippine location data.");
  return response.json();
};

export function usePhilippineLocations() {
  const [regions, setRegions] = useState<PSGCPlace[]>([]);
  const [provinces, setProvinces] = useState<PSGCPlace[]>([]);
  const [cities, setCities] = useState<PSGCPlace[]>([]);
  const [barangays, setBarangays] = useState<PSGCPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [regionCode, setRegionCode] = useState("");
  const [provinceCode, setProvinceCode] = useState("");
  const [cityCode, setCityCode] = useState("");

  useEffect(() => { fetchPhilippinePlaces("/regions/").then(setRegions).catch((err) => setError(err instanceof Error ? err.message : "Unable to load regions.")).finally(() => setLoading(false)); }, []);
  useEffect(() => { setProvinces([]); setProvinceCode(""); setCities([]); setCityCode(""); setBarangays([]); if (!regionCode) return; setLoading(true); fetchPhilippinePlaces(`/regions/${regionCode}/provinces/`).then(async (items) => { if (items.length) setProvinces(items); else setProvinces([{ code: regionCode, name: "Metro Manila" }]); }).catch((err) => setError(err instanceof Error ? err.message : "Unable to load provinces.")).finally(() => setLoading(false)); }, [regionCode]);
  useEffect(() => { setCities([]); setCityCode(""); setBarangays([]); if (!provinceCode) return; setLoading(true); const path = provinceCode === regionCode ? `/regions/${regionCode}/cities-municipalities/` : `/provinces/${provinceCode}/cities-municipalities/`; fetchPhilippinePlaces(path).then(setCities).catch((err) => setError(err instanceof Error ? err.message : "Unable to load cities.")).finally(() => setLoading(false)); }, [provinceCode, regionCode]);
  useEffect(() => { setBarangays([]); if (!cityCode) return; setLoading(true); fetchPhilippinePlaces(`/cities-municipalities/${cityCode}/barangays/`).then(setBarangays).catch((err) => setError(err instanceof Error ? err.message : "Unable to load barangays.")).finally(() => setLoading(false)); }, [cityCode]);
  return { regions, provinces, cities, barangays, loading, error, regionCode, provinceCode, cityCode, setRegionCode, setProvinceCode, setCityCode };
}
