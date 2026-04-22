class TrieNode {
  constructor() {
    this.children = {};
    this.words = [];
    this.isEndOfWord = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let node = this.root;
    node.words.push(word); // Store on root too for empty prefix searches
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
      node.words.push(word);
    }
    node.isEndOfWord = true;
  }

  search(word) {
    let node = this.root;
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      if (!node.children[char]) {
        return false;
      }
      node = node.children[char];
    }
    return node.isEndOfWord;
  }

  startsWith(prefix) {
    let node = this.root;
    for (let i = 0; i < prefix.length; i++) {
      const char = prefix[i];
      if (!node.children[char]) {
        return false;
      }
      node = node.children[char];
    }
    return true;
  }

  getSuggestions(prefix = "") {
    const start = performance.now(); // Medir siempre al inicio

    if (!prefix) {
      let suggestions = this.root.words;
      return { suggestions, time: performance.now() - start };
    }

    let node = this.root;

    for (let i = 0; i < prefix.length; i++) {
      const char = prefix[i];
      if (!node.children[char]) {
        return { suggestions: [], time: performance.now() - start };
      }
      node = node.children[char];
    }

    let suggestions = node.words;

    return { suggestions, time: performance.now() - start };
  }
}

export { Trie };
