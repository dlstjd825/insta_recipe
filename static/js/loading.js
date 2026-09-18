const url = document.body.dataset.url;

let controller = new AbortController();
let timeoutId;

const jobId = crypto.randomUUID();

async function extractRecipe() {

    try {
        const response = await fetch("/extract", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                url: url,
                job_id: jobId
            }),
            signal: controller.signal
        });

        const data = await response.json();
        clearTimeout(timeoutId);

        if (data.cancelled) {
            return;
        }

        if (!response.ok) {
            throw new Error(data.error);
        }

        sessionStorage.setItem(
            "recipe",
            JSON.stringify(data.recipe)
        );

        window.location.href = "/recipe";
    } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === "AbortError") {
            return;
        }

        alert(error.message);
        window.location.href = "/";
    }
}

extractRecipe();
