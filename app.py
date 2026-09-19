from flask import Flask, render_template, request, jsonify
from extract import get_caption
from recipe_ai import extract_recipe
from ask_ai import ask_ai
from format import Recipe
import sqlite3
import json

app = Flask(__name__)

def get_db():
    conn = sqlite3.connect("recipes.db")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS saved_recipes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            recipe_json TEXT NOT NULL,
            shortcode TEXT NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

init_db()

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
        shortcode = url.rstrip("/").split("/")[-1]
        caption = get_caption(url)
        recipe = extract_recipe(caption)

        return jsonify({
            "recipe": recipe.model_dump(),
            "shortcode": shortcode
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


@app.route("/api/recipes", methods=["POST"])
def save_recipe():
    data = request.get_json()
    recipe_data = data.get("recipe")
    shortcode = data.get("shortcode", "").strip()

    if not recipe_data:
        return jsonify({"error": "저장할 레시피가 없습니다."}), 400

    if not shortcode:
        return jsonify({"error": "shortcode가 없습니다."}), 400

    try:
        recipe = Recipe.model_validate(recipe_data)

        recipe_json = json.dumps(
            recipe.model_dump(),
            ensure_ascii=False,
            sort_keys=True
        )

        conn = get_db()

        existing = conn.execute(
            "SELECT id FROM saved_recipes WHERE shortcode = ?",
            (shortcode,)
        ).fetchone()

        if existing:
            conn.close()

            return jsonify({
                "message": "이미 저장된 레시피입니다.",
                "id": existing["id"],
                "already_saved": True
            })

        cursor = conn.execute(
            """
            INSERT INTO saved_recipes (name, recipe_json, shortcode)
            VALUES (?, ?, ?)
            """,
            (recipe.name, recipe_json, shortcode)
        )

        conn.commit()
        recipe_id = cursor.lastrowid
        conn.close()

        return jsonify({
            "message": "레시피가 저장되었습니다.",
            "id": recipe_id,
            "already_saved": False
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


@app.route("/api/recipes/check", methods=["POST"])
def check_saved_recipe():
    data = request.get_json()
    shortcode = data.get("shortcode", "").strip()

    if not shortcode:
        return jsonify({
            "saved": False
        })

    try:
        conn = get_db()

        existing = conn.execute(
            "SELECT id FROM saved_recipes WHERE shortcode = ?",
            (shortcode,)
        ).fetchone()

        conn.close()

        return jsonify({
            "saved": existing is not None
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


@app.route("/saved")
def saved():
    return render_template("saved.html")


@app.route("/api/recipes", methods=["GET"])
def get_saved_recipes():
    try:
        conn = get_db()

        rows = conn.execute(
            """
            SELECT id, name, recipe_json, shortcode, created_at
            FROM saved_recipes
            ORDER BY created_at DESC
            """
        ).fetchall()

        conn.close()

        recipes = []

        for row in rows:
            recipes.append({
                "id": row["id"],
                "name": row["name"],
                "recipe": json.loads(row["recipe_json"]),
                "shortcode": row["shortcode"],
                "created_at": row["created_at"]
            })

        return jsonify({
            "recipes": recipes
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


@app.route("/api/recipes/<int:recipe_id>", methods=["DELETE"])
def delete_recipe(recipe_id):
    try:
        conn = get_db()

        cursor = conn.execute(
            "DELETE FROM saved_recipes WHERE id = ?",
            (recipe_id,)
        )

        conn.commit()
        conn.close()

        if cursor.rowcount == 0:
            return jsonify({
                "error": "레시피를 찾을 수 없습니다."
            }), 404

        return jsonify({
            "message": "레시피가 삭제되었습니다."
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

    
if __name__ == "__main__":
    app.run(debug=True)
