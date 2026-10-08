// FLAC encode worker — wavey-ai/flac (Apache-2.0) via nodaw-flac-wasm. Local only.
self.onmessage = async (event) => {
  const { planar, channels, sampleRate, bits, level, base } = event.data;
  try {
    const mod = await import(new URL("flac/nodaw_flac_wasm.js", base).href);
    await mod.default({ module_or_path: new URL("flac/nodaw_flac_wasm_bg.wasm", base) });
    const bytes = mod.encode_planar_i32(planar, channels, sampleRate, bits, level);
    self.postMessage({ ok: true, bytes }, [bytes.buffer]);
  } catch (error) {
    self.postMessage({ ok: false, error: String(error && error.message || error) });
  }
};
