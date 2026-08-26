export type MeteoCategory = "chaud" | "frais" | "froid" | "pluvieux";

export type WeatherData = {
  temp: number;         // °C
  code: number;         // WMO weather code
  label: string;        // description humaine
  meteo: MeteoCategory; // catégorie simplifiée
};

// WMO code → label FR
function codeLabel(code: number): string {
  if (code === 0) return "Ciel dégagé";
  if (code === 1) return "Principalement clair";
  if (code === 2) return "Partiellement nuageux";
  if (code === 3) return "Couvert";
  if ([45, 48].includes(code)) return "Brouillard";
  if ([51, 53, 55].includes(code)) return "Bruine";
  if ([61, 63, 65].includes(code)) return "Pluie";
  if ([71, 73, 75, 77].includes(code)) return "Neige";
  if ([80, 81, 82].includes(code)) return "Averses";
  if ([85, 86].includes(code)) return "Averses de neige";
  if ([95, 96, 99].includes(code)) return "Orage";
  return "Variable";
}

function codeToMeteo(code: number, temp: number): MeteoCategory {
  if ([45, 48, 51, 53, 55, 61, 63, 65, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99].includes(code)) {
    return "pluvieux";
  }
  if (temp >= 18) return "chaud";
  if (temp >= 5) return "frais";
  return "froid";
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Météo indisponible");
  const data = await res.json();
  const temp = Math.round(data.current.temperature_2m);
  const code = data.current.weathercode;
  return {
    temp,
    code,
    label: codeLabel(code),
    meteo: codeToMeteo(code, temp),
  };
}

export async function getLocationWeather(): Promise<WeatherData | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const data = await fetchWeather(pos.coords.latitude, pos.coords.longitude);
          resolve(data);
        } catch {
          resolve(null);
        }
      },
      () => resolve(null),
      { timeout: 5000 }
    );
  });
}
