# flac (wavey-ai) — browser FLAC encoder

Uses flac by wavey-ai (Apache-2.0): https://github.com/wavey-ai/flac @ 7c3ffbcaad03 (crate `wavey-flac` 0.1.0,
encoder descended from yotarok/flacenc-rs, decoder from ruuda/claxon — both Apache-2.0; see LICENSE, LICENSE-CLAXON,
UPSTREAM_THIRD_PARTY.md).

`nodaw_flac_wasm*` is a thin NoDAW Labs wasm-bindgen wrapper (`src-wrapper/`) built with
`wasm-pack build --release --target web` against the unmodified crate with `default-features = false`.
It exposes `encode_planar_i32(...)` (caller-quantised PCM, used by wavey-audio.js so FLAC matches each tool's WAV writer sample-for-sample) and `encode_planar_f32(planar, channels, sampleRate, bits, level)`, each returning complete `.flac` bytes with a finalised
STREAMINFO (incl. MD5). `flac-worker.js` runs it off the main thread. Verified bit-exact against FFmpeg's FLAC decoder.
