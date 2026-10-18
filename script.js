const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const weatherContainer = document.getElementById('weatherContainer');
const forecastEl = document.getElementById('forecast');
const errorEl = document.getElementById('error');

const weatherCodes = {
  0: "Céu limpo",
  1: "Principalmente limpo",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Neblina",
  48: "Neblina com geada",
  51: "Garoa leve",
  53: "Garoa",
  55: "Garoa forte",
  61: "Chuva leve",
  63: "Chuva",
  65: "Chuva forte",
  71: "Neve leve",
  73: "Neve",
  75: "Neve forte",
  80: "Pancadas de chuva",
  81: "Pancadas fortes",
  95: "Trovoada",
  96: "Trovoada com granizo"
};

function getWeatherDesc(code) {
  return weatherCodes[code] || "Condição desconhecida";
}

async function getCoordinates(city) {
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=pt&format=json`);
  const data = await res.json();
  if (!data.results || data.results.length === 0) throw new Error("Cidade não encontrada");
  return data.results[0];
}

async function getWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`;
  const res = await fetch(url);
  return res.json();
}

async function loadWeather(city) {
  errorEl.textContent = "";
  weatherContainer.style.display = "none";
  forecastEl.innerHTML = "";
  searchBtn.textContent = "Buscando...";
  searchBtn.disabled = true;

  try {
    const loc = await getCoordinates(city);
    const weather = await getWeather(loc.latitude, loc.longitude);

    // Current
    document.getElementById('cityName').textContent = `${loc.name}, ${loc.country}`;
    document.getElementById('temp').textContent = Math.round(weather.current.temperature_2m) + "°";
    document.getElementById('desc').textContent = getWeatherDesc(weather.current.weather_code);
    document.getElementById('humidity').textContent = weather.current.relative_humidity_2m + "%";
    document.getElementById('wind').textContent = Math.round(weather.current.wind_speed_10m) + " km/h";
    document.getElementById('feels').textContent = Math.round(weather.current.apparent_temperature) + "°";

    weatherContainer.style.display = "block";

    // Forecast
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    weather.daily.time.forEach((dateStr, i) => {
      const date = new Date(dateStr);
      const dayName = i === 0 ? "Hoje" : days[date.getDay()];
      const max = Math.round(weather.daily.temperature_2m_max[i]);
      const min = Math.round(weather.daily.temperature_2m_min[i]);
      const desc = getWeatherDesc(weather.daily.weather_code[i]);

      const card = document.createElement('div');
      card.className = 'day-card';
      card.innerHTML = `
        <div class="day">${dayName}</div>
        <div style="font-size:1.4rem;margin:0.3rem 0">${getEmoji(weather.daily.weather_code[i])}</div>
        <div class="temp-small">${max}° / ${min}°</div>
        <div style="font-size:0.75rem;color:#94a3b8;margin-top:0.3rem">${desc}</div>
      `;
      forecastEl.appendChild(card);
    });

  } catch (err) {
    errorEl.textContent = err.message || "Erro ao buscar o clima. Tente novamente.";
  } finally {
    searchBtn.textContent = "Buscar";
    searchBtn.disabled = false;
  }
}

function getEmoji(code) {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code === 45 || code === 48) return "🌫️";
  if (code >= 51 && code <= 55) return "🌦️";
  if (code >= 61 && code <= 65) return "🌧️";
  if (code >= 71 && code <= 75) return "❄️";
  if (code >= 80 && code <= 82) return "🌧️";
  if (code >= 95) return "⛈️";
  return "☁️";
}

searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (city) loadWeather(city);
});

cityInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') searchBtn.click();
});

// Carrega automaticamente São Paulo
loadWeather("São Paulo");