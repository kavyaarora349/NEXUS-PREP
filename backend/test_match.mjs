const a = "Set A: 1) Explain the characteristics and components of data communication systems with suitable examples. Discuss the different modes of data flow (Simplex, Half-duplex, Full-duplex).";
const b = "Q1 [10M]: Set A: 1) Explain the characteristics and components of data communication systems with suitable examples. Discuss the different modes of data flow (Simplex, Half-duplex, Full-duplex).";

const aText = String(a).replace(/\s+/g, ' ').trim().toLowerCase();
const evalText = String(b).replace(/\s+/g, ' ').trim().toLowerCase();

console.log("aText:", aText);
console.log("evalText:", evalText);
console.log("evalText.includes(aText):", evalText.includes(aText));
