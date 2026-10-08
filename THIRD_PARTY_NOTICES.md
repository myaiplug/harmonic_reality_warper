# Third-party notices

Uses soundkit / mel-spec by wavey-ai (MIT). Uses flac by wavey-ai (Apache-2.0).

| Component | Source | Version / commit | License | Location |
| --- | --- | --- | --- | --- |
| soundkit-wasm (prebuilt `pkg/`, `runtime/streaming-media.mjs`) | https://github.com/wavey-ai/soundkit | 0.13.3 @ a1416ab81bfe | MIT | `public/vendor/wavey/soundkit/` (LICENSE alongside) |
| mel-spec (`SpeechToMel`, built with `wasm-pack --target web --features wasm`) | https://github.com/wavey-ai/mel-spec | 0.5.0 @ 338018e2b296 | MIT | `public/vendor/wavey/mel-spec/` (LICENSE alongside) |
| flac (`wavey-flac` 0.1.0, unmodified; encoder from yotarok/flacenc-rs, decoder from ruuda/claxon) via the NoDAW `nodaw-flac-wasm` wrapper (`src-wrapper/`, `wasm-pack --release --target web`, default features off) | https://github.com/wavey-ai/flac | 0.1.0 @ 7c3ffbcaad03 | Apache-2.0 | `public/vendor/wavey/flac/` (LICENSE, LICENSE-CLAXON, UPSTREAM_THIRD_PARTY.md alongside) |

`public/vendor/wavey/wavey-audio.js` and `public/wavey-warper.js` are NoDAW Labs glue code used by `warper.html`
(Spectral Space Designer): the browser's own decoder stays primary and soundkit-wasm is only used when the browser
declines a file; mel-spec draws the input vs warped-output spectrogram. All processing is local to the browser.

flac powers the **Export FLAC** button: the same offline render as Export WAV, encoded as lossless 16-bit FLAC in a
Web Worker (`public/vendor/wavey/flac/flac-worker.js`) with the WAV writer's exact quantisation. Export WAV is unchanged.

shared-rb-js (wavey-ai, MIT) is intentionally not used: the warper has no real-time AudioWorklet streaming path
(live playback is an <audio> element through Web Audio nodes; export is an OfflineAudioContext render).
