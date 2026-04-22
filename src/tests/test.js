import fs from "fs";
import { Tradicional } from "./tradicional.js";
import { Trie } from "./trie.js";

function loadWordsTrie() {
  const trie = new Trie();
  const wordsData = fs.readFileSync("./words.json", "utf-8");
  const words = JSON.parse(wordsData);
  words.forEach((word) => trie.insert(word));
  return trie;
}

function loadWordsTradicional() {
  const tradicional = new Tradicional();
  const wordsData = fs.readFileSync("./words.json", "utf-8");
  const words = JSON.parse(wordsData);
  words.forEach((word) => tradicional.insert(word));
  return tradicional;
}

const trie = loadWordsTrie();
const tradicional = loadWordsTradicional();

console.log(tradicional.getSuggestions("a"));
console.log(trie.getSuggestions("a"));
