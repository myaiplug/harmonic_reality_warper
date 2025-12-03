
        let audioCtx;
        let sourceNode, inputGainNode, outputGainNode, analyserNode;
        let lowPassNode, highPassNode, satNode;
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

        fileInput.addEventListener('change', async function() {
            const file = this.files[0];
            if (file) {
                currentFileArrayBuffer = await file.arrayBuffer();
                const blobUrl = URL.createObjectURL(file);
                audioElement.src = blobUrl;
                statusText.innerText = "MEDIA LOADED";
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

            satNode = audioCtx.createWaveShaper();
            satNode.curve = makeDistortionCurve(0); satNode.oversample = '4x';
            
            analyserNode = audioCtx.createAnalyser();
            analyserNode.fftSize = 128; analyserNode.smoothingTimeConstant = 0.8;

            sourceNode.connect(inputGainNode);
            inputGainNode.connect(lowShelfNode);
            lowShelfNode.connect(midPeakingNode);
            midPeakingNode.connect(hiMidPeakingNode);
            hiMidPeakingNode.connect(highShelfNode);
            highShelfNode.connect(highPassNode); 
            highPassNode.connect(lowPassNode);   
            lowPassNode.connect(satNode);
            satNode.connect(outputGainNode);
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

        function makeDistortionCurve(amount) {
            const k = typeof amount === 'number' ? amount : 50;
            const n_samples = 44100;
            const curve = new Float32Array(n_samples);
            const deg = Math.PI / 180;
            for (let i = 0; i < n_samples; ++i) {
                let x = i * 2 / n_samples - 1;
                if (window.currentSatType === 'tube') {
                    if (x < 0) x = x * 1.2;
                    curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
                } else if (window.currentSatType === 'transfo') {
                    curve[i] = Math.tanh(x * (1 + k/10));
                } else {
                    curve[i] = Math.tanh(x * (1 + k/20));
                }
            }
            return curve;
        }

        function updateAudioParams() {
            if (!audioCtx) return;

            if (bypass) {
                inputGainNode.gain.setTargetAtTime(1, audioCtx.currentTime, 0.1);
                lowShelfNode.gain.value = 0; midPeakingNode.gain.value = 0;
                hiMidPeakingNode.gain.value = 0; highShelfNode.gain.value = 0;
                satNode.curve = makeDistortionCurve(0); 
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

            const hiMidOpt = document.querySelector('#group-hi-mid .switch-opt.active').dataset.opt;
            if (hiMidOpt === 'flipped') { hiMidPeakingNode.frequency.value = 2500; setBandGain('himid', hiMidPeakingNode, -3); }
            else { hiMidPeakingNode.frequency.value = 4000; setBandGain('himid', hiMidPeakingNode, 3); }

            const highOpt = document.querySelector('#group-high .switch-opt.active').dataset.opt;
            if (highOpt === 'excite') { highShelfNode.frequency.value = 10000; setBandGain('high', highShelfNode, 8); }
            else { highShelfNode.frequency.value = 8000; setBandGain('high', highShelfNode, -2); }

            const hpfVal = parseInt(document.getElementById('knob-lowpass').dataset.val);
            highPassNode.frequency.setTargetAtTime(20 + (hpfVal * 4.8), audioCtx.currentTime, 0.1);

            const lpfVal = parseInt(document.getElementById('knob-highpass').dataset.val);
            lowPassNode.frequency.setTargetAtTime(2000 + (lpfVal * 200), audioCtx.currentTime, 0.1);

            const satVal = parseInt(document.getElementById('knob-sat').dataset.val);
            satNode.curve = makeDistortionCurve(satVal * 2); 

            const mainVal = currentMainKnobVal;
            const gain = (mainVal / 50) * (mainVal / 50); 
            outputGainNode.gain.setTargetAtTime(gain, audioCtx.currentTime, 0.1);
        }

        async function downloadProcessedAudio() {
            if(!currentFileArrayBuffer) { alert("Load media first."); return; }
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
                const oSat = offlineCtx.createWaveShaper(); oSat.oversample = '4x';

                if(bypass) {
                    oInputGain.gain.value = 1; oLowShelf.gain.value = 0; oMidPeak.gain.value = 0; oHiMidPeak.gain.value = 0; oHighShelf.gain.value = 0;
                    oSat.curve = makeDistortionCurve(0);
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

                    const hiMidOpt = document.querySelector('#group-hi-mid .switch-opt.active').dataset.opt;
                    oHiMidPeak.frequency.value = (hiMidOpt === 'flipped') ? 2500 : 4000; oHiMidPeak.gain.value = getGain('himid', (hiMidOpt === 'flipped' ? -3 : 3));

                    const highOpt = document.querySelector('#group-high .switch-opt.active').dataset.opt;
                    oHighShelf.frequency.value = (highOpt === 'excite') ? 10000 : 8000; oHighShelf.gain.value = getGain('high', (highOpt === 'excite' ? 8 : -2));

                    oHp.frequency.value = 20 + (parseInt(document.getElementById('knob-lowpass').dataset.val) * 4.8);
                    oLp.frequency.value = 2000 + (parseInt(document.getElementById('knob-highpass').dataset.val) * 200);
                    oSat.curve = makeDistortionCurve(parseInt(document.getElementById('knob-sat').dataset.val) * 2);
                }

                const mainVal = currentMainKnobVal;
                oOutputGain.gain.value = (mainVal / 50) * (mainVal / 50);

                source.connect(oInputGain); oInputGain.connect(oLowShelf); oLowShelf.connect(oMidPeak);
                oMidPeak.connect(oHiMidPeak); oHiMidPeak.connect(oHighShelf); oHighShelf.connect(oHp);
                oHp.connect(oLp); oLp.connect(oSat); oSat.connect(oOutputGain); oOutputGain.connect(offlineCtx.destination);

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
            let numOfChan = abuffer.numberOfChannels, length = len * numOfChan * 2 + 44, buffer = new ArrayBuffer(length), view = new DataView(buffer), channels = [], sample, offset = 0;
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

        // --- UI Handlers ---
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

        window.currentSatType = 'tube';
        function setSatType(type, el) {
            window.currentSatType = type;
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            el.classList.add('active');
            updateAudioParams();
        }

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
        function setupKnob(elementId) {
            const knob = document.getElementById(elementId);
            let isDragging = false, startY, startVal;
            
            // Helper function to update knob value
            function updateKnobValue(clientY) {
                if (!isDragging) return;
                const deltaY = startY - clientY;
                let newVal = Math.max(0, Math.min(100, startVal + deltaY));
                
                if (elementId === 'mainKnob') {
                    currentMainKnobVal = newVal;
                    knob.style.transform = `rotate(${(newVal - 50) * 2.7}deg)`;
                } else {
                    knob.dataset.val = Math.floor(newVal);
                    const valDisplay = knob.querySelector('.mini-val-display');
                    let displayVal = Math.floor(newVal);
                    if(elementId === 'knob-lowpass') displayVal = Math.floor(20 + newVal * 4.8);
                    if(elementId === 'knob-highpass') displayVal = Math.floor(2 + newVal * 0.2) + 'k';
                    if(valDisplay) valDisplay.innerText = displayVal;
                    knob.style.transform = `rotate(${(newVal - 50) * 2.7}deg)`;
                    if(valDisplay) valDisplay.style.transform = `translate(-50%, -50%) rotate(${-(newVal - 50) * 2.7}deg)`;
                }
                updateAudioParams();
            }
            
            // Helper function to start dragging
            function startDrag(clientY) {
                isDragging = true;
                startY = clientY;
                startVal = parseFloat(knob.dataset.val || 50);
                if (elementId === 'mainKnob') startVal = currentMainKnobVal;
                document.body.style.cursor = 'ns-resize';
            }
            
            // Helper function to end dragging
            function endDrag() {
                if(isDragging) {
                    isDragging = false;
                    document.body.style.cursor = 'default';
                    updateAudioParams();
                }
            }
            
            // Mouse events
            knob.addEventListener('mousedown', (e) => {
                startDrag(e.clientY);
                e.preventDefault();
            });
            window.addEventListener('mouseup', endDrag);
            window.addEventListener('mousemove', (e) => updateKnobValue(e.clientY));
            
            // Touch events
            knob.addEventListener('touchstart', (e) => {
                startDrag(e.touches[0].clientY);
                e.preventDefault();
            }, { passive: false });
            window.addEventListener('touchend', endDrag);
            window.addEventListener('touchcancel', endDrag);
            window.addEventListener('touchmove', (e) => {
                if (isDragging && e.touches.length > 0) {
                    updateKnobValue(e.touches[0].clientY);
                    e.preventDefault();
                }
            }, { passive: false });
        }
        setupKnob('mainKnob'); setupKnob('knob-lowpass'); setupKnob('knob-highpass'); setupKnob('knob-sat');
    

