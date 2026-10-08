//! Browser FLAC encoder built on wavey-ai/flac (Apache-2.0).
use wasm_bindgen::prelude::*;
use wavey_flac::frame::{FlacFrameConfig, FlacProfile};
use wavey_flac::stream::Encoder;

const BLOCK: usize = 4096;
const MIN_BLOCK: usize = 32; // wavey-flac FLAC_MIN_BLOCK_SIZE

fn profile_from(level: u8) -> FlacProfile {
    match level {
        0 => FlacProfile::Realtime,
        2 => FlacProfile::Maximum,
        _ => FlacProfile::Balanced,
    }
}

/// Encode planar float PCM (channels concatenated: ch0 then ch1 ...) into a complete
/// native .flac file. `bits` is 16 or 24. `level`: 0 realtime, 1 balanced, 2 maximum.
#[wasm_bindgen]
pub fn encode_planar_f32(
    planar: &[f32],
    channels: u16,
    sample_rate: u32,
    bits: u8,
    level: u8,
) -> Result<Vec<u8>, JsError> {
    let ch = channels as usize;
    if ch == 0 || planar.len() % ch != 0 {
        return Err(JsError::new("planar length not divisible by channel count"));
    }
    let frames = planar.len() / ch;
    let scale = ((1i64 << (bits as u32 - 1)) - 1) as f64;
    let (lo, hi) = (-(scale as i32) - 1, scale as i32);
    let config = FlacFrameConfig::new(sample_rate, channels, bits, BLOCK as u32, profile_from(level))
        .map_err(|e| JsError::new(&e.to_string()))?;
    let mut enc = Encoder::new(config).map_err(|e| JsError::new(&e.to_string()))?;
    let mut body: Vec<u8> = Vec::with_capacity(frames * ch * (bits as usize / 8) / 2 + 1024);
    let mut block: Vec<i32> = Vec::with_capacity(BLOCK * ch);
    let mut pos = 0usize;
    // Pad the total to at least MIN_BLOCK frames in the final block (adds < 32 samples of silence).
    let padded_total = if frames % BLOCK != 0 && frames % BLOCK < MIN_BLOCK {
        frames + (MIN_BLOCK - frames % BLOCK)
    } else if frames == 0 {
        MIN_BLOCK
    } else {
        frames
    };
    while pos < padded_total {
        let n = BLOCK.min(padded_total - pos);
        block.clear();
        for i in 0..n {
            let idx = pos + i;
            for c in 0..ch {
                let v = if idx < frames { planar[c * frames + idx] as f64 } else { 0.0 };
                let s = (v.clamp(-1.0, 1.0) * scale).round() as i32;
                block.push(s.clamp(lo, hi));
            }
        }
        enc.encode_i32(&block, &mut body).map_err(|e| JsError::new(&e.to_string()))?;
        pos += n;
    }
    let provisional = enc.stream_header().len();
    let header = enc.finish().map_err(|e| JsError::new(&e.to_string()))?.to_vec();
    if header.len() != provisional || body.len() < header.len() {
        return Err(JsError::new("unexpected FLAC header size change"));
    }
    // body starts with a provisional copy of the header; replace it with the finalized one.
    let mut out = Vec::with_capacity(4 + body.len());
    out.extend_from_slice(b"fLaC");
    out.extend_from_slice(&header);
    out.extend_from_slice(&body[header.len()..]);
    Ok(out)
}

/// Encode planar, already-quantised integer PCM (channels concatenated) into a complete .flac file.
/// Lets the caller reproduce its WAV writer's exact quantisation so FLAC and WAV decode to identical samples.
#[wasm_bindgen]
pub fn encode_planar_i32(
    planar: &[i32],
    channels: u16,
    sample_rate: u32,
    bits: u8,
    level: u8,
) -> Result<Vec<u8>, JsError> {
    let ch = channels as usize;
    if ch == 0 || planar.len() % ch != 0 {
        return Err(JsError::new("planar length not divisible by channel count"));
    }
    let frames = planar.len() / ch;
    let config = FlacFrameConfig::new(sample_rate, channels, bits, BLOCK as u32, profile_from(level))
        .map_err(|e| JsError::new(&e.to_string()))?;
    let mut enc = Encoder::new(config).map_err(|e| JsError::new(&e.to_string()))?;
    let mut body: Vec<u8> = Vec::with_capacity(frames * ch * (bits as usize / 8) / 2 + 1024);
    let mut block: Vec<i32> = Vec::with_capacity(BLOCK * ch);
    let padded_total = if frames == 0 {
        MIN_BLOCK
    } else if frames % BLOCK != 0 && frames % BLOCK < MIN_BLOCK {
        frames + (MIN_BLOCK - frames % BLOCK)
    } else {
        frames
    };
    let mut pos = 0usize;
    while pos < padded_total {
        let n = BLOCK.min(padded_total - pos);
        block.clear();
        for i in 0..n {
            let idx = pos + i;
            for c in 0..ch {
                block.push(if idx < frames { planar[c * frames + idx] } else { 0 });
            }
        }
        enc.encode_i32(&block, &mut body).map_err(|e| JsError::new(&e.to_string()))?;
        pos += n;
    }
    let provisional = enc.stream_header().len();
    let header = enc.finish().map_err(|e| JsError::new(&e.to_string()))?.to_vec();
    if header.len() != provisional || body.len() < header.len() {
        return Err(JsError::new("unexpected FLAC header size change"));
    }
    let mut out = Vec::with_capacity(4 + body.len());
    out.extend_from_slice(b"fLaC");
    out.extend_from_slice(&header);
    out.extend_from_slice(&body[header.len()..]);
    Ok(out)
}

#[wasm_bindgen]
pub fn version() -> String {
    "nodaw-flac-wasm 0.1.0 (wavey-ai/flac, Apache-2.0)".into()
}
