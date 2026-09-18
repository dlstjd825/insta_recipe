from pydantic import BaseModel


class Ingredient(BaseModel):
    name: str
    original_amount: str
    amount: str
    estimated: bool


class Step(BaseModel):
    original: str
    simplified: str


class Substitution(BaseModel):
    original: str
    original_amount: str
    alternative: str
    alternative_amount: str
    estimated: bool


class Recipe(BaseModel):
    name: str
    servings: str | None = None
    tags: list[str] = []
    ingredients: list[Ingredient]
    steps: list[Step]
    substitutions: list[Substitution] = []