const OLLAMA_CHAT_URL = "http://localhost:11434/api/chat";
const OLLAMA_TAGS = "http://localhost:11434/api/tags";
const HISTORY_KEY = "ollama-simple-client-conversation";

const modelSelected = document.getElementById("model");
const promptForm = document.getElementById("promptForm");
const promptInput = document.getElementById("prompt");
const errorElem = document.getElementById("error");
const conversation = document.getElementById("conversation");
const clearHistoryButton = document.getElementById("clearHistory");

let messages = loadHistory();

function loadHistory() {
    try {
        const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
        return Array.isArray(saved) ? saved.filter((message) =>
            message && ["user", "assistant"].includes(message.role) && typeof message.content === "string"
        ) : [];
    } catch (err) {
        console.warn("Could not load conversation history", err);
        return [];
    }
}

function saveHistory() {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(messages));
    } catch (err) {
        errorElem.textContent = "Conversation could not be saved in this browser.";
        console.warn("Could not save conversation history", err);
    }
}

function renderHistory() {
    conversation.replaceChildren();
    if (messages.length === 0) {
        const empty = document.createElement("p");
        empty.id = "emptyHistory";
        empty.textContent = "Your conversation will appear here.";
        conversation.append(empty);
        return;
    }

    messages.forEach((message) => {
        const article = document.createElement("article");
        article.className = `message ${message.role}`;
        const label = document.createElement("strong");
        label.textContent = message.role === "user" ? "You" : "Assistant";
        const content = document.createElement("p");
        content.textContent = message.content;
        article.append(label, content);
        conversation.append(article);
    });
    conversation.scrollTop = conversation.scrollHeight;
}

async function loadOllamaModels() {
    try {
        const response = await fetch(OLLAMA_TAGS);
        if (!response.ok) throw new Error("Failed to fetch model list.");
        const data = await response.json();
        if (data.models?.length) {
            modelSelected.replaceChildren(...data.models.map((model) => {
                const option = document.createElement("option");
                option.value = model.name;
                option.textContent = model.name;
                return option;
            }));
        } else {
            modelSelected.innerHTML = "<option disabled>No Model Found</option>";
        }
    } catch (err) {
        console.error("Error loading models", err);
        errorElem.textContent = err.message;
        modelSelected.innerHTML = "<option disabled>Could not load models</option>";
    }
}

async function getOllamaResponse(event) {
    event.preventDefault();
    const userPrompt = promptInput.value.trim();
    if (!userPrompt || !modelSelected.value) return;

    errorElem.textContent = "";
    messages.push({ role: "user", content: userPrompt });
    renderHistory();
    saveHistory();
    promptInput.value = "";
    promptInput.disabled = true;
    clearHistoryButton.disabled = true;

    try {
        const response = await fetch(OLLAMA_CHAT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: modelSelected.value,
                messages,
                stream: false
            })
        });
        if (!response.ok) throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
        const data = await response.json();
        if (!data.message?.content) throw new Error("Ollama returned an empty response.");
        messages.push({ role: "assistant", content: data.message.content });
        saveHistory();
    } catch (err) {
        console.error("Error communicating with Ollama", err);
        // Remove the failed turn so it is not sent again on the next request.
        messages.pop();
        errorElem.textContent = `${err.message} Your prompt was removed from history; please try again.`;
        saveHistory();
    } finally {
        promptInput.disabled = false;
        clearHistoryButton.disabled = false;
        promptInput.focus();
        renderHistory();
    }
}

clearHistoryButton.addEventListener("click", () => {
    messages = [];
    saveHistory();
    errorElem.textContent = "";
    renderHistory();
});

promptForm.addEventListener("submit", getOllamaResponse);
renderHistory();
loadOllamaModels();
