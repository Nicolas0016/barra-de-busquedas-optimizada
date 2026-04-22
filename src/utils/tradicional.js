class Tradicional {
  constructor() {
    this.words = [];
  }

  insert(word) {
    this.words.push(word);
  }

  getSuggestions(prefix) {
    const start = performance.now(); // Medir siempre al inicio
    if (!prefix) {
      const suggestions = this.words;
      return { suggestions, time: performance.now() - start };
    }

    const suggestions = [];
    for (const word of this.words) {
      for (let i = 0; i < prefix.length; i++) {
        if (word[i] !== prefix[i]) {
          break;
        }
        if (i === prefix.length - 1) {
          suggestions.push(word);
        }
      }
    }
    return { suggestions, time: performance.now() - start };
  }
}

export { Tradicional };
