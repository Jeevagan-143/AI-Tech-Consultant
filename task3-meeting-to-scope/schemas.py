
from pydantic import BaseModel, Field
from typing import Any


class ScopeRequest(BaseModel):
    transcript: str = Field(min_length=20)
    project_name: str = "Website Project"
    client_name: str = "Demo Client"


class ScopeChangeRequest(BaseModel):
    original_scope: dict[str, Any]
    revised_scope: dict[str, Any]
