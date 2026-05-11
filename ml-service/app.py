from typing import Any, Dict, List, Optional

from fastapi import FastAPI
from pydantic import BaseModel

from model import SkillSyncModel


app = FastAPI()
model = SkillSyncModel("dummy.csv")


class SearchRequest(BaseModel):
    query: str = ""
    users: List[Dict[str, Any]]
    criteria: Optional[Dict[str, Any]] = None


@app.post("/search")
def search_users(req: SearchRequest):
    results = model.search(req.query, req.users, req.criteria)
    return {"results": results}
