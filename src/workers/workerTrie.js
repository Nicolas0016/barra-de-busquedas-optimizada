import { Trie } from "../utils/trie.js";

const trie = new Trie();
const DATA_MULTIPLIER = 1000;

onmessage = function (e) {
  const { type, words, val } = e.data;

  if (type === "init") {
    // Multiplicar la cantidad de datos en memoria para estresar el motor
    for (let i = 0; i < DATA_MULTIPLIER; i++) {
      words.forEach((word) => trie.insert(word));
    }
    postMessage({ status: "ready" });

  } else if (type === "insert" && val !== undefined) {
    // Mantiene la consistencia del multiplicador de estres insertandolo también multiples veces
    for (let i = 0; i < DATA_MULTIPLIER; i++) {
      trie.insert(val);
    }
  } else if (type === "insert_batch" && val && val.length) {
    const t0 = performance.now();
    for (let i = 0; i < DATA_MULTIPLIER; i++) {
      val.forEach(w => trie.insert(w));
    }
    const t1 = performance.now();
    postMessage({ status: "insert_time", time: t1 - t0 });
  } else if (type === "search" && val !== undefined) {
    const result = trie.getSuggestions(val);

    // Obtenemos todos, pero al hilo principal solo le enviamos 100 para no
    // destruir el navegador serializando 800,000 strings en memoria de postMessage.
    postMessage({
      status: "result",
      val,
      data: {
        suggestions: result.suggestions.slice(0, 100),
        time: result.time,
        totalLength: result.suggestions.length,
      },
    });
  }
};
