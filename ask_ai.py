import os
from dotenv import load_dotenv

from google import genai
from google.genai import types

from format import Recipe

ASK_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite"
]

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def ask_ai(recipe: Recipe, question: str):

    prompt = f"""
너는 요리 레시피를 도와주는 AI다.

사용자가 현재 보고 있는 레시피는 다음과 같다.

[레시피]
요리 이름: {recipe.name}
인분: {recipe.servings}

[재료]
{chr(10).join(
    f"- {ingredient.name}: {ingredient.amount}"
    for ingredient in recipe.ingredients
)}

[조리 과정]
{chr(10).join(
    f"{i + 1}. {step.simplified or step.original}"
    for i, step in enumerate(recipe.steps)
)}

[사용자의 질문]
{question}

위 레시피를 참고하여 사용자의 질문에 답변한다.

규칙:
- 질문에 바로 답한다.
- 답변은 1~2문장으로 짧게 작성한다.
- 가장 적절한 대체 재료나 방법 하나만 추천한다.
- 필요할 때만 사용량이나 주의사항을 덧붙인다.
- 불필요한 설명, 목록, 번호 매기기를 하지 않는다.
- 마크다운을 사용하지 않는다.
- "1.", "2.", "-", "**" 등의 목록이나 강조 표시를 사용하지 않는다.
- "치킨스톡 대신 연두 1스푼을 사용하는 것을 추천해요."처럼 자연스러운 문장으로 답한다.
"""

    for model in ASK_MODELS:
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt
            )

            return response.text

        except Exception as e:
            if "503" in str(e):
                continue

            raise

    raise Exception("사용 가능한 AI 모델이 없습니다.")