const recipeText = sessionStorage.getItem("recipe");
let recipe = null;

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
            recipe.servings ? `${recipe.servings}인분` : "";
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

async function askQuestion() {

    const question =
        questionInput.value.trim();

    if (!question) {
        return;
    }


    // =========================
    // 사용자 메시지 추가
    // =========================

    const userMessage =
        document.createElement("div");

    userMessage.className =
        "chat-message user";

    userMessage.textContent =
        question;

    chatMessages.appendChild(userMessage);


    // 입력창 비우기
    questionInput.value = "";


    // =========================
    // AI 답변 자리 생성
    // =========================

    const aiMessage =
        document.createElement("div");

    aiMessage.className =
        "chat-message ai";

    aiMessage.textContent =
        "답변을 생각하고 있어요...";

    chatMessages.appendChild(aiMessage);


    // 버튼 비활성화
    askButton.disabled = true;


    // 가장 최근 메시지가 보이도록 이동
    aiMessage.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });


    try {

        const response =
            await fetch("/api/chat", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    recipe: recipe,
                    question: question
                })
            });


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "답변을 가져오지 못했습니다."
            );

        }


        // AI 답변 표시
        aiMessage.textContent =
            data.answer;


    } catch (error) {

        console.error(error);

        aiMessage.textContent =
            error.message;


    } finally {

        // 버튼 다시 활성화
        askButton.disabled = false;

        // 입력창에 다시 포커스
        questionInput.focus();

    }
}