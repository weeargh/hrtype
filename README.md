# What Kind of HR Manager Are You? - Quiz

This project is a web-based quiz designed to help users discover their inner HR archetype.

## Archetypes

*   **🧠 The Strategist:** The data-driven, process-loving optimizer
*   **💛 The Empath:** The emotionally intelligent culture guardian
*   **📏 The Enforcer:** The policy enforcer and compliance champion
*   **🌱 The Visionary:** The future-oriented, change-embracing leader

## Quiz Format

*   20 randomized questions:
    *   10 core HR questions
    *   6 general personality-style questions
    *   4 fun-but-insightful questions
*   Each question has 4 options mapping to an archetype (randomized A/B/C/D to avoid obvious patterns).
*   The system tallies responses using an internal mapping to determine the dominant type.

## Scoring & Visualization

*   **Scoring Engine:** Each question internally maps answers to types. At the end, the most frequent type selected is calculated. Ties result in a hybrid type.
*   **Radar (Spider) Chart:** Primary method to show the user's distribution and balance between all types (Strategist, Empath, Enforcer, Visionary), with axes from 0 to 20.
*   **Pie Chart:** Supplementary summary showing the percentage breakdown of selections per archetype.
*   **Display:** Clearly labels the dominant type and includes short descriptions. Highlights secondary strengths if a score is within 2 points of the top score.

## Project Structure

*   `index.html`: Main HTML file for the quiz interface.
*   `style.css`: CSS file for styling.
*   `script.js`: JavaScript file for quiz logic, DOM manipulation, and chart generation.
*   `questions.json`: Contains all quiz questions, options, and their mappings to archetypes.
*   `README.md`: This file.
*   `system-specification.md`: (To be created) Detailed system specifications.
*   `20-api.yml`: (To be created, if an API is developed) API specification.
*   `convention.md`: (To be created) Coding and design conventions.

## How to Run

1.  Ensure you have all the files (`index.html`, `style.css`, `script.js`, `questions.json`) in the same directory.
2.  Open `index.html` in a web browser.

(Further instructions will be added as the project develops, e.g., including charting libraries.) 