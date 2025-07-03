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
            "Sometimes you will hear an unpleasant sound. Your goal is to learn which response leads to silence.",
            "For some images, pressing SPACE will be the best choice. For others, NOT pressing will be better.",
            "The correct response leads to silence 80% of the time, but not always.",
            "Press SPACE when you see 'Choose: Press or Not Press' if you want to press.",
            "Do nothing if you choose not to press.",
            "Let's begin with some practice trials."
        ];
        
        this.setupEventListeners();
        
        // Initialize audio as soon as the experiment object is created
        this.initializeAudio();
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
        
        // ITI with fixation
        await this.showFixation();
        
        // Start aversive sound for escape trials
        if (trial.condition === 'escape') {
            this.aversiveSound = this.createAversiveSound();
        }
        
        // Show cue
        await this.showCue(trial.cue);
        
        // Show target and collect response
        const response = await this.showTarget();
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
        await this.showFeedback(playSound, response.pressed);
        
        // Save trial data
        this.data.push(trialData);
        this.currentTrialIndex++;
    }
    
    async showFixation() {
        document.getElementById('fixation').classList.remove('hidden');
        await this.wait(this.ITI_DURATION);
        document.getElementById('fixation').classList.add('hidden');
    }
    
    async showCue(cueImage) {
        const cueElement = document.getElementById('cue');
        cueElement.innerHTML = `<img src="${cueImage}" alt="cue">`;
        cueElement.classList.remove('hidden');
        await this.wait(this.CUE_DURATION);
    }
    
    async showTarget() {
        return new Promise((resolve) => {
            const targetElement = document.getElementById('target');
            targetElement.classList.remove('hidden');
            
            this.responseWindow = true;
            this.trialStartTime = performance.now();
            let responded = false;
            
            const responseHandler = (pressed) => {
                if (!responded) {
                    responded = true;
                    this.responseWindow = false;
                    const rt = performance.now() - this.trialStartTime;
                    resolve({pressed, rt});
                }
            };
            
            // Set up response recording
            this.recordResponse = responseHandler;
            
            // Timeout for no response
            setTimeout(() => {
                if (!responded) {
                    responseHandler(false);
                }
            }, this.TARGET_DURATION);
        });
    }
    
    async showFeedback(playSound, pressed) {
        const feedbackElement = document.getElementById('feedback');
        document.getElementById('cue').classList.add('hidden');
        document.getElementById('target').classList.add('hidden');
        
        if (playSound) {
            // Play aversive sound with visual feedback
            feedbackElement.innerHTML = `
                <img src="pink_wave.png" alt="sound" style="width: 300px; height: 100px;">
                <p style="margin-top: 20px;">You chose: ${pressed ? 'Press' : 'Not Press'}</p>
            `;
            // Play the WAV file during feedback
            const feedbackSound = this.createAversiveSound();
            if (feedbackSound) {
                setTimeout(() => feedbackSound.stop(), this.FEEDBACK_DURATION - 100);
            }
        } else {
            // Silence - no image
            feedbackElement.innerHTML = `
                <p style="font-size: 24px;">You chose: ${pressed ? 'Press' : 'Not Press'}</p>
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
        for (let trial of practiceTrials) {
            await this.runTrial(trial);
        }
        
        // Main experiment
        for (let i = 8; i < this.trials.length; i++) {
            await this.runTrial(this.trials[i]);
            
            // Optional: Add progress indicator
            if (i % 20 === 0 && i > 0) {
                console.log(`Progress: ${i}/${this.trials.length} trials completed`);
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