const savedList = document.getElementById("saved-list");

async function loadSavedRecipes() {
    try {
        const response = await fetch("/api/recipes");
        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "저장된 레시피를 불러오지 못했습니다."
            );
        }

        if (data.recipes.length === 0) {
            savedList.innerHTML =
                `<p class="empty-message">저장된 레시피가 없습니다.</p>`;
            return;
        }

        data.recipes.forEach(item => {
            const card = document.createElement("div");
            card.className = "saved-card";

            const content = document.createElement("div");
            content.className = "saved-card-content";

            const name = document.createElement("h2");
            name.textContent = item.name || "레시피";

            content.appendChild(name);

            const tags = document.createElement("div");
            tags.className = "saved-tags";

            (item.recipe.tags || []).forEach(tag => {
                const tagElement = document.createElement("span");
                tagElement.textContent = `#${tag}`;
                tags.appendChild(tagElement);
            });

            content.appendChild(tags);

            const deleteButton = document.createElement("button");
            deleteButton.className = "delete-button";
            deleteButton.textContent = "삭제";

            deleteButton.addEventListener("click", async (event) => {
                event.stopPropagation();

                if (!confirm("이 레시피를 삭제할까요?")) {
                    return;
                }

                try {
                    const response = await fetch(
                        `/api/recipes/${item.id}`,
                        {
                            method: "DELETE"
                        }
                    );

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(
                            data.error || "레시피를 삭제하지 못했습니다."
                        );
                    }

                    card.remove();

                    if (!savedList.querySelector(".saved-card")) {
                        savedList.innerHTML =
                            `<p class="empty-message">저장된 레시피가 없습니다.</p>`;
                    }

                } catch (error) {
                    console.error(error);
                    alert(error.message);
                }
            });

            card.appendChild(content);
            card.appendChild(deleteButton);

            card.addEventListener("click", () => {
                sessionStorage.setItem(
                    "recipe",
                    JSON.stringify(item.recipe)
                );

                sessionStorage.setItem(
                    "shortcode",
                    item.shortcode
                );

                window.location.href = "/recipe";
            });

            savedList.appendChild(card);
        });

    } catch (error) {
        console.error(error);
        savedList.innerHTML =
            `<p class="empty-message">${error.message}</p>`;
    }
}

loadSavedRecipes();