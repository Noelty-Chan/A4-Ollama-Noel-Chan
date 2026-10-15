const OLLAMA_API_URL = "http://localhost:11434/api/generate";
const OLLAMA_TAGS = "http://localhost:11434/api/tags";

const modelSelected = document.getElementById("model");
const promptForm = document.getElementById("promptForm");
const promptInput = document.getElementById("prompt")
const errorElem = document.getElementById("error");
const answer = document.getElementById("answer");

// LOAD AI MODELS
async function loadOllamaModels() {
    try {
        const response = await fetch(OLLAMA_TAGS);
        // CHECK THE REQUEST
        if (!response.ok) {
            errorElem.innerHTML = "Failed to fetch model list."
            throw new Error("Failed to fetch model list.");
        }
        const data = await response.json();
        // Minimum of one model must exist.
        if (data.models && data.models.length > 0) {
            // CREATE A LOOP - MAP - TO EVERY MODEL & CREATE SOMETHING NEW.
            const optionsHTML = data.models.map((model) => `<option value="${model.name}">${model.name}</option>`).join("")
            // INSERT MODEL INTO THE DROP DOWN MENU
            modelSelected.innerHTML = optionsHTML;
        }
        else {
            modelSelected.innerHTML = "<option disabled>No Model Found</option>"
        }
    }
    catch (err) {
        // MESSAGE FOR WHEN THE MODEL DOES NOT EXIST
        console.error("Error Loading Models", err);
        errorElem.innerHTML = err.message; modelSelected.innerHTML = `<option disabled>${err.message}</option>`
    }
}
loadOllamaModels();

// SEND A PROMPT TO AI
async function getOllamaResponse(event) {
    event.preventDefault();
    // GET THE USER PROMPT
    const userPrompt = document.getElementById("prompt").value;
    const payload = {
        model: modelSelected.value,
        prompt: userPrompt,
        stream: false
    }

    try {
        const response = await fetch(OLLAMA_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error(`Error:${response.status}-${response.statusText}`);
        }
        const data = await response.json();
        console.log(modelSelected.value + "OUTPUT", data);
        answer.innerHTML = `<p>${modelSelected.value} ouput:</p>${data.response}`
    }
    catch (err) {
        console.error("Error Communication With Ollama", error);
    }
}

document.getElementById("promptForm").addEventListener("submit", getOllamaResponse)