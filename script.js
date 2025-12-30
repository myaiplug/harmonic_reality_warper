
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

        function createReverbImpulse() {
            const length = audioCtx.sampleRate * 2;
            const impulse = audioCtx.createBuffer(2, length, audioCtx.sampleRate);
            const left = impulse.getChannelData(0);
            const right = impulse.getChannelData(1);
            for (let i = 0; i < length; i++) {
                left[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
                right[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
            }
            reverbNode.buffer = impulse;
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
                const offlineCtx = new OfflineAudioContext(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate);
                
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
                
                // Note: Delay, reverb, and flanger are omitted from offline rendering for simplicity
                // as they would require complex buffer manipulation. Only EQ, filters, and sub are exported.

                // Set amp gain
                const ampVal = parseInt(document.getElementById('knob-amp-gain').dataset.val);
                oAmpGain.gain.value = 0.1 + (ampVal / 100) * 2.9;

                if(bypass) {
                    // Bypass mode: flat EQ
                    oEqBands.forEach(band => band.gain.value = 0);
                    oSubFilter.gain.value = 0;
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

                    oHp.frequency.value = 20 + (parseInt(document.getElementById('knob-lowpass').dataset.val) * 4.8);
                    oLp.frequency.value = 2000 + (parseInt(document.getElementById('knob-highpass').dataset.val) * 200);
                    
                    const subVal = parseInt(document.getElementById('knob-sub').dataset.val);
                    oSubFilter.gain.value = subVal / 10;
                }

                const mainVal = currentMainKnobVal;
                oOutputGain.gain.value = (mainVal / 50) * (mainVal / 50);

                // Connect offline chain
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
                oLp.connect(oOutputGain); 
                oOutputGain.connect(offlineCtx.destination);

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
    

