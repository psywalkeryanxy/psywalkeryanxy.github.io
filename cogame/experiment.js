class EscapeAvoidanceExperiment {
    constructor() {
        this.audioContext = null;
        this.audioBuffer = null;
        this.currentScreen = 'welcome';
        this.currentInstructionIndex = 0;
        this.currentTrialIndex = 0;
        this.responseWindow = false;
        this.trialStartTime = null;
        this.data = [];
        this.aversiveSound = null;
        this.isInitialized = false; // Track initialization status
        this.initializationPromise = null; // Store the promise
        
        // Experimental parameters
        this.CUE_DURATION = 1000;
        this.TARGET_DURATION = 2000;
        this.FEEDBACK_DURATION = 2000;
        this.ITI_DURATION = 1000;
        
        // Path to your aversive sound file
        this.AVERSIVE_SOUND_PATH = 'aversive_sound.mp3'; // Change to .wav if using WAV file
        
        // Trial configuration
        this.conditions = [
            {condition: 'escape', response: 'go', cue: 'cue1.png'},
            {condition: 'escape', response: 'nogo', cue: 'cue2.png'},
            {condition: 'avoid', response: 'go', cue: 'cue3.png'},
            {condition: 'avoid', response: 'nogo', cue: 'cue4.png'}
        ];
        
        this.instructions = [
            "You will see different images followed by a choice to press or not press the SPACE bar.",
            "There are TWO types of trials in this experiment:",
            "1) ESCAPE trials: You will hear an unpleasant sound immediately when the image appears. Your goal is to learn which response (press or not press) makes the sound STOP.",
            "2) AVOID trials: You will NOT hear any sound when the image appears. Your goal is to learn which response (press or not press) PREVENTS the sound from playing.",
            "For each image, you need to learn whether pressing SPACE or NOT pressing is the better choice.",
            "Important: The correct response will lead to silence 80% of the time, but not always. This means even correct responses sometimes result in hearing the sound.",
            "When you see 'Choose: Press or Not Press', you have 2 seconds to respond:",
            "- Press SPACE if you think that's the best choice",
            "- Do nothing if you think NOT pressing is the best choice",
            "Try to learn which response works best for each image through trial and error.",
            "Let's begin with some practice trials."
        ];
        
        this.setupEventListeners();
        
        // Initialize audio as soon as the experiment object is created
        this.initializeAudio();
        
        // Create trial type indicator element
        this.createTrialTypeIndicator();
    }
    
    createTrialTypeIndicator() {
        // Create a persistent trial type indicator element
        const indicator = document.createElement('div');
        indicator.id = 'trial-type-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 30px;
            font-size: 24px;
            font-weight: bold;
            border-radius: 10px;
            display: none;
            z-index: 1000;
            text-align: center;
            min-width: 200px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(indicator);
    }
    
    showTrialTypeIndicator(trialType) {
        const indicator = document.getElementById('trial-type-indicator');
        
        if (trialType === 'escape') {
            indicator.style.backgroundColor = '#ff6b6b';
            indicator.style.color = 'white';
            indicator.style.border = '3px solid #c92a2a';
            indicator.innerHTML = `
                <div style="font-size: 28px; margin-bottom: 5px;">ESCAPE TRIAL</div>
                <div style="font-size: 16px; font-weight: normal;">Sound is playing - learn to make it stop</div>
            `;
        } else {
            indicator.style.backgroundColor = '#51cf66';
            indicator.style.color = 'white';
            indicator.style.border = '3px solid #2f9e44';
            indicator.innerHTML = `
                <div style="font-size: 28px; margin-bottom: 5px;">AVOID TRIAL</div>
                <div style="font-size: 16px; font-weight: normal;">No sound yet - learn to keep it that way</div>
            `;
        }
        
        indicator.style.display = 'block';
    }
    
    hideTrialTypeIndicator() {
        const indicator = document.getElementById('trial-type-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.responseWindow) {
                e.preventDefault();
                this.recordResponse(true);
            }
        });
    }
    
    async initializeAudio() {
        // Store the initialization promise so we can wait for it later
        this.initializationPromise = this.initialize();
        
        try {
            await this.initializationPromise;
            this.isInitialized = true;
            console.log('Audio initialization complete');
            
            // Enable the test sound button if it exists
            const testButton = document.querySelector('button[onclick="playTestSound()"]');
            if (testButton) {
                testButton.disabled = false;
                testButton.textContent = 'Test Sound';
            }
        } catch (error) {
            console.error('Failed to initialize audio:', error);
            this.isInitialized = false;
        }
    }
    
    async initialize() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Load the aversive sound
        try {
            await this.loadAversiveSound();
            console.log('Aversive sound loaded successfully');
        } catch (error) {
            console.error('Error loading aversive sound:', error);
            alert(`Error loading sound file: ${error.message}\n\nPlease ensure ${this.AVERSIVE_SOUND_PATH} is in the correct location.`);
            throw error; // Re-throw to prevent experiment from starting
        }
        
        this.trials = this.generateTrials();
    }
    
    async loadAversiveSound() {
        console.log('Attempting to load:', this.AVERSIVE_SOUND_PATH);
        
        try {
            const response = await fetch(this.AVERSIVE_SOUND_PATH);
            console.log('Fetch response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            console.log('Loaded array buffer, size:', arrayBuffer.byteLength, 'bytes');
            
            if (arrayBuffer.byteLength === 0) {
                throw new Error('Loaded file is empty');
            }
            
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            console.log('Audio buffer decoded successfully');
            console.log('Duration:', this.audioBuffer.duration.toFixed(2), 'seconds');
            console.log('Sample rate:', this.audioBuffer.sampleRate, 'Hz');
            console.log('Number of channels:', this.audioBuffer.numberOfChannels);
        } catch (error) {
            console.error('Detailed loading error:', error);
            
            // Provide more helpful error messages
            if (error.message.includes('Failed to fetch')) {
                throw new Error(`Cannot find file: ${this.AVERSIVE_SOUND_PATH}. Make sure the file exists and you're using a web server, not file://`);
            } else if (error.message.includes('Unable to decode audio data')) {
                throw new Error(`File ${this.AVERSIVE_SOUND_PATH} is not a valid audio file or uses an unsupported format`);
            } else {
                throw error;
            }
        }
    }
    
    generateTrials() {
        let trials = [];
        const repetitions = 30; // 30 × 4 conditions = 120 trials
        
        for (let i = 0; i < repetitions; i++) {
            trials = trials.concat(this.shuffle([...this.conditions]));
        }
        
        return trials;
    }
    
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    // Play the loaded aversive sound
    createAversiveSound() {
        if (!this.audioBuffer) {
            console.error('Audio buffer not loaded');
            return null;
        }
        
        // Create buffer source
        const source = this.audioContext.createBufferSource();
        source.buffer = this.audioBuffer;
        
        // Create gain node for volume control
        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime); // Adjust volume as needed
        
        // Optional: Add filters to modify the sound if needed
        const highShelfFilter = this.audioContext.createBiquadFilter();
        highShelfFilter.type = 'highshelf';
        highShelfFilter.frequency.setValueAtTime(3000, this.audioContext.currentTime);
        highShelfFilter.gain.setValueAtTime(3, this.audioContext.currentTime); // Slight high-frequency boost
        
        // Connect nodes
        source.connect(highShelfFilter);
        highShelfFilter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Start playback
        source.start(0);
        
        // Return control object
        return {
            source: source,
            gainNode: gainNode,
            stop: function() {
                // Fade out
                gainNode.gain.exponentialRampToValueAtTime(
                    0.001, 
                    this.audioContext.currentTime + 0.1
                );
                
                // Stop and disconnect after fade
                setTimeout(() => {
                    source.stop();
                    source.disconnect();
                    highShelfFilter.disconnect();
                    gainNode.disconnect();
                }, 150);
            }.bind(this)
        };
    }
    
    // Screen management
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        document.getElementById(screenId).classList.remove('hidden');
    }
    
    async runTrial(trial) {
        const trialData = {
            trial_number: this.currentTrialIndex + 1,
            condition: trial.condition,
            required_response: trial.response,
            cue: trial.cue,
            response: null,
            rt: null,
            accuracy: null,
            feedback_type: null
        };
        
        // Show trial type indicator
        this.showTrialTypeIndicator(trial.condition);
        
        // ITI with fixation
        await this.showFixation();
        
        // Start aversive sound for escape trials
        if (trial.condition === 'escape') {
            this.aversiveSound = this.createAversiveSound();
        }
        
        // Show cue with trial-specific styling
        await this.showCue(trial.cue, trial.condition);
        
        // Show target and collect response
        const response = await this.showTarget(trial.condition);
        trialData.response = response.pressed ? 'go' : 'nogo';
        trialData.rt = response.rt;
        
        // Stop aversive sound if playing (before feedback)
        if (this.aversiveSound) {
            this.aversiveSound.stop();
            this.aversiveSound = null;
        }
        
        // Determine accuracy
        const correct = (response.pressed && trial.response === 'go') || 
                       (!response.pressed && trial.response === 'nogo');
        trialData.accuracy = correct ? 1 : 0;
        
        // Determine feedback based on condition and accuracy
        let playSound = false;
        
        if (trial.condition === 'escape') {
            // ESCAPE: Probabilistic feedback for both correct and incorrect
            if (correct) {
                playSound = Math.random() < 0.2; // 20% chance of sound, 80% silence
            } else {
                playSound = Math.random() < 0.8; // 80% chance of sound, 20% silence
            }
        } else {
            // AVOID: Same probabilistic structure
            if (correct) {
                playSound = Math.random() < 0.2; // 20% chance of sound, 80% silence
            } else {
                playSound = Math.random() < 0.8; // 80% chance of sound, 20% silence
            }
        }
        
        trialData.feedback_type = playSound ? 'sound' : 'silence';
        
        // Show feedback
        await this.showFeedback(playSound, response.pressed, trial.condition);
        
        // Hide trial type indicator
        this.hideTrialTypeIndicator();
        
        // Save trial data
        this.data.push(trialData);
        this.currentTrialIndex++;
    }
    
    async showFixation() {
        document.getElementById('fixation').classList.remove('hidden');
        await this.wait(this.ITI_DURATION);
        document.getElementById('fixation').classList.add('hidden');
    }
    
    async showCue(cueImage, condition) {
        const cueElement = document.getElementById('cue');
        
        // Add condition-specific styling to the cue container
        if (condition === 'escape') {
            cueElement.style.border = '5px solid #ff6b6b';
            cueElement.style.boxShadow = '0 0 20px rgba(255, 107, 107, 0.5)';
        } else {
            cueElement.style.border = '5px solid #51cf66';
            cueElement.style.boxShadow = '0 0 20px rgba(81, 207, 102, 0.5)';
        }
        
        cueElement.innerHTML = `<img src="${cueImage}" alt="cue" style="display: block;">`;
        cueElement.classList.remove('hidden');
        await this.wait(this.CUE_DURATION);
    }
    
    async showTarget(condition) {
        return new Promise((resolve) => {
            const targetElement = document.getElementById('target');
            
            // Add visual indicator for trial type in the target phase
            if (condition === 'escape') {
                targetElement.style.backgroundColor = 'rgba(255, 107, 107, 0.1)';
                targetElement.style.border = '2px solid #ff6b6b';
            } else {
                targetElement.style.backgroundColor = 'rgba(81, 207, 102, 0.1)';
                targetElement.style.border = '2px solid #51cf66';
            }
            
            targetElement.classList.remove('hidden');
            
            this.responseWindow = true;
            this.trialStartTime = performance.now();
            let responded = false;
            
            const responseHandler = (pressed) => {
                if (!responded) {
                    responded = true;
                    this.responseWindow = false;
                    const rt = performance.now() - this.trialStartTime;
                    
                    // Reset target styling
                    targetElement.style.backgroundColor = '';
                    targetElement.style.border = '';
                    
                    resolve({pressed, rt});
                }
            };
            
            // Set up response recording
            this.recordResponse = responseHandler;
            
            // Timeout for no response
            setTimeout(() => {
                if (!responded) {
                    // Reset target styling
                    targetElement.style.backgroundColor = '';
                    targetElement.style.border = '';
                    responseHandler(false);
                }
            }, this.TARGET_DURATION);
        });
    }
    
    async showFeedback(playSound, pressed, condition) {
        const feedbackElement = document.getElementById('feedback');
        document.getElementById('cue').classList.add('hidden');
        document.getElementById('target').classList.add('hidden');
        
        // Reset cue styling
        const cueElement = document.getElementById('cue');
        cueElement.style.border = '';
        cueElement.style.boxShadow = '';
        
        // Add condition context to feedback
        const conditionLabel = condition === 'escape' ? 
            '<span style="color: #ff6b6b; font-weight: bold;">ESCAPE</span>' : 
            '<span style="color: #51cf66; font-weight: bold;">AVOID</span>';
        
        if (playSound) {
            // Play aversive sound with visual feedback
            feedbackElement.innerHTML = `
                <div style="margin-bottom: 10px;">Trial Type: ${conditionLabel}</div>
                <img src="pink_wave.png" alt="sound" style="width: 300px; height: 100px;">
                <p style="margin-top: 20px;">You chose: ${pressed ? 'Press' : 'Not Press'}</p>
                <p style="color: #ff6b6b; font-weight: bold;">Sound Playing!</p>
            `;
            // Play the WAV file during feedback
            const feedbackSound = this.createAversiveSound();
            if (feedbackSound) {
                setTimeout(() => feedbackSound.stop(), this.FEEDBACK_DURATION - 100);
            }
        } else {
            // Silence - no image
            feedbackElement.innerHTML = `
                <div style="margin-bottom: 10px;">Trial Type: ${conditionLabel}</div>
                <p style="font-size: 24px;">You chose: ${pressed ? 'Press' : 'Not Press'}</p>
                <p style="color: #51cf66; font-weight: bold;">Silence!</p>
            `;
        }
        
        feedbackElement.classList.remove('hidden');
        await this.wait(this.FEEDBACK_DURATION);
        feedbackElement.classList.add('hidden');
    }
    
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async run() {
        // Ensure audio is loaded before starting
        if (!this.isInitialized) {
            console.log('Waiting for audio initialization...');
            try {
                await this.initializationPromise;
            } catch (error) {
                console.error('Cannot start experiment: audio initialization failed');
                alert('Cannot start experiment: Audio file failed to load. Please check the console for details.');
                return;
            }
        }
        
        if (!this.audioBuffer) {
            console.error('Cannot start experiment: audio not loaded');
            alert('Cannot start experiment: Audio file not loaded properly.');
            return;
        }
        
        // Optional: Add practice trials
        const practiceTrials = this.trials.slice(0, 8); // First 8 trials as practice
        
        // Show practice message
        const taskScreen = document.getElementById('task-screen');
        const practiceMessage = document.createElement('div');
        practiceMessage.id = 'practice-message';
        practiceMessage.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            font-size: 20px;
            text-align: center;
            z-index: 2000;
        `;
        practiceMessage.innerHTML = `
            <h2>Practice Trials</h2>
            <p>You will now complete 8 practice trials to familiarize yourself with the task.</p>
            <p>Red borders = ESCAPE trials (sound starts immediately)</p>
            <p>Green borders = AVOID trials (no sound initially)</p>
            <button onclick="document.getElementById('practice-message').remove(); experiment.startPractice();" 
                    style="padding: 10px 20px; font-size: 18px; margin-top: 20px;">Start Practice</button>
        `;
        taskScreen.appendChild(practiceMessage);
    }
    
    async startPractice() {
        const practiceTrials = this.trials.slice(0, 8);
        for (let trial of practiceTrials) {
            await this.runTrial(trial);
        }
        
        // Show end of practice message
        const taskScreen = document.getElementById('task-screen');
        const endPracticeMessage = document.createElement('div');
        endPracticeMessage.id = 'end-practice-message';
        endPracticeMessage.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            font-size: 20px;
            text-align: center;
            z-index: 2000;
        `;
        endPracticeMessage.innerHTML = `
            <h2>Practice Complete!</h2>
            <p>You've completed the practice trials.</p>
            <p>Remember: Your goal is to learn which response works best for each image.</p>
            <p>The main experiment will now begin with ${this.trials.length - 8} trials.</p>
            <button onclick="document.getElementById('end-practice-message').remove(); experiment.startMainExperiment();" 
                    style="padding: 10px 20px; font-size: 18px; margin-top: 20px;">Start Main Experiment</button>
        `;
        taskScreen.appendChild(endPracticeMessage);
    }
    
    async startMainExperiment() {
        // Main experiment
        for (let i = 8; i < this.trials.length; i++) {
            await this.runTrial(this.trials[i]);
            
            // Optional: Add progress indicator
            if (i % 20 === 0 && i > 0) {
                console.log(`Progress: ${i}/${this.trials.length} trials completed`);
                
                // Show brief progress message
                const progressMessage = document.createElement('div');
                progressMessage.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    font-size: 18px;
                    text-align: center;
                    z-index: 2000;
                `;
                progressMessage.textContent = `Progress: ${i - 8}/${this.trials.length - 8} trials completed`;
                document.body.appendChild(progressMessage);
                await this.wait(1500);
                progressMessage.remove();
            }
        }
        
        this.showScreen('end-screen');
    }
}

// Global functions for button clicks
let experiment = new EscapeAvoidanceExperiment();

function startCalibration() {
    experiment.showScreen('calibration-screen');
}

async function playTestSound() {
    // Wait for initialization if it hasn't completed
    if (!experiment.isInitialized) {
        console.log('Audio still loading, please wait...');
        alert('Audio is still loading. Please wait a moment and try again.');
        
        // Optionally, wait for it to complete
        try {
            await experiment.initializationPromise;
        } catch (error) {
            alert('Failed to load audio file. Check the console for details.');
            return;
        }
    }
    
    if (!experiment.audioBuffer) {
        alert('Sound file could not be loaded. Please check that the file exists and try refreshing the page.');
        return;
    }
    
    console.log('Playing test sound...');
    const sound = experiment.createAversiveSound();
    if (sound) {
        setTimeout(() => {
            sound.stop();
            console.log('Test sound stopped');
        }, 2000);
    }
}

async function startInstructions() {
    // Ensure audio is loaded before starting instructions
    if (!experiment.isInitialized) {
        alert('Please wait for the audio to finish loading before starting.');
        try {
            await experiment.initializationPromise;
        } catch (error) {
            alert('Cannot proceed: Audio file failed to load.');
            return;
        }
    }
    
    experiment.showScreen('instruction-screen');
    showInstruction();
}

function showInstruction() {
    const textElement = document.getElementById('instruction-text');
    textElement.textContent = experiment.instructions[experiment.currentInstructionIndex];
}

function nextInstruction() {
    experiment.currentInstructionIndex++;
    if (experiment.currentInstructionIndex < experiment.instructions.length) {
        showInstruction();
    } else {
        experiment.showScreen('task-screen');
        experiment.run();
    }
}

function downloadData() {
    const dataStr = JSON.stringify(experiment.data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `escape_avoidance_data_${Date.now()}.json`;
    link.click();
    
    // Clean up
    URL.revokeObjectURL(url);
}

// Add keyboard shortcut for debugging
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'd') {
        console.log('Current data:', experiment.data);
        console.log('Current trial:', experiment.currentTrialIndex);
        console.log('Audio buffer loaded:', experiment.audioBuffer !== null);
        console.log('Is initialized:', experiment.isInitialized);
        console.log('Audio context state:', experiment.audioContext?.state);
    }
});
