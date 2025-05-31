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

    function updateProgressBar() {
        if (!progressBar || !progressText || !progressBarContainer) return; // Elements not found

        if (questions.length === 0) {
            progressBar.style.width = '0%';
            // Show a generic message or hide if questions aren't loaded
            progressText.textContent = '-'; 
            // progressBarContainer.style.display = 'none'; // Option to hide it
            return;
        }

        // currentQuestionIndex can be equal to questions.length when quiz is complete (on results page)
        const effectiveQuestionIndex = Math.min(currentQuestionIndex, questions.length);
        const progressPercentage = (effectiveQuestionIndex / questions.length) * 100;

        if (isNaN(progressPercentage)) {
             console.warn('Progress percentage is NaN. Resetting to 0.');
             progressBar.style.width = '0%';
             progressText.textContent = 'Progress unavailable';
             return;
        }

        progressBar.style.width = `${progressPercentage}%`;

        if (currentQuestionIndex === questions.length) { 
            progressText.textContent = `Quiz Complete!`;
        } else if (currentQuestionIndex < questions.length) {
            // Display current question as 1-indexed for users
            progressText.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
        } else {
             progressText.textContent = '-'; // Default/fallback
        }
        progressBarContainer.style.display = 'block'; // Ensure it's visible if previously hidden
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

        // Create all buttons first
        const optionButtons = shuffledOptions.map(optionText => {
            const button = document.createElement('button');
            button.textContent = optionText;
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
            setupLinkedInShare();
        }
        console.log("All user answers at end:", userAnswers);
    }

    function calculateAndDisplayResultsText() {
        let maxScore = -1;
        let dominantTypes = [];

        // Find the maximum score
        for (const type in scores) {
            if (scores[type] > maxScore) {
                maxScore = scores[type];
            }
        }

        // Find all types that match the maximum score
        for (const type in scores) {
            if (scores[type] === maxScore) {
                dominantTypes.push(type);
            }
        }

        let resultTitle = "";
        let resultDescription = "";
        let resultKeywords = "";
        let resultWeaknesses = "";
        let resultTagline = "";
        if (dominantTypes.length === 1) {
            const type = dominantTypes[0];
            resultTitle = `${archetypeDetails[type].emoji} You are ${type}`;
            resultTagline = `<span style='font-size:1.1em;color:#888;'>${archetypeDetails[type].tagline}</span>`;
            resultDescription = archetypeDetails[type].description;
            resultKeywords = archetypeDetails[type].keywords;
            resultWeaknesses = archetypeDetails[type].weaknesses;
        } else if (dominantTypes.length > 1) {
            const typeNames = dominantTypes.map(t => `${archetypeDetails[t].emoji} ${t}`).join(' / ');
            resultTitle = `Hybrid: You are ${typeNames}`;
            resultTagline = dominantTypes.map(t => `<span style='font-size:1.1em;color:#888;'>${archetypeDetails[t].tagline}</span>`).join(' / ');
            resultDescription = "You show a strong blend of qualities from multiple archetypes! This makes you a versatile and adaptable HR professional.";
            dominantTypes.forEach(type => {
                resultDescription += `<br><br><strong>${type}:</strong> ${archetypeDetails[type].description.substring(0, 100)}...`;
            });
            resultKeywords = dominantTypes.map(t => archetypeDetails[t].keywords).join('; ');
            resultWeaknesses = dominantTypes.map(t => `<strong>${type}:</strong> ${archetypeDetails[t].weaknesses}`).join('<br>');
        } else {
            // Should not happen if scores are calculated
            resultTitle = "Hmm, something went wrong with the scoring.";
            resultDescription = "We couldn't determine your archetype. Please try the quiz again.";
        }

        // Identify secondary strengths (within 10 points of maxScore, not dominant)
        let secondaryStrengthsText = "";
        const secondaryTypes = [];
        for (const type in scores) {
            if (!dominantTypes.includes(type) && (maxScore - scores[type] <= 10 && scores[type] > 0 && maxScore > scores[type]) ) {
                secondaryTypes.push(type);
            }
        }
        if (secondaryTypes.length > 0) {
            secondaryStrengthsText = "<br><br><strong>You also show strong tendencies as:</strong> " + secondaryTypes.map(t => `${archetypeDetails[t].emoji} ${t}`).join(', ') + ".";
        }

        dominantArchetypeDiv.innerHTML = `
            <h3>${resultTitle}</h3>
            <div>${resultTagline}</div>
            <p>${resultDescription}${secondaryStrengthsText}</p>
            <p style="font-size: 0.9em; color: #555;"><em>Key traits: ${resultKeywords}</em></p>
            <p style="font-size: 0.9em; color: #b00;"><em>Known weaknesses: ${resultWeaknesses}</em></p>
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
        radarChartInstance = new Chart(radarChartCanvas, {
            type: 'radar',
            data: {
                labels: labels.map(label => `${archetypeDetails[label].emoji} ${label}`),
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

    function setupLinkedInShare() {
        const shareBtn = document.getElementById('linkedin-share-btn');
        if (!shareBtn) return;
        // Get the dominant archetype info
        let maxScore = -1;
        let dominantTypes = [];
        for (const type in scores) {
            if (scores[type] > maxScore) maxScore = scores[type];
        }
        for (const type in scores) {
            if (scores[type] === maxScore) dominantTypes.push(type);
        }
        // Use the first dominant type for sharing
        const type = dominantTypes[0];
        const emoji = archetypeDetails[type].emoji;
        const name = type;
        const tagline = archetypeDetails[type].tagline;
        const quizUrl = window.location.origin + window.location.pathname;
        const shareText = `I just discovered my HR archetype: ${emoji} ${name}! ${tagline} Try the quiz: ${quizUrl}`;
        shareBtn.onclick = function() {
            const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(quizUrl)}&mini=true&title=${encodeURIComponent('What Kind of HR Manager Are You?')}&summary=${encodeURIComponent(shareText)}`;
            window.open(linkedInUrl, '_blank', 'width=600,height=600');
        };
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