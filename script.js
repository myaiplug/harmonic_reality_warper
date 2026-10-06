
        let audioCtx;
        let sourceNode, inputGainNode, ampGainNode, outputGainNode, analyserNode;
        let lowPassNode, highPassNode;
        let delayNode, reverbNode, subGainNode;
        let flangerLFO, flangerDelay;
        let isPlaying = false, bypass = false;
        let currentFileArrayBuffer = null;
        
        // 7-band parametric EQ
        let eqBands = [];
        let bands = {
            'band-1': { mute: false, solo: false, freq: 60 },
            'band-2': { mute: false, solo: false, freq: 200 },
            'band-3': { mute: false, solo: false, freq: 800 },
            'band-4': { mute: false, solo: false, freq: 2000 },
            'band-5': { mute: false, solo: false, freq: 4000 },
            'band-6': { mute: false, solo: false, freq: 8000 },
            'band-7': { mute: false, solo: false, freq: 16000 }
        };

        const audioElement = document.getElementById('audioElement');
        const playBtn = document.getElementById('playBtn');
        const statusText = document.getElementById('statusText');
        const fileInput = document.getElementById('audioFile');
        const downloadBtn = document.getElementById('downloadBtn');
        
        // Demo mode by default (no audio uploaded)
        let demoMode = true;
        
        // Initialize UI for demo mode
        if (downloadBtn) {
            downloadBtn.disabled = true;
            downloadBtn.style.opacity = '0.4';
            downloadBtn.style.cursor = 'not-allowed';
        }
        statusText.innerText = "DEMO MODE - UPLOAD AUDIO TO ENABLE DOWNLOAD";

        fileInput.addEventListener('change', async function() {
            const file = this.files[0];
            if (file) {
                currentFileArrayBuffer = await file.arrayBuffer();
                const blobUrl = URL.createObjectURL(file);
                audioElement.src = blobUrl;
                statusText.innerText = "MEDIA LOADED";
                
                // Enable download button when audio is uploaded
                demoMode = false;
                downloadBtn.disabled = false;
                downloadBtn.style.opacity = '1';
                downloadBtn.style.cursor = 'pointer';
                
                if(isPlaying) togglePlay(); 
            }
        });

        function initAudio() {
            if (audioCtx) return;
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();

            sourceNode = audioCtx.createMediaElementSource(audioElement);
            inputGainNode = audioCtx.createGain();
            ampGainNode = audioCtx.createGain();
            ampGainNode.gain.value = 1.0; // Default unity gain
            outputGainNode = audioCtx.createGain(); 

            highPassNode = audioCtx.createBiquadFilter(); 
            highPassNode.type = "highpass"; 
            highPassNode.frequency.value = 75;
            
            lowPassNode = audioCtx.createBiquadFilter(); 
            lowPassNode.type = "lowpass"; 
            lowPassNode.frequency.value = 19000;

            // Create 7-band parametric EQ
            const frequencies = [60, 200, 800, 2000, 4000, 8000, 16000];
            eqBands = frequencies.map((freq, index) => {
                const filter = audioCtx.createBiquadFilter();
                filter.type = index === 0 ? "lowshelf" : (index === 6 ? "highshelf" : "peaking");
                filter.frequency.value = freq;
                filter.Q.value = 1.0;
                filter.gain.value = 0;
                return filter;
            });

            // New effects
            delayNode = audioCtx.createDelay(2.0); delayNode.delayTime.value = 0;
            const delayFeedback = audioCtx.createGain(); delayFeedback.gain.value = 0.3;
            const delayMix = audioCtx.createGain(); delayMix.gain.value = 0;
            delayNode.connect(delayFeedback); delayFeedback.connect(delayNode);
            delayNode.connect(delayMix);
            window.delayMixNode = delayMix;
            
            reverbNode = audioCtx.createConvolver();
            const reverbMix = audioCtx.createGain(); reverbMix.gain.value = 0;
            createReverbImpulse();
            reverbNode.connect(reverbMix);
            window.reverbMixNode = reverbMix;
            
            subGainNode = audioCtx.createGain(); subGainNode.gain.value = 0;
            const subFilter = audioCtx.createBiquadFilter(); 
            subFilter.type = "lowshelf"; 
            subFilter.frequency.value = 80;
            subFilter.gain.value = 0;
            window.subFilterNode = subFilter;
            
            flangerDelay = audioCtx.createDelay(0.02);
            flangerLFO = audioCtx.createOscillator();
            const flangerGain = audioCtx.createGain();
            const flangerMix = audioCtx.createGain(); flangerMix.gain.value = 0;
            flangerLFO.frequency.value = 0.5;
            flangerGain.gain.value = 0.002;
            flangerLFO.connect(flangerGain);
            flangerGain.connect(flangerDelay.delayTime);
            flangerDelay.connect(flangerMix);
            // Start oscillator (safe because initAudio is only called after user interaction)
            try { flangerLFO.start(); } catch { /* already started */ }
            window.flangerMixNode = flangerMix;
            window.flangerLFONode = flangerLFO;
            
            analyserNode = audioCtx.createAnalyser();
            analyserNode.fftSize = 128; analyserNode.smoothingTimeConstant = 0.8;

            // Signal chain: source -> input gain -> amp gain -> 7-band EQ -> sub -> filters -> effects -> output
            sourceNode.connect(inputGainNode);
            inputGainNode.connect(ampGainNode);
            
            // Connect all 7 EQ bands in series
            ampGainNode.connect(eqBands[0]);
            for (let i = 0; i < eqBands.length - 1; i++) {
                eqBands[i].connect(eqBands[i + 1]);
            }
            
            // Continue chain after EQ
            eqBands[eqBands.length - 1].connect(subFilter);
            subFilter.connect(highPassNode); 
            highPassNode.connect(lowPassNode);   
            
            // Effects chain
            lowPassNode.connect(delayNode);
            lowPassNode.connect(reverbNode);
            lowPassNode.connect(flangerDelay);
            
            lowPassNode.connect(outputGainNode);
            delayMix.connect(outputGainNode);
            reverbMix.connect(outputGainNode);
            flangerMix.connect(outputGainNode);
            
            outputGainNode.connect(analyserNode);
            outputGainNode.connect(audioCtx.destination);
            updateAudioParams(); 
        }

        async function togglePlay() {
            if (!audioElement.src) { alert("Load media first."); return; }
            if (!audioCtx) initAudio();
            if (audioCtx.state === 'suspended') await audioCtx.resume();

            if (isPlaying) {
                audioElement.pause();
                playBtn.innerText = "ENGAGE";
                playBtn.classList.remove('active-state');
                statusText.innerText = "SYSTEM PAUSED";
            } else {
                audioElement.play();
                playBtn.innerText = "STOP";
                playBtn.classList.add('active-state');
                statusText.innerText = "PROCESSING...";
            }
            isPlaying = !isPlaying;
        }

        // Shared impulse builder so the live preview and the WAV export use the same reverb shape.
        function buildReverbImpulse(ctx) {
            const length = Math.floor(ctx.sampleRate * 2);
            const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
            const left = impulse.getChannelData(0);
            const right = impulse.getChannelData(1);
            for (let i = 0; i < length; i++) {
                left[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
                right[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
            }
            return impulse;
        }

        function createReverbImpulse() {
            reverbNode.buffer = buildReverbImpulse(audioCtx);
        }

        function updateAudioParams() {
            if (!audioCtx) return;

            // Amp gain control
            const ampVal = parseInt(document.getElementById('knob-amp-gain').dataset.val);
            // Map 0-100 to 0.1-3.0 for clean gain boost
            const ampGain = 0.1 + (ampVal / 100) * 2.9;
            ampGainNode.gain.setTargetAtTime(ampGain, audioCtx.currentTime, 0.1);

            if (bypass) {
                // In bypass mode, set all EQ gains to 0 (flat response)
                eqBands.forEach(band => {
                    band.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
                });
                return;
            }

            // Update 7-band parametric EQ
            const anySolo = Object.values(bands).some(b => b.solo);
            
            for (let i = 0; i < 7; i++) {
                const bandId = `band-${i + 1}`;
                const gainKnob = document.getElementById(`knob-gain${i + 1}`);
                const qKnob = document.getElementById(`knob-q${i + 1}`);
                
                if (!gainKnob || !qKnob) continue;
                
                const gainVal = parseInt(gainKnob.dataset.val);
                const qVal = parseInt(qKnob.dataset.val);
                
                // Map gain knob 0-100 to -12dB to +12dB
                const gainDb = (gainVal - 50) * 0.24;
                
                // Map Q knob 0-100 to 0.3 to 10
                const qFactor = 0.3 + (qVal / 100) * 9.7;
                
                // Apply mute/solo logic
                let finalGain = gainDb;
                if (bands[bandId].mute) {
                    finalGain = -60; // Effectively mute
                } else if (anySolo && !bands[bandId].solo) {
                    finalGain = -60; // Mute if not soloed and something else is
                }
                
                eqBands[i].gain.setTargetAtTime(finalGain, audioCtx.currentTime, 0.1);
                eqBands[i].Q.value = qFactor;
            }

            // HPF and LPF controls
            const hpfVal = parseInt(document.getElementById('knob-lowpass').dataset.val);
            highPassNode.frequency.setTargetAtTime(20 + (hpfVal * 4.8), audioCtx.currentTime, 0.1);

            const lpfVal = parseInt(document.getElementById('knob-highpass').dataset.val);
            lowPassNode.frequency.setTargetAtTime(2000 + (lpfVal * 200), audioCtx.currentTime, 0.1);

            // Effects controls
            const delayVal = parseInt(document.getElementById('knob-delay').dataset.val);
            delayNode.delayTime.setTargetAtTime(0.1 + (delayVal / 100) * 0.9, audioCtx.currentTime, 0.1);
            window.delayMixNode.gain.setTargetAtTime(delayVal / 100, audioCtx.currentTime, 0.1);

            const reverbVal = parseInt(document.getElementById('knob-reverb').dataset.val);
            window.reverbMixNode.gain.setTargetAtTime(reverbVal / 150, audioCtx.currentTime, 0.1);

            const subVal = parseInt(document.getElementById('knob-sub').dataset.val);
            window.subFilterNode.gain.setTargetAtTime(subVal / 10, audioCtx.currentTime, 0.1);

            const flangerVal = parseInt(document.getElementById('knob-flanger').dataset.val);
            window.flangerMixNode.gain.setTargetAtTime(flangerVal / 100, audioCtx.currentTime, 0.1);
            window.flangerLFONode.frequency.setTargetAtTime(0.2 + (flangerVal / 100) * 2, audioCtx.currentTime, 0.1);

            const mainVal = currentMainKnobVal;
            const gain = (mainVal / 50) * (mainVal / 50); 
            outputGainNode.gain.setTargetAtTime(gain, audioCtx.currentTime, 0.1);
        }

        // eslint-disable-next-line no-unused-vars
        async function downloadProcessedAudio() {
            // Prevent download in demo mode
            if(demoMode || !currentFileArrayBuffer) { 
                alert("Please upload your own audio file to enable download."); 
                return; 
            }
            if(!audioCtx) initAudio();

            const prevStatus = statusText.innerText;
            statusText.innerText = "RENDERING...";
            
            try {
                const audioBuffer = await audioCtx.decodeAudioData(currentFileArrayBuffer.slice(0));
                const knobVal = (id) => parseInt(document.getElementById(id).dataset.val);

                // Read every control up front (same mappings as updateAudioParams)
                const ampVal = knobVal('knob-amp-gain');
                const hpfVal = knobVal('knob-lowpass');
                const lpfVal = knobVal('knob-highpass');
                const delayVal = knobVal('knob-delay');
                const reverbVal = knobVal('knob-reverb');
                const subVal = knobVal('knob-sub');
                const flangerVal = knobVal('knob-flanger');
                const delayTime = 0.1 + (delayVal / 100) * 0.9;

                // Leave room for the space-effect tails so echoes/reverb aren't chopped at the end.
                // Delay feedback is 0.3, so ~6 repeats drops below -30 dB; the reverb IR is 2 s.
                let tailSec = 0;
                if (delayVal > 0) tailSec = Math.max(tailSec, delayTime * 6);
                if (reverbVal > 0) tailSec = Math.max(tailSec, 2.2);
                if (flangerVal > 0) tailSec = Math.max(tailSec, 0.05);
                const sr = audioBuffer.sampleRate;
                const renderLength = audioBuffer.length + Math.ceil(tailSec * sr);
                // Stereo minimum: the live reverb IR is stereo, so a mono file is heard in stereo in preview.
                const numChannels = Math.max(2, audioBuffer.numberOfChannels);
                const offlineCtx = new OfflineAudioContext(numChannels, renderLength, sr);
                
                const source = offlineCtx.createBufferSource(); source.buffer = audioBuffer;
                const oInputGain = offlineCtx.createGain(); 
                const oAmpGain = offlineCtx.createGain();
                const oOutputGain = offlineCtx.createGain();
                const oHp = offlineCtx.createBiquadFilter(); oHp.type = "highpass";
                const oLp = offlineCtx.createBiquadFilter(); oLp.type = "lowpass";
                const oSubFilter = offlineCtx.createBiquadFilter(); oSubFilter.type = "lowshelf"; oSubFilter.frequency.value = 80;
                
                // Create 7-band offline EQ
                const frequencies = [60, 200, 800, 2000, 4000, 8000, 16000];
                const oEqBands = frequencies.map((freq, index) => {
                    const filter = offlineCtx.createBiquadFilter();
                    filter.type = index === 0 ? "lowshelf" : (index === 6 ? "highshelf" : "peaking");
                    filter.frequency.value = freq;
                    filter.Q.value = 1.0;
                    filter.gain.value = 0;
                    return filter;
                });

                // --- Space effects (mirrors initAudio) ---
                // Delay with 0.3 feedback loop -> wet mix
                const oDelay = offlineCtx.createDelay(2.0);
                const oDelayFeedback = offlineCtx.createGain(); oDelayFeedback.gain.value = 0.3;
                const oDelayMix = offlineCtx.createGain();
                oDelay.connect(oDelayFeedback); oDelayFeedback.connect(oDelay);
                oDelay.connect(oDelayMix);
                oDelay.delayTime.value = delayTime;
                oDelayMix.gain.value = delayVal / 100;

                // Convolution reverb with the same 2 s noise-decay impulse
                const oReverb = offlineCtx.createConvolver();
                oReverb.buffer = buildReverbImpulse(offlineCtx);
                const oReverbMix = offlineCtx.createGain();
                oReverb.connect(oReverbMix);
                oReverbMix.gain.value = reverbVal / 150;

                // Flanger: short delay modulated by an LFO -> wet mix
                const oFlangerDelay = offlineCtx.createDelay(0.02);
                const oFlangerLFO = offlineCtx.createOscillator();
                const oFlangerDepth = offlineCtx.createGain(); oFlangerDepth.gain.value = 0.002;
                const oFlangerMix = offlineCtx.createGain();
                oFlangerLFO.frequency.value = 0.2 + (flangerVal / 100) * 2;
                oFlangerLFO.connect(oFlangerDepth);
                oFlangerDepth.connect(oFlangerDelay.delayTime);
                oFlangerDelay.connect(oFlangerMix);
                oFlangerMix.gain.value = flangerVal / 100;

                // Set amp gain
                oAmpGain.gain.value = 0.1 + (ampVal / 100) * 2.9;

                if(bypass) {
                    // Bypass mode mirrors the live graph: EQ goes flat, the rest of the chain stays engaged
                    oEqBands.forEach(band => band.gain.value = 0);
                } else {
                    const anySolo = Object.values(bands).some(b => b.solo);
                    
                    // Apply 7-band EQ settings
                    for (let i = 0; i < 7; i++) {
                        const bandId = `band-${i + 1}`;
                        const gainKnob = document.getElementById(`knob-gain${i + 1}`);
                        const qKnob = document.getElementById(`knob-q${i + 1}`);
                        
                        if (gainKnob && qKnob) {
                            const gainVal = parseInt(gainKnob.dataset.val);
                            const qVal = parseInt(qKnob.dataset.val);
                            const gainDb = (gainVal - 50) * 0.24;
                            const qFactor = 0.3 + (qVal / 100) * 9.7;
                            
                            let finalGain = gainDb;
                            if (bands[bandId].mute || (anySolo && !bands[bandId].solo)) {
                                finalGain = -60;
                            }
                            
                            oEqBands[i].gain.value = finalGain;
                            oEqBands[i].Q.value = qFactor;
                        }
                    }
                }

                // Filters and sub are always engaged, like the live graph
                oHp.frequency.value = 20 + (hpfVal * 4.8);
                oLp.frequency.value = 2000 + (lpfVal * 200);
                oSubFilter.gain.value = subVal / 10;

                const mainVal = currentMainKnobVal;
                oOutputGain.gain.value = (mainVal / 50) * (mainVal / 50);

                // Connect offline chain: source -> input -> amp -> EQ x7 -> sub -> HPF -> LPF -> (dry + delay + reverb + flanger) -> output
                source.connect(oInputGain); 
                oInputGain.connect(oAmpGain);
                
                // Connect 7 EQ bands in series
                oAmpGain.connect(oEqBands[0]);
                for (let i = 0; i < oEqBands.length - 1; i++) {
                    oEqBands[i].connect(oEqBands[i + 1]);
                }
                
                oEqBands[oEqBands.length - 1].connect(oSubFilter);
                oSubFilter.connect(oHp); 
                oHp.connect(oLp); 

                oLp.connect(oOutputGain);      // dry
                oLp.connect(oDelay);
                oLp.connect(oReverb);
                oLp.connect(oFlangerDelay);
                oDelayMix.connect(oOutputGain);
                oReverbMix.connect(oOutputGain);
                oFlangerMix.connect(oOutputGain);
                oOutputGain.connect(offlineCtx.destination);

                oFlangerLFO.start(0);
                source.start(0);
                const renderedBuffer = await offlineCtx.startRendering();
                const wavBlob = bufferToWave(renderedBuffer, renderedBuffer.length);
                const url = URL.createObjectURL(wavBlob);
                const a = document.createElement('a');
                a.style.display = 'none'; a.href = url; a.download = "master_output.wav";
                document.body.appendChild(a); a.click();
                
                window.URL.revokeObjectURL(url); document.body.removeChild(a);
                statusText.innerText = "EXPORT COMPLETE";
                setTimeout(() => { statusText.innerText = prevStatus; }, 3000);
            } catch (e) {
                console.error(e); statusText.innerText = "RENDER ERROR";
            }
        }

        function bufferToWave(abuffer, len) {
            const numOfChan = abuffer.numberOfChannels;
            const length = len * numOfChan * 2 + 44;
            const buffer = new ArrayBuffer(length);
            const view = new DataView(buffer);
            const channels = [];
            let offset = 0;
            function setUint16(data) { view.setUint16(offset, data, true); offset += 2; }
            function setUint32(data) { view.setUint32(offset, data, true); offset += 4; }
            setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157); setUint32(0x20746d66); setUint32(16); setUint16(1); setUint16(numOfChan);
            setUint32(abuffer.sampleRate); setUint32(abuffer.sampleRate * 2 * numOfChan); setUint16(numOfChan * 2); setUint16(16); setUint32(0x61746164); setUint32(length - offset - 4);
            for(let i = 0; i < abuffer.numberOfChannels; i++) channels.push(abuffer.getChannelData(i));
            for (let i = 0; i < len; i++) {
                for (let ch = 0; ch < numOfChan; ch++) {
                    let s = Math.max(-1, Math.min(1, channels[ch][i]));
                    s = (s < 0 ? s * 0x8000 : s * 0x7FFF);
                    view.setInt16(offset, s, true); offset += 2;
                }
            }
            return new Blob([buffer], { type: "audio/wav" });
        }

        // --- UI Handlers (called from HTML onclick) ---
        // eslint-disable-next-line no-unused-vars
        function togglePill(el, group) {
            el.querySelectorAll('.switch-opt').forEach(o => o.classList.toggle('active'));
            updateAudioParams();
        }

        // eslint-disable-next-line no-unused-vars
        function toggleBypass() {
            bypass = !bypass;
            const sw = document.getElementById('bypassSwitch');
            if(bypass) sw.classList.add('active'); else sw.classList.remove('active');
            updateAudioParams();
        }

        // 7-band EQ control functions
         
        function toggleBandSolo(bandId) {
            bands[bandId].solo = !bands[bandId].solo;
            const btn = document.querySelector(`#${bandId} .led-btn.solo`);
            if (btn) {
                if(bands[bandId].solo) btn.classList.add('active'); 
                else btn.classList.remove('active');
            }
            // If soloing, unmute this band
            if(bands[bandId].solo && bands[bandId].mute) {
                toggleBandMute(bandId);
            }
            updateAudioParams();
        }

         
        function toggleBandMute(bandId) {
            bands[bandId].mute = !bands[bandId].mute;
            const btn = document.querySelector(`#${bandId} .led-btn.mute`);
            if (btn) {
                if(bands[bandId].mute) btn.classList.add('active'); 
                else btn.classList.remove('active');
            }
            // If muting, unsolo this band
            if(bands[bandId].mute && bands[bandId].solo) {
                toggleBandSolo(bandId);
            }
            updateAudioParams();
        }

        // Canvas-based waveform rendering
        const waveformCanvas = document.getElementById('waveformCanvas');
        const canvasCtx = waveformCanvas ? waveformCanvas.getContext('2d') : null;
        
        function resizeCanvas() {
            if (waveformCanvas) {
                waveformCanvas.width = waveformCanvas.offsetWidth * window.devicePixelRatio;
                waveformCanvas.height = waveformCanvas.offsetHeight * window.devicePixelRatio;
                canvasCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
            }
        }
        
        if (waveformCanvas) {
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
        }

        function renderLoop() {
            requestAnimationFrame(renderLoop);
            if (!audioCtx || bypass || !canvasCtx) return; 
            
            const bufferLength = analyserNode.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyserNode.getByteFrequencyData(dataArray);
            
            // Clear canvas
            const width = waveformCanvas.offsetWidth;
            const height = waveformCanvas.offsetHeight;
            canvasCtx.clearRect(0, 0, width, height);
            
            // Draw background
            canvasCtx.fillStyle = '#000';
            canvasCtx.fillRect(0, 0, width, height);
            
            // Draw waveform bars
            const numBars = Math.min(bufferLength, 60); // Limit bars to fit canvas
            const barWidth = (width / numBars) * 0.8;
            const barGap = (width / numBars) * 0.2;
            let x = 0;
            let rms = 0;
            
            const step = Math.floor(bufferLength / numBars);
            for (let i = 0; i < numBars; i++) {
                // Average values for this bar
                let sum = 0;
                for (let j = 0; j < step; j++) {
                    sum += dataArray[i * step + j];
                }
                const avgValue = sum / step;
                const barHeight = (avgValue / 255) * height;
                
                // Create gradient for each bar
                const gradient = canvasCtx.createLinearGradient(0, height - barHeight, 0, height);
                gradient.addColorStop(0, '#00f2ff');
                gradient.addColorStop(1, '#9d00ff');
                
                canvasCtx.fillStyle = gradient;
                canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);
                
                x += barWidth + barGap;
                rms += avgValue;
            }
            
            rms = rms / numBars;
            const meterPct = (rms / 255) * 100 * 1.5; 
            document.getElementById('meter-in').style.height = Math.min(100, meterPct * 0.8) + '%';
            document.getElementById('meter-out').style.height = Math.min(100, meterPct * outputGainNode.gain.value) + '%';
        }
        renderLoop();

        let currentMainKnobVal = 50;
        let activeKnob = null;
        let knobStartY = 0, knobStartVal = 0;
        
        function setupKnob(elementId) {
            const knob = document.getElementById(elementId);
            
            // Mouse events
            knob.addEventListener('mousedown', (e) => {
                activeKnob = elementId;
                knobStartY = e.clientY;
                knobStartVal = parseFloat(knob.dataset.val || 50);
                if (elementId === 'mainKnob') knobStartVal = currentMainKnobVal;
                document.body.style.cursor = 'ns-resize';
                e.preventDefault();
            });
            
            // Touch events
            knob.addEventListener('touchstart', (e) => {
                activeKnob = elementId;
                knobStartY = e.touches[0].clientY;
                knobStartVal = parseFloat(knob.dataset.val || 50);
                if (elementId === 'mainKnob') knobStartVal = currentMainKnobVal;
                document.body.style.cursor = 'ns-resize';
                e.preventDefault();
            }, { passive: false });
        }
        
        // Global mouse/touch move handler
        function handleKnobMove(clientY) {
            if (!activeKnob) return;
            const knob = document.getElementById(activeKnob);
            const deltaY = knobStartY - clientY;
            let newVal = Math.max(0, Math.min(100, knobStartVal + deltaY));
            
            if (activeKnob === 'mainKnob') {
                currentMainKnobVal = newVal;
                knob.style.transform = `rotate(${(newVal - 50) * 2.7}deg)`;
            } else {
                knob.dataset.val = Math.floor(newVal);
                const valDisplay = knob.querySelector('.mini-val-display');
                let displayVal = Math.floor(newVal);
                if(activeKnob === 'knob-lowpass') displayVal = Math.floor(20 + newVal * 4.8);
                if(activeKnob === 'knob-highpass') displayVal = Math.floor(2 + newVal * 0.2) + 'k';
                if(valDisplay) valDisplay.innerText = displayVal;
                knob.style.transform = `rotate(${(newVal - 50) * 2.7}deg)`;
                if(valDisplay) valDisplay.style.transform = `translate(-50%, -50%) rotate(${-(newVal - 50) * 2.7}deg)`;
            }
            markRecipeEdited();
            updateAudioParams();
        }
        
        // Global mouse/touch end handler
        function handleKnobEnd() {
            if (activeKnob) {
                activeKnob = null;
                document.body.style.cursor = 'default';
            }
        }
        
        // Setup all knobs
        setupKnob('mainKnob'); setupKnob('knob-amp-gain'); setupKnob('knob-lowpass'); setupKnob('knob-highpass'); 
        setupKnob('knob-delay'); setupKnob('knob-reverb'); setupKnob('knob-sub'); setupKnob('knob-flanger');
        // Setup 7-band EQ gain and Q knobs
        setupKnob('knob-gain1'); setupKnob('knob-gain2'); setupKnob('knob-gain3'); setupKnob('knob-gain4');
        setupKnob('knob-gain5'); setupKnob('knob-gain6'); setupKnob('knob-gain7');
        setupKnob('knob-q1'); setupKnob('knob-q2'); setupKnob('knob-q3'); setupKnob('knob-q4');
        setupKnob('knob-q5'); setupKnob('knob-q6'); setupKnob('knob-q7');
        
        // Global event listeners (only once)
        window.addEventListener('mouseup', handleKnobEnd);
        window.addEventListener('mousemove', (e) => handleKnobMove(e.clientY));
        window.addEventListener('touchend', handleKnobEnd);
        window.addEventListener('touchcancel', handleKnobEnd);
        window.addEventListener('touchmove', (e) => {
            if (activeKnob && e.touches.length > 0) {
                e.preventDefault();
                handleKnobMove(e.touches[0].clientY);
            }
        }, { passive: false });
    


        // =====================================================================
        // SPACE RECIPES (NoDAW Labs)
        // All values are raw knob positions 0–100 using the same mappings as updateAudioParams:
        //   amp  0.1 + v/100*2.9 (31 ≈ unity)   hpf 20 + v*4.8 Hz   lpf 2000 + v*200 Hz (100 = open)
        //   delay time 0.1–1.0 s, wet v/100     reverb wet v/150    sub +v/10 dB @ 80 Hz
        //   flanger wet v/100, rate 0.2–2.2 Hz  main (v/50)^2       eqGain (v-50)*0.24 dB
        //   eqQ 0.3 + v/100*9.7 (7 ≈ Q 1.0; ignored on the 60 Hz / 16 kHz shelves)
        // EQ bands: [60 shelf, 200, 800, 2k, 4k, 8k, 16k shelf]
        // =====================================================================
        const RECIPES = [
            // --- Vocals ---
            { id: 'air-lift', name: 'Air Lift', family: 'Vocals',
              description: 'Gentle 8k/16k air with a mild 80 Hz rumble cut. Low end stays flat.',
              amp: 31, hpf: 13, lpf: 100, delay: 0, reverb: 6, sub: 0, flanger: 0, main: 50,
              eqGain: [50, 50, 50, 52, 55, 60, 64], eqQ: [7, 7, 7, 7, 7, 7, 7] },
            { id: 'de-box', name: 'De-Box', family: 'Vocals',
              description: 'Scoops boxy 200–800 Hz buildup and opens the top a touch.',
              amp: 33, hpf: 15, lpf: 100, delay: 0, reverb: 0, sub: 0, flanger: 0, main: 50,
              eqGain: [50, 42, 38, 50, 52, 54, 56], eqQ: [7, 12, 9, 7, 7, 7, 7] },
            { id: 'phone-hook', name: 'Phone Hook', family: 'Vocals',
              description: 'Telephone band (~300 Hz–3.4 kHz) with a pushed 800 Hz–2 kHz honk.',
              amp: 40, hpf: 58, lpf: 7, delay: 0, reverb: 4, sub: 0, flanger: 0, main: 54,
              eqGain: [30, 40, 62, 66, 54, 40, 35], eqQ: [7, 9, 12, 10, 9, 7, 7] },
            { id: 'adlib-throw', name: 'Ad-lib Throw', family: 'Vocals',
              description: 'Brighter, thinner ad-lib thrown back with a long echo and hall wash.',
              amp: 31, hpf: 25, lpf: 92, delay: 38, reverb: 40, sub: 0, flanger: 0, main: 46,
              eqGain: [44, 44, 48, 56, 58, 60, 60], eqQ: [7, 7, 7, 7, 7, 7, 7] },
            { id: 'whisper-double', name: 'Whisper Double', family: 'Vocals',
              description: 'Soft, airy double: lower level, presence lift, light echo and room.',
              amp: 24, hpf: 30, lpf: 85, delay: 12, reverb: 18, sub: 0, flanger: 6, main: 48,
              eqGain: [44, 46, 48, 54, 60, 58, 56], eqQ: [7, 7, 7, 7, 8, 7, 7] },

            // --- Low end ---
            { id: '808-weight', name: '808 Weight', family: 'Low end',
              description: '+6 dB sub shelf, top rolled to ~8 kHz, small 800 Hz dip for clean weight.',
              amp: 31, hpf: 2, lpf: 30, delay: 0, reverb: 0, sub: 60, flanger: 0, main: 44,
              eqGain: [58, 50, 42, 48, 50, 50, 50], eqQ: [7, 7, 10, 7, 7, 7, 7] },
            { id: 'sub-glue', name: 'Sub Glue', family: 'Low end',
              description: 'Moderate sub with a touch of 60/200 Hz and a tiny short echo to glue.',
              amp: 31, hpf: 3, lpf: 70, delay: 4, reverb: 0, sub: 35, flanger: 0, main: 46,
              eqGain: [55, 54, 48, 50, 50, 50, 50], eqQ: [7, 6, 7, 7, 7, 7, 7] },
            { id: 'kick-room', name: 'Kick Room', family: 'Low end',
              description: 'Short room and slight echo, 800 Hz box cut, 2–4 kHz beater punch.',
              amp: 33, hpf: 6, lpf: 60, delay: 6, reverb: 18, sub: 15, flanger: 0, main: 48,
              eqGain: [55, 46, 44, 56, 54, 50, 50], eqQ: [7, 12, 9, 12, 10, 7, 7] },
            { id: 'tight-bass', name: 'Tight Bass', family: 'Low end',
              description: 'HPF ~68 Hz, controlled sub, mud cut at 200/800 Hz. No effects.',
              amp: 31, hpf: 10, lpf: 45, delay: 0, reverb: 0, sub: 20, flanger: 0, main: 50,
              eqGain: [52, 40, 44, 52, 50, 50, 50], eqQ: [7, 12, 10, 7, 7, 7, 7] },

            // --- Space ---
            { id: 'small-booth', name: 'Small Booth', family: 'Space',
              description: 'Low, short reverb and a hint of echo, like a tight vocal booth.',
              amp: 31, hpf: 12, lpf: 85, delay: 3, reverb: 12, sub: 0, flanger: 0, main: 50,
              eqGain: [50, 48, 50, 52, 52, 52, 52], eqQ: [7, 7, 7, 7, 7, 7, 7] },
            { id: 'dark-hall', name: 'Dark Hall', family: 'Space',
              description: 'Big reverb wash with the top cut at ~6 kHz and less air.',
              amp: 31, hpf: 18, lpf: 20, delay: 10, reverb: 85, sub: 0, flanger: 0, main: 44,
              eqGain: [48, 48, 50, 48, 44, 38, 34], eqQ: [7, 7, 7, 7, 7, 7, 7] },
            { id: 'slapback-rap', name: 'Slapback Rap', family: 'Space',
              description: 'One quick ~0.2 s slap, almost no reverb, a bit of 2–4 kHz edge.',
              amp: 31, hpf: 18, lpf: 90, delay: 14, reverb: 2, sub: 0, flanger: 0, main: 50,
              eqGain: [48, 48, 48, 54, 54, 52, 52], eqQ: [7, 7, 7, 7, 7, 7, 7] },
            { id: 'ping-pong-hook', name: 'Ping-Pong Hook', family: 'Space',
              description: 'Long ~0.6 s echo and big reverb for hooks. (Mono delay, not true L/R ping-pong.)',
              amp: 31, hpf: 22, lpf: 88, delay: 55, reverb: 45, sub: 0, flanger: 0, main: 42,
              eqGain: [46, 46, 48, 54, 56, 56, 56], eqQ: [7, 7, 7, 7, 7, 7, 7] },

            // --- Character ---
            { id: 'lofi-room', name: 'Lo-fi Room', family: 'Character',
              description: 'Muffled ~4.4 kHz top, thin lows, low-mid bump, light wobble and room.',
              amp: 34, hpf: 30, lpf: 12, delay: 6, reverb: 28, sub: 0, flanger: 15, main: 50,
              eqGain: [46, 54, 56, 50, 44, 40, 38], eqQ: [7, 7, 7, 7, 7, 7, 7] },
            { id: 'tape-wobble', name: 'Tape Wobble', family: 'Character',
              description: 'Flanger warble (~1 Hz) with a soft, rolled-off top and a little warmth.',
              amp: 31, hpf: 10, lpf: 32, delay: 0, reverb: 8, sub: 10, flanger: 45, main: 44,
              eqGain: [52, 52, 50, 48, 46, 44, 42], eqQ: [7, 7, 7, 7, 7, 7, 7] },
            { id: 'syrup-haze', name: 'Syrup Haze', family: 'Character',
              description: 'Slow flanger, deep reverb, dark ~5.6 kHz LPF. Pairs with ScrewAI.',
              amp: 31, hpf: 8, lpf: 18, delay: 16, reverb: 55, sub: 25, flanger: 20, main: 42,
              eqGain: [54, 54, 50, 46, 44, 40, 38], eqQ: [7, 7, 7, 7, 7, 7, 7] },
            { id: 'radio-break', name: 'Radio Break', family: 'Character',
              description: 'Band-limited radio (~260 Hz–4.4 kHz), hot mids, amp pushed with output trimmed.',
              amp: 70, hpf: 50, lpf: 12, delay: 0, reverb: 6, sub: 0, flanger: 0, main: 36,
              eqGain: [35, 42, 64, 62, 52, 40, 38], eqQ: [7, 9, 10, 9, 7, 7, 7] },

            // --- Fix-it ---
            { id: 'harsh-sample-tamer', name: 'Harsh Sample Tamer', family: 'Fix-it',
              description: 'Broad cuts across 2–8 kHz plus a mild 13 kHz LPF to calm brittle samples.',
              amp: 31, hpf: 6, lpf: 55, delay: 0, reverb: 0, sub: 0, flanger: 0, main: 52,
              eqGain: [50, 50, 50, 44, 40, 42, 46], eqQ: [7, 7, 7, 9, 10, 9, 7] },
            { id: 'mud-cut', name: 'Mud Cut', family: 'Fix-it',
              description: 'Clears 200–800 Hz mud with a slight ~87 Hz HPF. Top stays open.',
              amp: 33, hpf: 14, lpf: 100, delay: 0, reverb: 0, sub: 0, flanger: 0, main: 50,
              eqGain: [50, 40, 42, 51, 50, 51, 51], eqQ: [7, 10, 9, 7, 7, 7, 7] },
            { id: 'wide-mono-safe', name: 'Wide-but-Mono-Safe', family: 'Fix-it',
              description: 'Width from moderate stereo reverb and a light echo only. No flanger, so it holds up in mono.',
              amp: 31, hpf: 12, lpf: 92, delay: 8, reverb: 20, sub: 0, flanger: 0, main: 48,
              eqGain: [50, 48, 50, 52, 52, 54, 54], eqQ: [7, 7, 7, 7, 7, 7, 7] }
        ];

        let activeRecipeId = null;

        // Programmatically set a knob, mirroring handleKnobMove's rotation and value display.
        function setKnob(id, v) {
            const knob = document.getElementById(id);
            if (!knob) return;
            const val = Math.max(0, Math.min(100, Math.round(Number(v))));
            const rot = (val - 50) * 2.7;
            if (id === 'mainKnob') {
                currentMainKnobVal = val;
                knob.style.transform = `rotate(${rot}deg)`;
                return;
            }
            knob.dataset.val = val;
            knob.style.transform = `rotate(${rot}deg)`;
            const valDisplay = knob.querySelector('.mini-val-display');
            if (valDisplay) {
                let displayVal = val;
                if (id === 'knob-lowpass') displayVal = Math.floor(20 + val * 4.8);
                if (id === 'knob-highpass') displayVal = Math.floor(2 + val * 0.2) + 'k';
                valDisplay.innerText = displayVal;
                valDisplay.style.transform = `translate(-50%, -50%) rotate(${-rot}deg)`;
            }
        }

        function resetSoloMuteBypass() {
            Object.keys(bands).forEach(bandId => {
                bands[bandId].solo = false;
                bands[bandId].mute = false;
                document.querySelectorAll(`#${bandId} .led-btn`).forEach(b => b.classList.remove('active'));
            });
            bypass = false;
            const sw = document.getElementById('bypassSwitch');
            if (sw) sw.classList.remove('active');
        }

        function applyRecipe(idOrName) {
            const key = String(idOrName).toLowerCase();
            const r = RECIPES.find(x => x.id === key || x.name.toLowerCase() === key);
            if (!r) { console.warn('Unknown recipe:', idOrName); return; }

            resetSoloMuteBypass();

            setKnob('knob-amp-gain', r.amp);
            setKnob('knob-lowpass', r.hpf);    // id is swapped: knob-lowpass drives the HPF
            setKnob('knob-highpass', r.lpf);   // id is swapped: knob-highpass drives the LPF
            setKnob('knob-delay', r.delay);
            setKnob('knob-reverb', r.reverb);
            setKnob('knob-sub', r.sub);
            setKnob('knob-flanger', r.flanger);
            for (let i = 0; i < 7; i++) {
                setKnob(`knob-gain${i + 1}`, r.eqGain[i]);
                setKnob(`knob-q${i + 1}`, r.eqQ[i]);
            }
            setKnob('mainKnob', r.main);

            updateAudioParams();   // no-op before first Engage; initAudio() reads the knobs then

            activeRecipeId = r.id;
            document.querySelectorAll('.recipe-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.recipe === r.id);
            });
            const sel = document.getElementById('recipeSelect');
            if (sel) sel.value = r.id;
            const desc = document.getElementById('recipeDesc');
            if (desc) {
                desc.innerHTML = `<strong>${r.name}</strong> · ${r.family}: ${r.description}`;
                delete desc.dataset.edited;
            }
            statusText.innerText = `RECIPE: ${r.name.toUpperCase()}`;
        }

        // Build recipe UI (grid grouped by family + compact dropdown) and wire handlers
        function buildRecipeUI() {
            const grid = document.getElementById('recipeGrid');
            const sel = document.getElementById('recipeSelect');
            const families = [...new Set(RECIPES.map(r => r.family))];

            families.forEach(fam => {
                const items = RECIPES.filter(r => r.family === fam);
                if (grid) {
                    const row = document.createElement('div');
                    row.className = 'recipe-family';
                    const label = document.createElement('div');
                    label.className = 'recipe-family-label';
                    label.textContent = fam;
                    row.appendChild(label);
                    const btns = document.createElement('div');
                    btns.className = 'recipe-family-btns';
                    items.forEach(r => {
                        const b = document.createElement('button');
                        b.type = 'button';
                        b.className = 'preset-btn recipe-btn';
                        b.dataset.recipe = r.id;
                        b.textContent = r.name;
                        b.title = r.description;
                        b.addEventListener('click', () => applyRecipe(r.id));
                        btns.appendChild(b);
                    });
                    row.appendChild(btns);
                    grid.appendChild(row);
                }
                if (sel) {
                    const og = document.createElement('optgroup');
                    og.label = fam;
                    items.forEach(r => {
                        const o = document.createElement('option');
                        o.value = r.id; o.textContent = r.name;
                        og.appendChild(o);
                    });
                    sel.appendChild(og);
                }
            });
            if (sel) sel.addEventListener('change', () => { if (sel.value) applyRecipe(sel.value); });
        }
        buildRecipeUI();

        // Mark the active recipe as edited once the user tweaks a knob by hand
        function markRecipeEdited() {
            if (!activeRecipeId) return;
            const desc = document.getElementById('recipeDesc');
            if (desc && !desc.dataset.edited) {
                desc.dataset.edited = '1';
                desc.insertAdjacentText('beforeend', ' (edited)');
            }
        }
