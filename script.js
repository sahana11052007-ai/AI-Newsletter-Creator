
const topicInput = document.getElementById("topic");
const audienceInput = document.getElementById("audience");
const toneInput = document.getElementById("tone");
const lengthInput = document.getElementById("length");

const newsletter = document.getElementById("newsletter");
const generateBtn = document.getElementById("generateBtn");
const status = document.querySelector(".status");

// Generate newsletter using the backend AI API
async function generateNewsletter() {
    const topic = topicInput.value.trim();

    if (!topic) {
        alert("Please enter a newsletter topic!");
        topicInput.focus();
        return;
    }

    generateBtn.disabled = true;
    generateBtn.textContent = "Generating...";
    status.textContent = "● Working";

    newsletter.replaceChildren();

    const loading = document.createElement("p");
    loading.textContent = "✨ Creating your newsletter. Please wait...";
    newsletter.appendChild(loading);

    try {
        const response = await fetch("/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                topic: topic,
                audience: audienceInput.value,
                tone: toneInput.value,
                length: lengthInput.value
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Unable to generate newsletter.");
        }

        displayNewsletter(data.newsletter);
        status.textContent = "● Generated";
    } catch (error) {
        newsletter.replaceChildren();

        const message = document.createElement("p");
        message.textContent =
            error.message === "Failed to fetch"
                ? "Cannot connect to the server. Please start the application using npm start."
                : error.message;

        newsletter.appendChild(message);
        status.textContent = "● Error";
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = "✨ Generate Newsletter";
    }
}

// Display newsletter safely as formatted text
function displayNewsletter(content) {
    newsletter.replaceChildren();

    const title = document.createElement("h2");
    title.textContent = "Your AI Newsletter";
    newsletter.appendChild(title);

    const text = document.createElement("div");
    text.style.whiteSpace = "pre-wrap";
    text.style.overflowWrap = "anywhere";
    text.style.color = "#686379";
    text.style.fontSize = "14px";
    text.textContent = content;

    newsletter.appendChild(text);
}

// Copy newsletter content
async function copyNewsletter() {
    const content = getNewsletterText();

    if (!content) {
        alert("Generate a newsletter first!");
        return;
    }

    try {
        await navigator.clipboard.writeText(content);
        alert("Newsletter copied successfully!");
    } catch (error) {
        alert("Copy failed. Please select and copy the newsletter manually.");
    }
}

// Download newsletter as a text file
function downloadNewsletter() {
    const content = getNewsletterText();

    if (!content) {
        alert("Generate a newsletter first!");
        return;
    }

    const blob = new Blob([content], {
        type: "text/plain;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "my-newsletter.txt";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

// Get newsletter text without the empty-state message
function getNewsletterText() {
    const text = newsletter.innerText.trim();

    if (
        !text ||
        text.includes("Your next great newsletter starts here.")
    ) {
        return "";
    }

    return text;
}