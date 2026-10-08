# Third-party notices

Uses soundkit / mel-spec by wavey-ai (MIT).

| Component | Source | Version / commit | License | Location |
| --- | --- | --- | --- | --- |
| soundkit-wasm (prebuilt `pkg/`, `runtime/streaming-media.mjs`) | https://github.com/wavey-ai/soundkit | 0.13.3 @ a1416ab81bfe | MIT | `public/vendor/wavey/soundkit/` (LICENSE alongside) |
| mel-spec (`SpeechToMel`, built with `wasm-pack --target web --features wasm`) | https://github.com/wavey-ai/mel-spec | 0.5.0 @ 338018e2b296 | MIT | `public/vendor/wavey/mel-spec/` (LICENSE alongside) |

`public/vendor/wavey/wavey-audio.js` and `public/wavey-warper.js` are NoDAW Labs glue code used by `warper.html`
(Spectral Space Designer): the browser's own decoder stays primary and soundkit-wasm is only used when the browser
declines a file; mel-spec draws the input vs warped-output spectrogram. All processing is local to the browser.

shared-rb-js (wavey-ai, MIT) is intentionally not used: the warper has no real-time AudioWorklet streaming path
(live playback is an <audio> element through Web Audio nodes; export is an OfflineAudioContext render).
