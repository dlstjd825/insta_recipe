const recipeText = sessionStorage.getItem("recipe");
let recipe = null;

const saveButton = document.querySelector(".save-button");
saveButton.addEventListener("click", saveRecipe);

const shortcode = sessionStorage.getItem("shortcode");

checkSavedRecipe();

async function checkSavedRecipe() {
    if (!shortcode) {
        return;
    }

    try {
        const response = await fetch("/api/recipes/check", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                shortcode: shortcode
            })
        });

        const data = await response.json();

        if (data.saved) {
            saveButton.textContent = "♥ 저장됨";
            saveButton.disabled = true;
        }

    } catch (error) {
        console.error(error);
    }
}


if (!recipeText) {
    window.location.href = "/";
} else {
    recipe = JSON.parse(recipeText);

    const tagList = document.getElementById("recipe-tags");

    if (tagList && recipe.tags) {
        recipe.tags.forEach(tag => {
            const span = document.createElement("span");

            span.textContent = `#${tag}`;

            tagList.appendChild(span);
        });
    }

    document.getElementById("recipe-name").textContent =
        recipe.name || "레시피";

    const servingElement =
        document.getElementById("recipe-servings");

    if (servingElement) {
        servingElement.textContent =
            recipe.servings ? `${recipe.servings}` : "";
    }

    const ingredientList =
        document.getElementById("ingredient-list");

    (recipe.ingredients || []).forEach(ingredient => {
        const row = document.createElement("div");
        row.className = "ingredient";

        const name = document.createElement("span");
        name.textContent = ingredient.name;

        const amount = document.createElement("span");
        amount.textContent = ingredient.amount;

        row.appendChild(name);
        row.appendChild(amount);

        ingredientList.appendChild(row);
    });

    const stepList =
        document.getElementById("step-list");

    (recipe.steps || []).forEach(step => {
        const li = document.createElement("li");

        li.textContent =
            step.simplified || step.original || "";

        stepList.appendChild(li);
    });

    const substitutionList =
        document.getElementById("substitution-list");

    const substitutions =
        recipe.substitutions || [];

    if (substitutionList && substitutions.length > 0) {
        substitutionList.innerHTML = "";

        substitutions.forEach(item => {
            const row = document.createElement("div");
            row.className = "substitution";

            const original = document.createElement("span");
            original.textContent =
                `${item.original} ${item.original_amount || ""}`.trim();

            const arrow = document.createElement("span");
            arrow.textContent = "→";

            const alternative = document.createElement("span");

            if (item.alternative.includes("+")) {
                alternative.textContent =
                    `${item.alternative} (${item.alternative_amount})`;
            } else {
                alternative.textContent =
                    `${item.alternative} ${item.alternative_amount}`.trim();
            }

            row.appendChild(original);
            row.appendChild(arrow);
            row.appendChild(alternative);

            substitutionList.appendChild(row);
        });
    }
}


// =========================
// AI Chat
// =========================

const chatMessages =
    document.getElementById("chat-messages");

const askButton =
    document.getElementById("ask-button");

const questionInput =
    document.getElementById("question");


// 질문 버튼
askButton.addEventListener("click", askQuestion);


// 엔터키로 질문
questionInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        askQuestion();
    }

});


// =========================
// AI에게 질문
// =========================
let isAnswering = false;

function typeAnswer(element, text, speed = 25) {
    return new Promise((resolve) => {
        element.textContent = "";
        let index = 0;
        const timer = setInterval(() => {
            element.textContent += text[index];
            index++;
            if (index >= text.length) {
                clearInterval(timer);
                resolve();
            }
        }, speed);
    });
}

async function askQuestion() {
    if (isAnswering) {
        return;
    }
    const question = questionInput.value.trim();
    if (!question) {
        return;
    }
    isAnswering = true;
    askButton.disabled = true;
    const userMessage = document.createElement("div");
    userMessage.className = "chat-message user";
    userMessage.textContent = question;
    chatMessages.appendChild(userMessage);
    questionInput.value = "";
    const aiMessage = document.createElement("div");
    aiMessage.className = "chat-message ai";
    aiMessage.textContent = "답변을 생각하고 있어요...";
    chatMessages.appendChild(aiMessage);
    aiMessage.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                recipe: recipe,
                question: question
                
            })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "답변을 가져오지 못했습니다.");
        }
        await typeAnswer(aiMessage, data.answer, 25);
    } catch (error) {
        console.error(error);
        aiMessage.textContent = error.message;
    } finally {
        isAnswering = false;
        askButton.disabled = false;
        questionInput.focus();
    }
}


// =========================
// 레시피 저장
// =========================
async function saveRecipe() {
    if (!recipe) {
        return;
    }

    if (saveButton.disabled) {
        return;
    }

    saveButton.disabled = true;

    try {
        const response = await fetch("/api/recipes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                recipe: recipe,
                shortcode: shortcode
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "레시피를 저장하지 못했습니다."
            );
        }

        saveButton.textContent = "♥ 저장됨";

    } catch (error) {
        console.error(error);
        alert(error.message);
        saveButton.disabled = false;
    }
}