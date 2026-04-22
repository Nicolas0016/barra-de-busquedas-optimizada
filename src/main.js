import { TriePriority } from "./utils/triePriority.js";

const search = document.getElementById("search");
const resultsTrie = document.getElementById("resultsTrie");
const timeTrie = document.getElementById("timeTrie");
const resultsTradicional = document.getElementById("resultsTradicional");
const timeTradicional = document.getElementById("timeTradicional");
const cantidad = document.getElementById("cantidad");
const addWordContainer = document.getElementById("addWordContainer");
const addWordBtn = document.getElementById("addWordBtn");
const addWordText = document.getElementById("addWordText");

const randomQty = document.getElementById("randomQty");
const generateBtn = document.getElementById("generateBtn");
const generateStatus = document.getElementById("generateStatus");

const workerTrie = new Worker("./workers/workerTrie.js", { type: "module" });
const workerTradicional = new Worker("./workers/workerTradicional.js", {
  type: "module",
});

let trieReady = false;
let tradicionalReady = false;
let currentQuery = "";

// Para el gráfico de Búsqueda
let performanceChart;
const chartDataLengths = {};

// Para el gráfico de Inserción
let insertDataChart;
const insertChartData = {};
let insertionKeysHistory = []; // Para mantener solo los ultimos 2

// Tiempos para inserción masiva
let insertTimeTrie = null;
let insertTimeTrad = null;
let pendingInsertQty = 0;

function checkInsertTimes() {
  if (insertTimeTrie !== null && insertTimeTrad !== null) {
    generateStatus.innerHTML = `¡Éxito! Trie tardó <strong>${insertTimeTrie.toFixed(2)} ms</strong> y Búsqueda Lineal <strong>${insertTimeTrad.toFixed(2)} ms</strong>.`;
    generateBtn.disabled = false;
    
    // Graficamos!
    if (!insertChartData[pendingInsertQty]) {
      insertionKeysHistory.push(pendingInsertQty);
    }
    insertChartData[pendingInsertQty] = {
      trie: insertTimeTrie,
      tradicional: insertTimeTrad
    };

    if (insertionKeysHistory.length > 2) {
      const oldestKey = insertionKeysHistory.shift();
      delete insertChartData[oldestKey];
    }
    
    renderInsertChart();

    if (currentQuery) triggerSearch(currentQuery);
    setTimeout(() => { generateStatus.innerText = ""; }, 8000);
  }
}

function clearInsertChart() {
  Object.keys(insertChartData).forEach((k) => delete insertChartData[k]);
  insertionKeysHistory = [];
  renderInsertChart();
}

function clearPerformanceChart() {
  Object.keys(chartDataLengths).forEach((k) => delete chartDataLengths[k]);
  renderChart();
}

function renderInsertChart() {
  const sortedQty = Object.keys(insertChartData)
    .map(Number)
    .sort((a, b) => a - b);

  insertDataChart.data.labels = sortedQty;
  insertDataChart.data.datasets[0].data = sortedQty.map(
    (q) => insertChartData[q].trie,
  );
  insertDataChart.data.datasets[1].data = sortedQty.map(
    (q) => insertChartData[q].tradicional,
  );
  insertDataChart.update();
}

function initChart() {
  const ctx = document.getElementById("performanceChart").getContext("2d");
  Chart.defaults.color = "#9ca3af";
  Chart.defaults.borderColor = "#1f2937";

  performanceChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Trie (ms)",
          data: [],
          borderColor: "#6366f1",
          backgroundColor: "rgba(99, 102, 241, 0.5)",
          tension: 0.3,
          pointRadius: 5,
        },
        {
          label: "Búsqueda Lineal (ms)",
          data: [],
          borderColor: "#eab308",
          backgroundColor: "rgba(234, 179, 8, 0.5)",
          borderDash: [5, 5],
          tension: 0.3,
          pointRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: { display: true, text: "Longitud de la palabra" },
        },
        y: {
          title: { display: true, text: "Tiempo de Búsqueda (ms)" },
          beginAtZero: true,
        },
      },
    },
  });

  const ctxInsert = document.getElementById("insertDataChart").getContext("2d");
  insertDataChart = new Chart(ctxInsert, {
    type: "bar", // We use a bar chart (or line could be used) but line is good for ranges. Let's use line for consistency.
    data: {
      labels: [],
      datasets: [
        {
          label: "Trie (ms)",
          data: [],
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.5)",
          tension: 0.3,
          pointRadius: 6,
        },
        {
          label: "Búsqueda Lineal (ms)",
          data: [],
          borderColor: "#ef4444",
          backgroundColor: "rgba(239, 68, 68, 0.5)",
          borderDash: [5, 5],
          tension: 0.3,
          pointRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: { display: true, text: "Cantidad de Elementos (Tenga en cuenta el multiplicador interno)" },
        },
        y: {
          title: { display: true, text: "Tiempo de Inserción (ms)" },
          beginAtZero: true,
        },
      },
    },
  });
}

function renderChart() {
  const sortedLengths = Object.keys(chartDataLengths)
    .map(Number)
    .sort((a, b) => a - b);

  performanceChart.data.labels = sortedLengths;
  performanceChart.data.datasets[0].data = sortedLengths.map(
    (l) => chartDataLengths[l].trie,
  );
  performanceChart.data.datasets[1].data = sortedLengths.map(
    (l) => chartDataLengths[l].tradicional,
  );
  performanceChart.update();
}

function updateChart(val, type, time) {
  if (!val) return;
  const len = val.length;

  if (!chartDataLengths[len]) {
    chartDataLengths[len] = { trie: null, tradicional: null };
  }

  if (type === "trie") chartDataLengths[len].trie = time;
  if (type === "tradicional") chartDataLengths[len].tradicional = time;

  renderChart();
}

// Carga inicial de datos usando localStorage para cache
async function loadAndInitWorkers() {
  cantidad.innerHTML = "Cargando palabras...";
  let words = [];
  const cached = localStorage.getItem("words_cache");
  if (cached) {
    try {
      words = JSON.parse(cached);
    } catch (e) {
      console.warn("Cache corrupto, volviendo a cargar...");
    }
  }

  if (!words.length) {
    cantidad.innerHTML = "Descargando dataset...";
    const res = await fetch("./mocks/words.json");
    words = await res.json();
    try {
      localStorage.setItem("words_cache", JSON.stringify(words));
    } catch (e) {
      console.warn("No se pudo guardar en localStorage", e);
    }
  }

  cantidad.innerHTML =
    "Inicializando motores en paralelo (esto puede tardar unos segundos)...";

  workerTrie.postMessage({ type: "init", words });
  workerTradicional.postMessage({ type: "init", words });
}

// Función para resaltar el texto buscado
function highlightMatch(word, query) {
  if (!query) return word;
  const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");
  return word.replace(regex, "<span class='highlight'>$1</span>");
}

workerTrie.onmessage = (e) => {
  const { status, data, val } = e.data;
  if (status === "ready") {
    trieReady = true;
    checkReady();
  } else if (status === "result") {
    const { suggestions, time, totalLength } = data;
    updateChart(val, "trie", time);
    timeTrie.innerText = `${time.toFixed(1)} ms`;
    resultsTrie.innerHTML = suggestions
      .map(
        (word) =>
          `<div class="result-item">${highlightMatch(word, currentQuery)}</div>`,
      )
      .join("");

    cantidad.innerHTML = ``;

    // Only prompt to add if user typed something and we found 0 results
    if (val.length > 0 && totalLength === 0) {
      addWordText.innerText = val;
      addWordContainer.style.display = "block";
    } else {
      addWordContainer.style.display = "none";
    }
  } else if (status === "insert_time") {
    insertTimeTrie = e.data.time;
    checkInsertTimes();
  }
};

workerTradicional.onmessage = (e) => {
  const { status, data, val } = e.data;
  if (status === "ready") {
    tradicionalReady = true;
    checkReady();
  } else if (status === "result") {
    const { suggestions, time } = data;
    updateChart(val, "tradicional", time);
    timeTradicional.innerText = `${time.toFixed(1)} ms`;
    resultsTradicional.innerHTML = suggestions
      .map(
        (word) =>
          `<div class="result-item">${highlightMatch(word, currentQuery)}</div>`,
      )
      .join("");
  } else if (status === "insert_time") {
    insertTimeTrad = e.data.time;
    checkInsertTimes();
  }
};

function checkReady() {
  if (trieReady && tradicionalReady) {
    triggerSearch("");
  }
}

function triggerSearch(val) {
  currentQuery = val;
  const currentLen = val.length;
  
  // Limpiar historial de métricas superior si se están borrando letras
  let chartModified = false;
  Object.keys(chartDataLengths).forEach((key) => {
    if (Number(key) > currentLen) {
      delete chartDataLengths[key];
      chartModified = true;
    }
  });

  if (chartModified) {
    if (currentLen === 0) {
      performanceChart.data.labels = [];
      performanceChart.data.datasets[0].data = [];
      performanceChart.data.datasets[1].data = [];
      performanceChart.update();
    } else {
      renderChart();
    }
  }

  resultsTrie.innerHTML = '<div class="loading">Buscando...</div>';
  resultsTradicional.innerHTML = '<div class="loading">Buscando...</div>';
  addWordContainer.style.display = "none";

  workerTrie.postMessage({ type: "search", val });
  workerTradicional.postMessage({ type: "search", val });
}

search.addEventListener("input", () => {
  if (!trieReady || !tradicionalReady) return;
  triggerSearch(search.value.trim());
});

// Evento para agregar nueva palabra
addWordBtn.addEventListener("click", () => {
  const newWord = addWordText.innerText;

  // Agregar al localStorage
  const cached = localStorage.getItem("words_cache");
  if (cached) {
    try {
      const words = JSON.parse(cached);
      words.push(newWord);
      localStorage.setItem("words_cache", JSON.stringify(words));

      // Enviar instrucción de insert a ambos motores
      workerTrie.postMessage({ type: "insert", val: newWord });
      workerTradicional.postMessage({ type: "insert", val: newWord });

      // Auto-gatillar la busqueda de nuevo, que va a retornar resultados esta vez
      triggerSearch(newWord);
    } catch (e) {
      console.error(e);
    }
  }
});

// Función para generar randoms
function generateRandomWord(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Evento generador masivo
generateBtn.addEventListener("click", () => {
  let qty = parseInt(randomQty.value, 10);
  if (!qty || qty <= 0) return;
  if(qty > 50000) qty = 50000; // soft limit

  pendingInsertQty = qty;
  insertTimeTrie = null;
  insertTimeTrad = null;

  generateStatus.innerText = "Construyendo e inyectando palabras (puede demorar)...";
  generateBtn.disabled = true;

  // Corremos setTimeout breve asi el DOM pinta "Calculando..." antes de congelar proceso (si el stringified es pesado)
  setTimeout(() => {
    const newWords = [];
    for(let i=0; i<qty; i++) {
        // longitud variable entre 3 y 11 letras
        const len = Math.floor(Math.random() * 9) + 3;
        newWords.push(generateRandomWord(len));
    }

    const cached = localStorage.getItem("words_cache");
    if (cached) {
      try {
        const words = JSON.parse(cached);
        words.push(...newWords);
        localStorage.setItem("words_cache", JSON.stringify(words));

        // Enviar batch a los workers directamente
        workerTrie.postMessage({ type: "insert_batch", val: newWords });
        workerTradicional.postMessage({ type: "insert_batch", val: newWords });
        // The rest happens in checkInsertTimes() when both workers finish
      } catch(e) {
        console.error(e);
        generateStatus.innerText = "Error (Posible límite de Storage).";
        generateBtn.disabled = false;
      }
    } else {
        generateBtn.disabled = false;
    }
  }, 50);
});

// Iniciar aplicación
initChart();
loadAndInitWorkers();

// Listeners para cliquear y borrar gráficos
document.getElementById("insertDataChart").addEventListener("click", clearInsertChart);
document.getElementById("performanceChart").addEventListener("click", clearPerformanceChart);

// ==========================================
// TIENDA CON COLA DE PRIORIDAD (CASO PRÁCTICO)
// ==========================================

const storeTrie = new TriePriority();
const storeSearch = document.getElementById("storeSearch");
const storeResults = document.getElementById("storeResults");
const seasonToggles = document.getElementsByName("season");

let storeCurrentSeason = "verano";

seasonToggles.forEach(r => {
  r.addEventListener("change", (e) => {
    storeCurrentSeason = e.target.value;
    triggerStoreSearch();
  });
});

storeSearch.addEventListener("input", triggerStoreSearch);

async function loadStoreMocks() {
  try {
    const res = await fetch("./mocks/store.json");
    const products = await res.json();
    products.forEach(p => storeTrie.insert(p.word, p.season, p.baseScore));
  } catch(e) {
    console.error("Error loaded store mocks", e);
  }
}

function triggerStoreSearch() {
  const val = storeSearch.value.trim();
  if(!val) {
    storeResults.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-muted)">Empieza a buscar para ver el impacto.</div>';
    return;
  }
  
  const suggestions = storeTrie.getSuggestions(val, storeCurrentSeason);
  
  if (suggestions.length === 0) {
     storeResults.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-muted)">0 coincidencias encontradas.</div>';
     return;
  }

  storeResults.innerHTML = suggestions.slice(0, 5).map(item => {
    const boost = item.season === storeCurrentSeason ? `<div style="color:#10b981; font-size: 0.75rem;">(+100 boost temporal)</div>` : '';
    
    return `<div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid var(--border); padding: 0.6rem 0.5rem; transition: 0.2s;">
      <div style="display:flex; align-items:center; gap: 0.5rem;">
        <span style="color: var(--text); font-weight: 500">${highlightMatch(item.word, val)}</span>
        <span style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px; color:var(--text-muted); background:var(--card); border: 1px solid var(--border); border-radius:4px; padding: 2px 5px;">${item.season}</span>
      </div>
      <div style="text-align: right;">
        <div style="color:var(--primary-soft); font-weight:800; font-size:1rem;">★ ${item.dynamicScore} pt</div>
        ${boost}
      </div>
    </div>`;
  }).join("");
}

loadStoreMocks();
triggerStoreSearch();
