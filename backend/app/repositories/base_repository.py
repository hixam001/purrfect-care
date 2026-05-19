"""
Purrfect Care — Base Repository

Generic data access layer that all domain repositories inherit from.
Provides standard CRUD operations against Supabase PostgreSQL.

Derived from doc 07 — BaseRepository class:
    +findById(id): T
    +findAll(page, limit): T[]
    +create(data): T
    +update(id, data): T
    +delete(id): boolean
    +count(filter): int
"""

from typing import Any

from supabase import Client

from app.utils.exceptions import NotFoundException


class BaseRepository:
    """
    Abstract base repository providing generic CRUD operations.

    All domain repositories (UserRepository, CatRepository, etc.)
    inherit from this class and add domain-specific query methods.

    Usage:
        class CatRepository(BaseRepository):
            def __init__(self, db: Client):
                super().__init__(db, "cats")

            def find_by_owner(self, owner_id: str) -> list[dict]:
                result = self.db.table(self.table_name)\\
                    .select("*, cat_breeds(*)")\\
                    .eq("owner_id", owner_id)\\
                    .execute()
                return result.data
    """

    def __init__(self, db: Client, table_name: str):
        self.db = db
        self.table_name = table_name

    def find_by_id(self, id: str, select: str = "*") -> dict:
        """
        Find a single record by its UUID primary key.
        Raises NotFoundException if not found.
        """
        result = (
            self.db.table(self.table_name)
            .select(select)
            .eq("id", id)
            .single()
            .execute()
        )
        if not result.data:
            raise NotFoundException(self.table_name, id)
        return result.data

    def find_all(
        self,
        page: int = 1,
        limit: int = 20,
        select: str = "*",
        order_by: str = "created_at",
        ascending: bool = False,
        filters: dict[str, Any] | None = None,
    ) -> list[dict]:
        """
        Find all records with pagination, ordering, and optional filters.
        """
        offset = (page - 1) * limit
        query = self.db.table(self.table_name).select(select)

        # Apply optional equality filters
        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)

        query = query.order(order_by, desc=not ascending)
        query = query.range(offset, offset + limit - 1)

        result = query.execute()
        return result.data or []

    def create(self, data: dict) -> dict:
        """
        Insert a new record and return the created row.
        """
        result = (
            self.db.table(self.table_name)
            .insert(data)
            .execute()
        )
        if not result.data:
            raise Exception(f"Failed to create record in {self.table_name}")
        return result.data[0]

    def update(self, id: str, data: dict) -> dict:
        """
        Update an existing record by ID and return the updated row.
        Raises NotFoundException if the record doesn't exist.
        """
        result = (
            self.db.table(self.table_name)
            .update(data)
            .eq("id", id)
            .execute()
        )
        if not result.data:
            raise NotFoundException(self.table_name, id)
        return result.data[0]

    def delete(self, id: str) -> bool:
        """
        Delete a record by ID. Returns True if deleted.
        """
        result = (
            self.db.table(self.table_name)
            .delete()
            .eq("id", id)
            .execute()
        )
        return bool(result.data)

    def count(self, filters: dict[str, Any] | None = None) -> int:
        """
        Count records matching optional filters.
        """
        query = self.db.table(self.table_name).select("id", count="exact")

        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)

        result = query.execute()
        return result.count or 0

    def find_one(self, filters: dict[str, Any], select: str = "*") -> dict | None:
        """
        Find a single record matching the given filters.
        Returns None if not found (does not raise).
        """
        query = self.db.table(self.table_name).select(select)

        for key, value in filters.items():
            query = query.eq(key, value)

        result = query.limit(1).execute()
        return result.data[0] if result.data else None

    def find_many(
        self,
        filters: dict[str, Any],
        select: str = "*",
        order_by: str = "created_at",
        ascending: bool = False,
        limit: int | None = None,
    ) -> list[dict]:
        """
        Find multiple records matching filters without pagination.
        """
        query = self.db.table(self.table_name).select(select)

        for key, value in filters.items():
            query = query.eq(key, value)

        query = query.order(order_by, desc=not ascending)

        if limit:
            query = query.limit(limit)

        result = query.execute()
        return result.data or []

    def upsert(self, data: dict) -> dict:
        """
        Insert or update a record (based on primary key or unique constraint).
        """
        result = (
            self.db.table(self.table_name)
            .upsert(data)
            .execute()
        )
        if not result.data:
            raise Exception(f"Failed to upsert record in {self.table_name}")
        return result.data[0]
