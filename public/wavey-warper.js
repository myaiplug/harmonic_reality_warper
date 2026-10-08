// Spectral Space Designer add-on: wider local file import (soundkit-wasm) and a
// mel-spec spectrogram of input vs warped output. Uses soundkit / mel-spec by wavey-ai (MIT).
// Export FLAC: lossless 16-bit FLAC of the export render. Uses flac by wavey-ai (Apache-2.0).
// Additive only: the original <audio> + decodeAudioData path stays primary; nothing is uploaded.
import { decodeAudioFile, computeMel, drawMel, toMono, encodeFlac } from "./vendor/wavey/wavey-audio.js";

const panel = document.getElementById("spectralCompare");
const inputCanvas = document.getElementById("melInput");
const outputCanvas = document.getElementById("melOutput");
const note = document.getElementById("melNote");
const compareBtn = document.getElementById("melCompareBtn");
const status = document.getElementById("statusText");
const audioElement = document.getElementById("audioElement");

let decodeCtx = null;
let token = 0;
let inputBuffer = null;
let inputMel = null;
let outputMel = null;
let fallbackUrl = null;

function setNote(text) { if (note) note.textContent = text; }

function sizeCanvas(canvas) {
  const width = Math.max(320, Math.round(canvas.clientWidth * (window.devicePixelRatio || 1)));
  if (canvas.width !== width) canvas.width = width;
}

function redraw() {
  const ceiling = Math.max(inputMel ? inputMel.max : -Infinity, outputMel ? outputMel.max : -Infinity);
  // Shared time axis so the warped tails line up against the dry input.
  const span = (mel) => (mel ? mel.frames * mel.hopSeconds : 0);
  const duration = Math.max(span(inputMel), span(outputMel));
  if (inputMel) { sizeCanvas(inputCanvas); drawMel(inputCanvas, inputMel, { ceiling, duration }); }
  if (outputMel) { sizeCanvas(outputCanvas); drawMel(outputCanvas, outputMel, { ceiling, duration }); }
}
window.addEventListener("resize", () => { if (inputMel || outputMel) redraw(); });

function wav16(buffer) {
  const channels = buffer.numberOfChannels; const length = buffer.length;
  const out = new DataView(new ArrayBuffer(44 + length * channels * 2));
  const w = (o, s) => { for (let i = 0; i < s.length; i += 1) out.setUint8(o + i, s.charCodeAt(i)); };
  w(0, "RIFF"); out.setUint32(4, 36 + length * channels * 2, true); w(8, "WAVE"); w(12, "fmt ");
  out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, channels, true);
  out.setUint32(24, buffer.sampleRate, true); out.setUint32(28, buffer.sampleRate * channels * 2, true);
  out.setUint16(32, channels * 2, true); out.setUint16(34, 16, true); w(36, "data"); out.setUint32(40, length * channels * 2, true);
  const data = Array.from({ length: channels }, (_, c) => buffer.getChannelData(c));
  let p = 44;
  for (let i = 0; i < length; i += 1) for (let c = 0; c < channels; c += 1) {
    const s = Math.max(-1, Math.min(1, data[c][i])); out.setInt16(p, s < 0 ? s * 0x8000 : s * 0x7fff, true); p += 2;
  }
  return new Blob([out.buffer], { type: "audio/wav" });
}

const flacBtn = document.getElementById("flacBtn");

async function onFile(file) {
  const mine = ++token;
  if (flacBtn) flacBtn.disabled = false;
  inputBuffer = null; inputMel = null; outputMel = null; window.waveyFallbackBuffer = null;
  if (panel) panel.hidden = false;
  if (compareBtn) compareBtn.disabled = true;
  setNote("Reading input spectrum locally…");
  try {
    decodeCtx = decodeCtx || new OfflineAudioContext(2, 1, 48000);
    const { buffer, via, format } = await decodeAudioFile(file, decodeCtx, {
      onFallback: () => { if (mine === token) { status.innerText = "DECODING WITH SOUNDKIT..."; setNote("Browser decoder declined this file. Decoding locally with soundkit-wasm…"); } },
    });
    if (mine !== token) return;
    inputBuffer = buffer;
    if (via === "soundkit") {
      // The browser cannot play this file natively: hand the <audio> chain a PCM WAV and give export the decoded buffer.
      window.waveyFallbackBuffer = buffer;
      if (fallbackUrl) URL.revokeObjectURL(fallbackUrl);
      fallbackUrl = URL.createObjectURL(wav16(buffer));
      audioElement.src = fallbackUrl;
      status.innerText = `MEDIA LOADED · ${String(format || "").toUpperCase()} VIA SOUNDKIT`;
    }
    inputMel = await computeMel(toMono(buffer), buffer.sampleRate);
    if (mine !== token) return;
    redraw();
    outputCanvas.getContext("2d").clearRect(0, 0, outputCanvas.width, outputCanvas.height);
    if (compareBtn) compareBtn.disabled = false;
    setNote(`Input: ${buffer.duration.toFixed(1)} s · ${buffer.sampleRate / 1000} kHz${via === "soundkit" ? " · decoded by soundkit" : ""}. Press COMPARE (or Export WAV) to see the warped output.`);
  } catch (error) {
    if (mine !== token) return;
    console.warn("[wavey] input analysis failed", error);
    setNote("Spectral view unavailable for this file.");
    if (/could not be decoded/i.test(String(error && error.message))) status.innerText = "UNSUPPORTED FILE";
  }
}

async function showOutput(rendered) {
  try {
    if (!rendered) return;
    outputMel = await computeMel(toMono(rendered), rendered.sampleRate);
    redraw();
    setNote(`Input vs warped output · shared log-mel scale · computed locally (${rendered.duration.toFixed(1)} s output incl. tails).`);
  } catch (error) { console.warn("[wavey] output spectrum failed", error); setNote("Output spectrum unavailable."); }
}

async function compare() {
  if (!inputBuffer || typeof window.renderProcessedBuffer !== "function") return;
  compareBtn.disabled = true; setNote("Rendering the warp offline for comparison…");
  try { await showOutput(await window.renderProcessedBuffer(inputBuffer)); }
  catch (error) { console.warn("[wavey] compare render failed", error); setNote("Could not render the comparison."); }
  finally { compareBtn.disabled = false; }
}
if (compareBtn) compareBtn.addEventListener("click", compare);

// 16-bit with truncation, matching script.js bufferToWave() so FLAC decodes to the WAV export's exact samples.
const exportFlac = (buffer) => encodeFlac(buffer, { bits: 16, level: 1, quantize: "trunc" });

window.WaveyWarper = { onFile, showOutput, getInputBuffer: () => inputBuffer, encodeFlac: exportFlac };
// A file may have been chosen before this module finished loading.
const picker = document.getElementById("audioFile");
if (picker && picker.files && picker.files[0]) onFile(picker.files[0]);
