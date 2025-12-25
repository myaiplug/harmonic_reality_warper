
        let audioCtx;
        let sourceNode, inputGainNode, outputGainNode, analyserNode;
        let lowPassNode, highPassNode;
        let delayNode, reverbNode, subGainNode;
        let flangerLFO, flangerDelay;
        let isPlaying = false, bypass = false;
        let currentFileArrayBuffer = null;
        
        let lowShelfNode, midPeakingNode, hiMidPeakingNode, highShelfNode;
        let bands = {
            low: { mute: false, solo: false },
            mid: { mute: false, solo: false },
            himid: { mute: false, solo: false },
            high: { mute: false, solo: false }
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
            outputGainNode = audioCtx.createGain(); 

            highPassNode = audioCtx.createBiquadFilter(); highPassNode.type = "highpass"; highPassNode.frequency.value = 75;
            lowPassNode = audioCtx.createBiquadFilter(); lowPassNode.type = "lowpass"; lowPassNode.frequency.value = 19000;
            lowShelfNode = audioCtx.createBiquadFilter(); lowShelfNode.type = "lowshelf"; lowShelfNode.frequency.value = 200;
            midPeakingNode = audioCtx.createBiquadFilter(); midPeakingNode.type = "peaking"; midPeakingNode.frequency.value = 800; midPeakingNode.Q.value = 1;
            hiMidPeakingNode = audioCtx.createBiquadFilter(); hiMidPeakingNode.type = "peaking"; hiMidPeakingNode.frequency.value = 3000;
            highShelfNode = audioCtx.createBiquadFilter(); highShelfNode.type = "highshelf"; highShelfNode.frequency.value = 8000;

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
            flangerLFO.start();
            window.flangerMixNode = flangerMix;
            window.flangerLFONode = flangerLFO;
            
            analyserNode = audioCtx.createAnalyser();
            analyserNode.fftSize = 128; analyserNode.smoothingTimeConstant = 0.8;

            // Signal chain
            sourceNode.connect(inputGainNode);
            inputGainNode.connect(lowShelfNode);
            lowShelfNode.connect(midPeakingNode);
            midPeakingNode.connect(hiMidPeakingNode);
            hiMidPeakingNode.connect(highShelfNode);
            highShelfNode.connect(subFilter);
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

            if (bypass) {
                inputGainNode.gain.setTargetAtTime(1, audioCtx.currentTime, 0.1);
                lowShelfNode.gain.value = 0; midPeakingNode.gain.value = 0;
                hiMidPeakingNode.gain.value = 0; highShelfNode.gain.value = 0;
                return;
            }

            const anySolo = Object.values(bands).some(b => b.solo);
            const setBandGain = (bandName, node, activeValue) => {
                if (bands[bandName].mute) node.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
                else if (anySolo && !bands[bandName].solo) node.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
                else node.gain.setTargetAtTime(activeValue, audioCtx.currentTime, 0.1);
            };

            const lowOpt = document.querySelector('#group-low .switch-opt.active').dataset.opt;
            if (lowOpt === 'thick') { lowShelfNode.frequency.value = 100; setBandGain('low', lowShelfNode, 6); }
            else { lowShelfNode.frequency.value = 60; setBandGain('low', lowShelfNode, 3); }

            const midOpt = document.querySelector('#group-mid .switch-opt.active').dataset.opt;
            if (midOpt === 'gentle') { midPeakingNode.Q.value = 0.5; setBandGain('mid', midPeakingNode, 4); }
            else { midPeakingNode.Q.value = 1.0; setBandGain('mid', midPeakingNode, 5); }

            const hiMidOpt = document.querySelector('#group-himid .switch-opt.active').dataset.opt;
            if (hiMidOpt === 'flipped') { hiMidPeakingNode.frequency.value = 2500; setBandGain('himid', hiMidPeakingNode, -3); }
            else { hiMidPeakingNode.frequency.value = 4000; setBandGain('himid', hiMidPeakingNode, 3); }

            const highOpt = document.querySelector('#group-high .switch-opt.active').dataset.opt;
            if (highOpt === 'excite') { highShelfNode.frequency.value = 10000; setBandGain('high', highShelfNode, 8); }
            else { highShelfNode.frequency.value = 8000; setBandGain('high', highShelfNode, -2); }

            const hpfVal = parseInt(document.getElementById('knob-lowpass').dataset.val);
            highPassNode.frequency.setTargetAtTime(20 + (hpfVal * 4.8), audioCtx.currentTime, 0.1);

            const lpfVal = parseInt(document.getElementById('knob-highpass').dataset.val);
            lowPassNode.frequency.setTargetAtTime(2000 + (lpfVal * 200), audioCtx.currentTime, 0.1);

            // New effects controls
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
                const oInputGain = offlineCtx.createGain(); const oOutputGain = offlineCtx.createGain();
                const oHp = offlineCtx.createBiquadFilter(); oHp.type = "highpass";
                const oLp = offlineCtx.createBiquadFilter(); oLp.type = "lowpass";
                const oLowShelf = offlineCtx.createBiquadFilter(); oLowShelf.type = "lowshelf";
                const oMidPeak = offlineCtx.createBiquadFilter(); oMidPeak.type = "peaking";
                const oHiMidPeak = offlineCtx.createBiquadFilter(); oHiMidPeak.type = "peaking";
                const oHighShelf = offlineCtx.createBiquadFilter(); oHighShelf.type = "highshelf";
                const oSubFilter = offlineCtx.createBiquadFilter(); oSubFilter.type = "lowshelf"; oSubFilter.frequency.value = 80;

                if(bypass) {
                    oInputGain.gain.value = 1; oLowShelf.gain.value = 0; oMidPeak.gain.value = 0; oHiMidPeak.gain.value = 0; oHighShelf.gain.value = 0;
                    oSubFilter.gain.value = 0;
                } else {
                    const anySolo = Object.values(bands).some(b => b.solo);
                    const getGain = (band, actVal) => {
                        if(bands[band].mute) return 0;
                        if(anySolo && !bands[band].solo) return 0;
                        return actVal;
                    };
                    const lowOpt = document.querySelector('#group-low .switch-opt.active').dataset.opt;
                    oLowShelf.frequency.value = (lowOpt === 'thick') ? 100 : 60; oLowShelf.gain.value = getGain('low', (lowOpt === 'thick' ? 6 : 3));

                    const midOpt = document.querySelector('#group-mid .switch-opt.active').dataset.opt;
                    oMidPeak.frequency.value = 800; oMidPeak.Q.value = (midOpt === 'gentle') ? 0.5 : 1.0; oMidPeak.gain.value = getGain('mid', (midOpt === 'gentle' ? 4 : 5));

                    const hiMidOpt = document.querySelector('#group-himid .switch-opt.active').dataset.opt;
                    oHiMidPeak.frequency.value = (hiMidOpt === 'flipped') ? 2500 : 4000; oHiMidPeak.gain.value = getGain('himid', (hiMidOpt === 'flipped' ? -3 : 3));

                    const highOpt = document.querySelector('#group-high .switch-opt.active').dataset.opt;
                    oHighShelf.frequency.value = (highOpt === 'excite') ? 10000 : 8000; oHighShelf.gain.value = getGain('high', (highOpt === 'excite' ? 8 : -2));

                    oHp.frequency.value = 20 + (parseInt(document.getElementById('knob-lowpass').dataset.val) * 4.8);
                    oLp.frequency.value = 2000 + (parseInt(document.getElementById('knob-highpass').dataset.val) * 200);
                    
                    const subVal = parseInt(document.getElementById('knob-sub').dataset.val);
                    oSubFilter.gain.value = subVal / 10;
                }

                const mainVal = currentMainKnobVal;
                oOutputGain.gain.value = (mainVal / 50) * (mainVal / 50);

                source.connect(oInputGain); oInputGain.connect(oLowShelf); oLowShelf.connect(oMidPeak);
                oMidPeak.connect(oHiMidPeak); oHiMidPeak.connect(oHighShelf); oHighShelf.connect(oSubFilter);
                oSubFilter.connect(oHp); oHp.connect(oLp); oLp.connect(oOutputGain); oOutputGain.connect(offlineCtx.destination);

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

        function toggleMute(band) {
            bands[band].mute = !bands[band].mute;
            const btn = document.querySelector('#group-'+band+' .led-btn.mute');
            if(bands[band].mute) btn.classList.add('active'); else btn.classList.remove('active');
            if(bands[band].mute && bands[band].solo) toggleSolo(band);
            updateAudioParams();
        }

         
        function toggleSolo(band) {
            bands[band].solo = !bands[band].solo;
            const btn = document.querySelector('#group-'+band+' .led-btn.solo');
            if(bands[band].solo) btn.classList.add('active'); else btn.classList.remove('active');
            if(bands[band].solo && bands[band].mute) toggleMute(band);
            updateAudioParams();
        }

        // eslint-disable-next-line no-unused-vars
        function toggleBypass() {
            bypass = !bypass;
            const sw = document.getElementById('bypassSwitch');
            if(bypass) sw.classList.add('active'); else sw.classList.remove('active');
            updateAudioParams();
        }

        const spectrumContainer = document.getElementById('spectrum');
        const numBars = 40; const barElements = [];
        for (let i = 0; i < numBars; i++) {
            const bar = document.createElement('div');
            bar.classList.add('bar'); bar.style.height = '5%';
            spectrumContainer.appendChild(bar); barElements.push(bar);
        }

        function renderLoop() {
            requestAnimationFrame(renderLoop);
            if (!audioCtx || bypass) return; 
            const bufferLength = analyserNode.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyserNode.getByteFrequencyData(dataArray);
            const step = Math.floor(bufferLength / numBars);
            let rms = 0;
            for (let i = 0; i < numBars; i++) {
                let sum = 0; for (let j = 0; j < step; j++) sum += dataArray[i * step + j];
                const val = sum / step; 
                barElements[i].style.height = Math.max(2, (val / 255) * 100) + '%';
                rms += val;
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
        setupKnob('mainKnob'); setupKnob('knob-lowpass'); setupKnob('knob-highpass'); 
        setupKnob('knob-delay'); setupKnob('knob-reverb'); setupKnob('knob-sub'); setupKnob('knob-flanger');
        
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
    

