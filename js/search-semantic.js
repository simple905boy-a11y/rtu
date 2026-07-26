/* ================= Semantic (meaning-based) search =================
   Active only when the build pipeline's static index is deployed alongside
   the app (data/manifest.json). The query is embedded IN THE BROWSER with a
   small open-source model (all-MiniLM-L6-v2 via transformers.js, ~25 MB
   one-time download, cached); documents were embedded ahead of time by the
   GitHub Action, stored as int8 unit vectors. Similarity = int8 dot product.
*/
"use strict";

const SEM = {
  dim: 384,
  model: null,
  modelLoading: null,
  vectors: new Map() // colId -> Int8Array
};

async function semLoadModel(onStatus) {
  if (SEM.model) return SEM.model;
  if (window.__testEmbed) { SEM.model = { embed: window.__testEmbed }; return SEM.model; }
  if (!SEM.modelLoading) {
    SEM.modelLoading = (async () => {
      onStatus?.("Loading AI model (one-time ~25 MB download, then cached)…");
      const T = await import("https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/+esm");
      T.env.allowLocalModels = false;
      const fe = await T.pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", { quantized: true });
      SEM.model = {
        embed: async (text) => {
          const r = await fe(text, { pooling: "mean", normalize: true });
          return Float32Array.from(r.data);
        }
      };
      return SEM.model;
    })();
  }
  return SEM.modelLoading;
}

async function semQueryVec(query, onStatus) {
  const m = await semLoadModel(onStatus);
  return m.embed(query);
}

async function semVectors(base, colId, expectedCount) {
  if (SEM.vectors.has(colId)) return SEM.vectors.get(colId);
  const url = `${base}/vectors/${colId}.bin`;
  let buf = null;
  try {
    const cache = await caches.open("almiftah-v1");
    const hit = await cache.match(url);
    if (hit) buf = await hit.arrayBuffer();
    if (!buf) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      buf = await res.arrayBuffer();
      await cache.put(url, new Response(buf.slice(0)));
    }
  } catch {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`vectors ${colId}: HTTP ${res.status}`);
    buf = await res.arrayBuffer();
  }
  const arr = new Int8Array(buf);
  if (arr.length !== expectedCount * SEM.dim) {
    throw new Error(`vectors ${colId}: size mismatch (index is stale — re-run the build workflow)`);
  }
  SEM.vectors.set(colId, arr);
  return arr;
}

/* Top-k cosine matches. Returns Map(docIndex -> cosine). */
function semTop(vectors, queryVec, { k = 150, minCos = 0.3 } = {}) {
  const dim = SEM.dim;
  const count = vectors.length / dim;
  const hits = [];
  for (let i = 0; i < count; i++) {
    let dot = 0;
    const off = i * dim;
    for (let d = 0; d < dim; d++) dot += queryVec[d] * vectors[off + d];
    const cos = dot / 127; // stored vectors are unit-length, int8-scaled by 127
    if (cos >= minCos) hits.push([i, cos]);
  }
  hits.sort((a, b) => b[1] - a[1]);
  return new Map(hits.slice(0, k));
}
