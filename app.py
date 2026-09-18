from flask import Flask, render_template, request, jsonify
from extract import get_caption
from recipe_ai import extract_recipe
from ask_ai import ask_ai
from format import Recipe

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/loading")
def loading():
    url = request.args.get("url", "").strip()

    if not url:
        return render_template("index.html")

    return render_template("loading.html", url=url)


@app.route("/extract", methods=["POST"])
def extract():

    data = request.get_json()
    url = data["url"].strip()

    try:
        caption = get_caption(url)
    
        recipe = extract_recipe(caption)

        return jsonify({
            "recipe": recipe.model_dump(),
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


@app.route("/recipe")
def recipe():
    return render_template("recipe.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()

    recipe_data = data.get("recipe")
    question = data.get("question", "").strip()

    if not recipe_data:
        return jsonify({"error": "레시피 정보가 없습니다."}), 400

    if not question:
        return jsonify({"error": "질문을 입력해주세요."}), 400

    try:
        recipe = Recipe.model_validate(recipe_data)

        answer = ask_ai(recipe, question)

        return jsonify({
            "answer": answer
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run(debug=True)
