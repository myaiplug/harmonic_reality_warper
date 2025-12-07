# MyAiPlugin Temporal Pitch Portal™

An advanced audio manipulation interface featuring real-time time stretching and pitch shifting with an interdimensional portal-themed UI.

## Features

### Audio Controls

#### Three Main Knobs
- **Time Shift** (Left Knob): 50%-200% range, default 100%
  - Controls playback speed and time stretching
  - Drag up/down to adjust
  
- **Output** (Center Knob): 0%-100% range, default 50%
  - Master output volume control
  
- **Pitch Bend** (Right Knob): -12st to +12st, default 0st
  - Controls pitch shifting in semitones
  - Drag up/down to adjust

### Dimensional Coordinates Panel

Real-time display of processing parameters:
- **Pitch (semitones)**: Current pitch shift in semitones
- **Temporal Pull**: Current time stretch percentage
- **Drift (cents)**: Micro pitch variation in cents (100 cents = 1 semitone)
- **Speed Ripple**: Doppler-like shift factor (combined time/pitch ratio)

### Warp Zones (Presets)

5 preset configurations for instant portal settings:
- **Classic Portal**: Neutral (100% time, 0st pitch)
- **Deep Rift**: Slowed and pitched down (65% time, -5st pitch)
- **Zero Gravity**: Sped up and pitched up (150% time, +7st pitch)
- **Wormhole Clamp**: Moderately slowed and deep pitched (80% time, -8st pitch)
- **Glass Phase Portal**: Slightly sped up with high pitch (120% time, +3st pitch)

### ScrewAI Flavors

5 additional presets inspired by chopped & screwed aesthetic:
- **Slowed Portal**: Laid back vibe (70% time, -3st pitch)
- **Double Cup Dimension**: Deep chopped sound (60% time, -6st pitch)
- **Houston Rift**: Classic screw sound (75% time, -4st pitch)
- **Mane Hold Time**: Subtle slow (85% time, -2st pitch)
- **Astro Portals**: Sped up and bright (130% time, +5st pitch)

### Dimensional Undo History

- Timeline visualization shows each state change
- Click any bubble to restore that configuration
- Each bubble displays time% and pitch shift
- Limited to 20 history items

### Portal Visualization

- **Animated Portal**: Central swirling portal with concentric rings
- **Warp Effects**: Portal distorts based on pitch and time parameters
- **Dimensional Tear**: SVG-based rip effect showing "other side" of portal
- **Floating Particles**: 30 animated particles creating atmosphere
- **Volumetric Lighting**: Radial gradient lighting effects
- **Liquid Neon Edges**: Glowing cyan/purple gradient on portal rings

## How to Use

1. **Load Audio**: Click "LOAD AUDIO" and select an audio file (max 100MB)
2. **Engage Portal**: Click "ENGAGE PORTAL" to start playback
3. **Adjust Parameters**: 
   - Drag Time Shift knob to change playback speed
   - Drag Pitch Bend knob to change pitch
   - Drag Output knob to adjust volume
4. **Try Presets**: Click any Warp Zone or ScrewAI Flavor button
5. **Undo Changes**: Click any bubble in the history timeline
6. **Export**: Click "EXPORT WAV" to render and download processed audio

## Technical Details

### Audio Processing
- Uses Web Audio API for real-time processing
- Time stretching via `playbackRate` property
- Pitch shifting via frequency ratio calculation
- Smooth parameter transitions (15ms ramp time)
- Offline rendering for WAV export

### Known Limitations
- **Pitch/Time Coupling**: Due to Web Audio API limitations, pitch and time are coupled via `playbackRate`. Changing pitch also affects playback speed and vice versa. For independent pitch shifting, third-party libraries like soundtouch-js would be required.
- **Quality**: Extreme time stretching or pitch shifting may introduce artifacts. For best results, stay within -6st to +6st pitch range and 70%-130% time range.

### Browser Compatibility
- Requires modern browser with Web Audio API support
- Recommended: Chrome 89+, Firefox 87+, Safari 14.1+, Edge 89+

### Performance
- Canvas animations run at 60fps
- Real-time audio processing with minimal latency
- Memory-efficient history management (max 20 states)

## Theme Toggle

Click the toggle switch in the top-right corner to switch between dark and light modes.

## File Formats

### Input
- Accepts any audio format supported by the browser
- Common formats: MP3, WAV, OGG, M4A, FLAC
- Maximum file size: 100MB

### Output
- Exports as WAV (uncompressed PCM)
- Sample rate: Same as input file
- Channels: Stereo or mono (matches input)

## Tips

1. **Start Subtle**: Begin with small adjustments (±2 semitones, 90%-110% time)
2. **Use Presets**: Presets are great starting points for experimentation
3. **History is Your Friend**: Don't be afraid to experiment - you can always click a history bubble to undo
4. **Portal Responds**: Watch the portal animation - it reacts to your parameter changes
5. **Export Often**: Export variations you like before making more changes

## Troubleshooting

### "LOAD AUDIO FIRST" message
- You need to load an audio file before engaging the portal or exporting

### "ERROR: INVALID FILE TYPE" message
- File must be an audio file (MP3, WAV, OGG, etc.)

### "ERROR: FILE TOO LARGE" message
- File size exceeds 100MB limit. Try compressing or using a shorter file.

### Audio sounds distorted
- Try reducing extreme parameter values
- Lower the output volume
- Some distortion is normal at extreme pitch/time settings

### Portal not animating
- Check browser console for errors
- Ensure browser supports Canvas API
- Try refreshing the page

---

**MyAiPlugin Temporal Pitch Portal™** - Warp reality through sound.
