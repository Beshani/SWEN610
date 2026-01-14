from typing import Optional, Annotated, List
from pydantic import BaseModel, StringConstraints


ValueStr = Annotated[str, StringConstraints(min_length=1, max_length=50)]
ColorStr = Annotated[str, StringConstraints(min_length=4, max_length=10)]


class CategoryBase(BaseModel):
    value: ValueStr
    color: ColorStr = "#94a3b8"


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    value: Optional[ValueStr] = None
    color: Optional[ColorStr] = None


class Category(CategoryBase):
    id: int

class BulkCategoryIdsPayload(BaseModel):
    category_ids: List[int]
