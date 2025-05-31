document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const welcomeContainer = document.getElementById('welcome-container');
    const startQuizButton = document.getElementById('start-quiz-btn');
    const quizContainer = document.getElementById('quiz-container');
    const resultsContainer = document.getElementById('results-container');
    const questionArea = document.getElementById('question-area');
    const backButton = document.getElementById('back-btn');
    const restartButton = document.getElementById('restart-btn');
    const dominantArchetypeDiv = document.getElementById('dominant-archetype');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const progressBarContainer = document.getElementById('progress-bar-container');
    const radarChartCanvas = document.getElementById('radarChart');

    // Chart instances
    let radarChartInstance = null;

    // Archetype descriptions (can be expanded)
    const archetypeDetails = {
        "The Strategist": {
            emoji: "🧠",
            tagline: "The systems thinker!",
            description: "You are the Strategist (the systems thinker!). You architect HR like an engineer — scalable, predictive, and always with a dashboard in mind. You thrive on frameworks and see patterns where others see chaos.",
            keywords: "Analytical, Methodical, Systems-Oriented, Data-Driven, Efficient",
            weaknesses: "Can be overly rigid, may overlook human factors, sometimes slow to adapt to change.",
            color: 'rgba(0, 123, 255, 0.7)', // Blue
            borderColor: 'rgb(0, 123, 255)'
        },
        "The Empath": {
            emoji: "💛",
            tagline: "The soul of the org!",
            description: "You are the Empath (the soul of the org!). You lead with heart, listen with intention, and feel the pulse of the culture before the surveys even drop. People trust you — and they should.",
            keywords: "Supportive, Perceptive, Inclusive, Wellness-Focused, Communicator",
            weaknesses: "May avoid tough decisions, risk being too accommodating, can struggle with boundaries.",
            color: 'rgba(255, 193, 7, 0.7)', // Yellow
            borderColor: 'rgb(255, 193, 7)'
        },
        "The Guardian": {
            emoji: "📏",
            tagline: "The policy paladin!",
            description: "You are the Guardian (the policy paladin!). Every guideline, every protocol — you're on it. You keep the company safe without losing your cool. Risk? Managed. Ethics? Uncompromised.",
            keywords: "Principled, Consistent, Fair, Compliant, Risk-Averse, Orderly",
            weaknesses: "Can be inflexible, may stifle creativity, sometimes seen as bureaucratic.",
            color: 'rgba(108, 117, 125, 0.7)', // Gray
            borderColor: 'rgb(108, 117, 125)'
        },
        "The Disruptor": {
            emoji: "🌱",
            tagline: "The HR maverick!",
            description: "You are the Disruptor (the HR maverick!). You rewrite the rules, kill the boring, and shake up the status quo. HR isn't a function to you — it's a frontier.",
            keywords: "Innovative, Forward-Thinking, Inspiring, Change-Agent, Transformative",
            weaknesses: "May overlook details, risk being unrealistic, can lose focus on current needs.",
            color: 'rgba(40, 167, 69, 0.7)', // Green
            borderColor: 'rgb(40, 167, 69)'
        },
        "The Connector": {
            emoji: "🤝",
            tagline: "The culture alchemist!",
            description: "You are the Connector (the culture alchemist!). You turn moments into movements. You know when to celebrate, when to check in, and how to make teams feel like tribes.",
            keywords: "Collaborative, Relational, People-Oriented, Team-Builder, Networker",
            weaknesses: "Can be distracted by socializing, may avoid conflict, sometimes struggles with focus.",
            color: 'rgba(111, 66, 193, 0.7)', // Purple
            borderColor: 'rgb(111, 66, 193)'
        },
        "The Executor": {
            emoji: "🎯",
            tagline: "The fixer!",
            description: "You are the Executor (the fixer!). No drama, no delay — just delivery. You keep things moving, processes humming, and chaos at bay. If it's broken, you're already fixing it.",
            keywords: "Tactical, Outcome-Focused, Efficient, Resourceful, Doer",
            weaknesses: "May rush decisions, risk burning out, can overlook long-term strategy.",
            color: 'rgba(220, 53, 69, 0.7)', // Red
            borderColor: 'rgb(220, 53, 69)'
        }
    };

    // Define the order of archetypes for mapping numeric keys from JSON
    // This order MUST match the numeric keys "1" through "6" in your questions.json weight objects
    const archetypeKeysInOrder = [
        "The Strategist",
        "The Empath",
        "The Guardian",
        "The Disruptor",
        "The Connector",
        "The Executor"
    ];

    // Default emojis for answer options (cycle through these)
    const optionEmojis = ['💼', '📊', '🤝', '🌟'];

    if (!startQuizButton) {
        console.error("CRITICAL: Start Quiz Button not found! Check ID in HTML and script.");
        if (welcomeContainer) {
            welcomeContainer.innerHTML += '<p style="color:red;">Error: Start Quiz button is not working. Please check console.</p>';
        }
        return; // Stop if essential button is missing
    }
    if (!progressBar || !progressText || !progressBarContainer) {
        console.error("CRITICAL: Progress bar elements not found!");
        // Decide if quiz can continue or show error
    }

    // Quiz state
    let currentQuestionIndex = 0;
    let scores = {
        "The Strategist": 0, "The Empath": 0, "The Guardian": 0, "The Disruptor": 0, "The Connector": 0, "The Executor": 0
    };
    let questions = [];
    let userAnswers = []; // Will store { questionId, selectedOptionText }

    // Add a moving emoji to the progress bar
    const progressBarEmoji = document.createElement('span');
    progressBarEmoji.id = 'progress-bar-emoji';
    progressBarEmoji.textContent = '🧑‍💼';
    if (progressBarContainer && !document.getElementById('progress-bar-emoji')) {
        progressBarContainer.appendChild(progressBarEmoji);
    }

    function updateProgressBar() {
        if (!progressBar || !progressText || !progressBarContainer) return; // Elements not found

        if (questions.length === 0) {
            progressBar.style.width = '0%';
            progressText.textContent = '-'; 
            return;
        }

        const effectiveQuestionIndex = Math.min(currentQuestionIndex, questions.length);
        const progressPercentage = (effectiveQuestionIndex / questions.length) * 100;

        if (isNaN(progressPercentage)) {
             console.warn('Progress percentage is NaN. Resetting to 0.');
             progressBar.style.width = '0%';
             progressText.textContent = 'Progress unavailable';
             return;
        }

        progressBar.style.width = `${progressPercentage}%`;

        // Move the emoji along the progress bar
        if (progressBarEmoji) {
            // Calculate the width of the progress bar container
            const barWidth = progressBarContainer.offsetWidth;
            // Calculate the left position for the emoji
            const emojiWidth = 32; // px, matches CSS
            const left = Math.max(0, Math.min(barWidth - emojiWidth, (progressPercentage / 100) * barWidth - emojiWidth / 2));
            progressBarEmoji.style.left = `${left}px`;
        }

        if (currentQuestionIndex === questions.length) { 
            progressText.textContent = `Quiz Complete!`;
        } else if (currentQuestionIndex < questions.length) {
            progressText.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
        } else {
             progressText.textContent = '-';
        }
        progressBarContainer.style.display = 'block';
    }

    async function loadQuestions() {
        try {
            const response = await fetch('questions.json');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status} while fetching questions.json`);
            }
            questions = await response.json();
            if (!Array.isArray(questions)) {
                throw new Error('questions.json did not return an array.');
            }
            userAnswers = new Array(questions.length).fill(null);
            console.log('Questions loaded successfully:', questions.length, 'questions.');
        } catch (error) {
            console.error("Could not load or parse questions.json:", error);
            questions = []; // Ensure questions is an empty array on error
            userAnswers = [];
            if (welcomeContainer) {
                 welcomeContainer.innerHTML += `<p style="color:red;">Error loading quiz questions. Please check the console and ensure 'questions.json' is correct and in the same folder.</p>`;
            }
            // updateProgressBar(); // Update progress bar to reflect error state if it's already visible (not initially)
        }
    }

    function displayQuestion() {
        if (currentQuestionIndex < 0) currentQuestionIndex = 0;
        if (currentQuestionIndex >= questions.length) {
            if (questions.length === 0) {
                console.warn("Attempted to display question but no questions are loaded. Showing results/error.");
                showResults();
                return;
            }
            showResults();
            return;
        }
        updateProgressBar();

        const currentQuestion = questions[currentQuestionIndex];
        questionArea.innerHTML = '';

        const questionText = document.createElement('p');
        questionText.className = 'question-text';
        questionText.textContent = currentQuestion.text;
        questionArea.appendChild(questionText);

        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'options';
        const shuffledOptions = [...currentQuestion.options].sort(() => Math.random() - 0.5);
        const previousAnswer = userAnswers[currentQuestionIndex];
        // Use per-question emojis if present, else fallback
        const emojis = Array.isArray(currentQuestion.emojis) && currentQuestion.emojis.length === 4 ? currentQuestion.emojis : optionEmojis;
        // Create all buttons first
        const optionButtons = shuffledOptions.map((optionText, idx) => {
            const button = document.createElement('button');
            // Add emoji/icon at the start
            const emojiSpan = document.createElement('span');
            emojiSpan.className = 'option-emoji';
            // Find the index of this option in the original options array to match emoji
            const origIdx = currentQuestion.options.indexOf(optionText);
            emojiSpan.textContent = emojis[origIdx >= 0 ? origIdx : idx % emojis.length];
            button.appendChild(emojiSpan);
            // Add the option text
            const textSpan = document.createElement('span');
            textSpan.className = 'option-text';
            textSpan.textContent = optionText;
            button.appendChild(textSpan);
            button.onclick = () => handleAnswerSelection(optionText, currentQuestion.id);
            if (previousAnswer && previousAnswer.selectedOptionText === optionText) {
                button.classList.add('selected');
            }
            optionsDiv.appendChild(button);
            return button;
        });
        questionArea.appendChild(optionsDiv);

        // Ensure all buttons have the same height (match tallest)
        setTimeout(() => {
            let maxHeight = 0;
            optionButtons.forEach(btn => {
                btn.style.height = '';
                if (btn.offsetHeight > maxHeight) maxHeight = btn.offsetHeight;
            });
            optionButtons.forEach(btn => {
                btn.style.height = maxHeight + 'px';
            });
        }, 0);

        backButton.style.display = (currentQuestionIndex > 0) ? 'inline-block' : 'none';
        quizContainer.style.display = 'block';
        welcomeContainer.style.display = 'none';
        resultsContainer.style.display = 'none';
    }

    function handleAnswerSelection(selectedOptionText, questionId) {
        const currentQuestion = questions[currentQuestionIndex];
        const newSelectedWeights = currentQuestion.mapping[selectedOptionText];

        if (!newSelectedWeights) {
            console.error(`Error: No weight mapping found for option "${selectedOptionText}" in Q${questionId}`);
            return; // Or handle error more gracefully
        }

        // 1. If user re-answers a question, subtract scores from the PREVIOUS answer for this question
        const previousAnswerRecord = userAnswers[currentQuestionIndex];
        if (previousAnswerRecord && previousAnswerRecord.selectedOptionText) {
            const previousSelectedOptionText = previousAnswerRecord.selectedOptionText;
            const previousWeights = currentQuestion.mapping[previousSelectedOptionText];
            if (previousWeights) {
                console.log("Subtracting previous scores:", previousWeights);
                for (const numericKey in previousWeights) {
                    const archetypeIndex = parseInt(numericKey) - 1;
                    if (archetypeIndex >= 0 && archetypeIndex < archetypeKeysInOrder.length) {
                        const archetypeKey = archetypeKeysInOrder[archetypeIndex];
                        scores[archetypeKey] -= previousWeights[numericKey];
                    }
                }
            }
        }

        // 2. Record new answer and ADD its scores
        console.log("Adding new scores:", newSelectedWeights);
        for (const numericKey in newSelectedWeights) {
            const archetypeIndex = parseInt(numericKey) - 1;
            if (archetypeIndex >= 0 && archetypeIndex < archetypeKeysInOrder.length) {
                const archetypeKey = archetypeKeysInOrder[archetypeIndex];
                scores[archetypeKey] += newSelectedWeights[numericKey];
            }
        }
        userAnswers[currentQuestionIndex] = { questionId, selectedOptionText };

        console.log(`Q${currentQuestionIndex + 1} ('${questionId}') answered with "${selectedOptionText}". Current cumulative scores:`, JSON.parse(JSON.stringify(scores)));
        console.log('All user answers history:', userAnswers);

        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            displayQuestion();
        } else {
            showResults();
        }
    }

    function handleBackButton() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            displayQuestion();
        }
    }

    function showResults() {
        console.log("Showing results. Final scores:", scores);
        quizContainer.style.display = 'none';
        welcomeContainer.style.display = 'none';
        resultsContainer.style.display = 'block';
        backButton.style.display = 'none';
        updateProgressBar(); 
        if (questions.length === 0){
            dominantArchetypeDiv.innerHTML = "<h3>Quiz Error</h3><p>Could not display results as no questions were loaded. Please check the setup.</p>";
        } else {
            calculateAndDisplayResultsText();
            renderRadarChart();
        }
        console.log("All user answers at end:", userAnswers);
    }

    function generateHybridBrief(type1, type2) {
        // Extract the first sentence or main energy from each description
        const desc1 = archetypeDetails[type1].description;
        const desc2 = archetypeDetails[type2].description;
        // Try to extract the main energy/trait from the first sentence
        const main1 = desc1.split('. ')[0].replace(/^You are the? [^(]+\([^)]+\)!?\s*/i, '').trim();
        const main2 = desc2.split('. ')[0].replace(/^You are the? [^(]+\([^)]+\)!?\s*/i, '').trim();
        // Compose a blended brief
        return `You combine the ${main1.toLowerCase()} of a ${type1.replace(/^The /, '')} with the ${main2.toLowerCase()} of a ${type2.replace(/^The /, '')}. This unique blend allows you to leverage both perspectives, driving impact in HR through both innovation and structure.`;
    }

    // Contradictory trait and weakness pairs for filtering
    const contradictoryTraits = [
        ["Supportive", "Rigid"],
        ["Inclusive", "Inflexible"],
        ["Collaborative", "Orderly"],
        ["Innovative", "Risk-Averse"],
        ["Efficient", "Slow to adapt to change"],
        ["People-Oriented", "Data-Driven"],
        // Add more as needed
    ];
    const contradictoryWeaknesses = [
        ["May avoid tough decisions", "May rush decisions"],
        ["Can be overly rigid", "Can be too accommodating"],
        ["May overlook human factors", "Can struggle with boundaries"],
        ["Can be inflexible", "Can be distracted by socializing"],
        // Add more as needed
    ];

    function filterContradictions(arr, contradictionPairs) {
        const set = new Set(arr);
        for (const [a, b] of contradictionPairs) {
            if (set.has(a) && set.has(b)) {
                // Remove the one that is less relevant (arbitrarily, remove b)
                set.delete(b);
            }
        }
        return Array.from(set);
    }

    function selectHybridTraits(type1, type2) {
        // Extract, deduplicate, and filter contradictory traits
        const traitsA = archetypeDetails[type1].keywords.split(',').map(s => s.trim());
        const traitsB = archetypeDetails[type2].keywords.split(',').map(s => s.trim());
        let allTraits = Array.from(new Set([...traitsA, ...traitsB]));
        allTraits = filterContradictions(allTraits, contradictoryTraits);
        // Pick up to 6 traits that best represent the hybrid
        return allTraits.slice(0, 6).join(', ');
    }

    function selectHybridWeaknesses(type1, type2) {
        // Extract, deduplicate, and filter contradictory weaknesses
        const weaknessesA = archetypeDetails[type1].weaknesses.split(',').map(s => s.trim());
        const weaknessesB = archetypeDetails[type2].weaknesses.split(',').map(s => s.trim());
        let allWeaknesses = Array.from(new Set([...weaknessesA, ...weaknessesB]));
        allWeaknesses = filterContradictions(allWeaknesses, contradictoryWeaknesses);
        // Pick up to 4 weaknesses that best represent the hybrid
        return allWeaknesses.slice(0, 4).join(', ');
    }

    function calculateAndDisplayResultsText() {
        // Sort archetypes by score (descending)
        const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
        const [topType, topScore] = sorted[0];
        const [secondType, secondScore] = sorted[1];
        let isHybrid = false;
        // 20% threshold for hybrid
        if (secondScore > 0 && (topScore - secondScore) / topScore < 0.20) {
            isHybrid = true;
        }
        let resultTitle = "";
        let resultDescription = "";
        let resultKeywords = "";
        let resultWeaknesses = "";
        if (isHybrid) {
            // Combine names, emojis, no taglines
            resultTitle = `${archetypeDetails[topType].emoji}${archetypeDetails[secondType].emoji} ${topType.replace(/^The /, '')} – ${secondType.replace(/^The /, '')}`;
            // Generate a single, cohesive hybrid brief
            resultDescription = generateHybridBrief(topType, secondType);
            // Intelligently select and blend traits and weaknesses
            resultKeywords = selectHybridTraits(topType, secondType);
            resultWeaknesses = selectHybridWeaknesses(topType, secondType);
        } else {
            // Single dominant
            resultTitle = `${archetypeDetails[topType].emoji} You are ${topType}`;
            const desc = archetypeDetails[topType].description;
            resultDescription = desc.replace(/^You are the? [^(]+\([^)]+\)!?\.?\s*/i, '');
            resultKeywords = archetypeDetails[topType].keywords;
            resultWeaknesses = archetypeDetails[topType].weaknesses;
        }
        // Identify secondary strengths (within 10 points of maxScore, not dominant)
        let secondaryStrengthsText = "";
        const maxScore = topScore;
        const dominantTypes = isHybrid ? [topType, secondType] : [topType];
        const secondaryTypes = [];
        for (const [type, score] of Object.entries(scores)) {
            if (!dominantTypes.includes(type) && (maxScore - score <= 10 && score > 0 && maxScore > score) ) {
                secondaryTypes.push(type);
            }
        }
        if (secondaryTypes.length > 0) {
            secondaryStrengthsText = "<br><br><span class='secondary-strengths'><strong>You also show strong tendencies as:</strong> " + secondaryTypes.map(t => `${archetypeDetails[t].emoji} ${t}`).join(', ') + ".</span>";
        }
        dominantArchetypeDiv.innerHTML = `
            <h3>${resultTitle}</h3>
            <p>${resultDescription}${secondaryStrengthsText ? `<span class='secondary-strengths'>${secondaryStrengthsText}</span>` : ''}</p>
            <div><span class=\"traits-label\">Key traits:</span><span class=\"traits-content\">${resultKeywords}</span></div>
            <div><span class=\"weaknesses-label\">Known weaknesses:</span><span class=\"weaknesses-content\">${resultWeaknesses}</span></div>
        `;
        console.log("Dominant Types:", dominantTypes, "Max Score:", maxScore);
        console.log("All Scores for Charting:", scores);
    }

    function renderRadarChart() {
        if (!radarChartCanvas) return;
        if (radarChartInstance) {
            radarChartInstance.destroy();
        }
        const labels = Object.keys(scores);
        const dataValues = Object.values(scores);
        // Remove 'The ' from archetype labels for the chart
        const chartLabels = labels.map(label => {
            let cleanLabel = label.replace(/^The /, '');
            return `${archetypeDetails[label].emoji} ${cleanLabel}`;
        });
        radarChartInstance = new Chart(radarChartCanvas, {
            type: 'radar',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'Your Archetype Scores',
                    data: dataValues,
                    fill: true,
                    backgroundColor: 'rgba(0, 123, 255, 0.2)',
                    borderColor: 'rgb(0, 123, 255)',
                    pointBackgroundColor: 'rgb(0, 123, 255)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(0, 123, 255)'
                }]
            },
            options: {
                elements: {
                    line: {
                        borderWidth: 3
                    }
                },
                scales: {
                    r: {
                        angleLines: { display: true },
                        suggestedMin: 0,
                        suggestedMax: questions.length > 0 ? Math.max(5, ...dataValues) : 5,
                        pointLabels: {
                            font: {
                                size: 13,
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.r !== null) {
                                    label += context.parsed.r;
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    startQuizButton.addEventListener('click', () => {
        console.log("Start Quiz button clicked!");
        if (!welcomeContainer || !quizContainer || !resultsContainer) {
            console.error("CRITICAL: One or more main containers not found during Start Quiz click!");
            return;
        }
        welcomeContainer.style.display = 'none';
        quizContainer.style.display = 'block';
        resultsContainer.style.display = 'none';
        console.log("Calling startQuiz()...");
        startQuiz();
    });

    backButton.addEventListener('click', handleBackButton);

    restartButton.addEventListener('click', () => {
        console.log("Restart button clicked");
        currentQuestionIndex = 0;
        scores = { 
            "The Strategist": 0, 
            "The Empath": 0, 
            "The Guardian": 0, 
            "The Disruptor": 0,
            "The Connector": 0, // Added
            "The Executor": 0   // Added
        };
        if (questions.length > 0) {
             userAnswers = new Array(questions.length).fill(null);
        }
        // Destroy old charts before going to welcome screen
        if (radarChartInstance) {
            radarChartInstance.destroy();
            radarChartInstance = null;
        }
        resultsContainer.style.display = 'none';
        quizContainer.style.display = 'none'; 
        welcomeContainer.style.display = 'block'; 
        if(progressBar) progressBar.style.width = `0%`; 
        if(progressText) progressText.textContent = ``;
    });

    function startQuiz() {
        console.log("startQuiz() called. Questions available:", questions.length);
        currentQuestionIndex = 0;
        scores = { 
            "The Strategist": 0, 
            "The Empath": 0, 
            "The Guardian": 0, 
            "The Disruptor": 0,
            "The Connector": 0, // Added
            "The Executor": 0   // Added
        };
        if (questions.length > 0) {
            userAnswers = new Array(questions.length).fill(null);
        } else {
            // If no questions, displayQuestion will immediately go to showResults,
            // which will then show an error message because questions.length is 0.
            console.warn("Starting quiz with no questions loaded.");
        }
        displayQuestion(); 
    }

    async function initializeQuiz() {
        console.log("Initializing quiz...");
        await loadQuestions(); 
        // Initial UI setup, irrespective of question loading success for welcome screen
        welcomeContainer.style.display = 'block';
        quizContainer.style.display = 'none';
        resultsContainer.style.display = 'none';
        // Progress bar is updated by displayQuestion or showResults when they are called
        console.log("Quiz initialized. Welcome screen should be visible.");
    }

    initializeQuiz();

    console.log('Quiz script V4: Robustness for start button and progress bar.');
});