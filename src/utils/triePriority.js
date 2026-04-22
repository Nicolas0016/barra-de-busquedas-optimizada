export class TrieNodePriority {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
    this.productData = null; // { word, season, baseScore }
  }
}

export class TriePriority {
  constructor() {
    this.root = new TrieNodePriority();
  }

  insert(word, season, baseScore) {
    let node = this.root;
    for (let char of word.toLowerCase()) {
      if (!node.children[char]) {
        node.children[char] = new TrieNodePriority();
      }
      node = node.children[char];
    }
    node.isEndOfWord = true;
    node.productData = { word, season, baseScore };
  }

  getSuggestions(prefix, currentSeason) {
    if (!prefix) return [];
    
    let node = this.root;
    for (let char of prefix.toLowerCase()) {
      if (!node.children[char]) return [];
      node = node.children[char];
    }

    let results = [];
    this._dfs(node, results);
    
    // Priority logic:
    // +100 to dynamic score if it perfectly matches the user's active context (season).
    results.forEach(item => {
      item.dynamicScore = item.baseScore + (item.season === currentSeason ? 100 : 0);
    });
    
    // Sort descending by score mapping Priority Queue natively
    results.sort((a, b) => b.dynamicScore - a.dynamicScore);
    return results;
  }

  _dfs(node, results) {
    if (node.isEndOfWord && node.productData) {
      results.push({ ...node.productData });
    }
    for (let char in node.children) {
      this._dfs(node.children[char], results);
    }
  }
}
