import { SelectQueryBuilder } from 'typeorm';

interface QueryString {
  page?: string | number;
  sort?: string | string[];
  limit?: string | number;
  fields?: string;
  [key: string]: unknown;
}

export class APIFeature<T> {
  constructor(
    public query: SelectQueryBuilder<T>,
    private queryString: QueryString,
    private alias: string, // TypeORM requires a table alias (e.g., 'tour')
  ) {}

  filter(): this {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    const params: Record<string, unknown> = {};
    const conditions: string[] = [];

    for (const [key, value] of Object.entries(queryObj)) {
      if (typeof value === 'object' && value !== null) {
        // Advanced filtering: { gte, gt, lte, lt }
        const operators = value as Record<string, unknown>;
        for (const [op, val] of Object.entries(operators)) {
          const paramKey = `${key}_${op}`;
          params[paramKey] = val;
          const operatorMap: Record<string, string> = {
            gte: '>=',
            gt: '>',
            lte: '<=',
            lt: '<',
          };
          if (operatorMap[op]) {
            conditions.push(`${this.alias}.${key} ${operatorMap[op]} :${paramKey}`);
          }
        }
      } else {
        const paramKey = key;
        params[paramKey] = value;
        conditions.push(`${this.alias}.${key} = :${paramKey}`);
      }
    }

    if (conditions.length > 0) {
      this.query = this.query.andWhere(conditions.join(' AND '), params);
    }

    return this;
  }

  sort(): this {
    if (this.queryString.sort) {
      const sortStr = Array.isArray(this.queryString.sort)
        ? this.queryString.sort.join(',')
        : String(this.queryString.sort);

      const sortFields = sortStr.split(',');
      sortFields.forEach((field, index) => {
        const isDesc = field.startsWith('-');
        const fieldName = isDesc ? field.substring(1) : field;
        const direction: 'ASC' | 'DESC' = isDesc ? 'DESC' : 'ASC';

        if (index === 0) {
          this.query = this.query.orderBy(`${this.alias}.${fieldName}`, direction);
        } else {
          this.query = this.query.addOrderBy(`${this.alias}.${fieldName}`, direction);
        }
      });
    } else {
      this.query = this.query.orderBy(`${this.alias}.createdAt`, 'DESC');
    }

    return this;
  }

  limitFields(): this {
    if (this.queryString.fields) {
      const fields = this.queryString.fields
        .split(',')
        .map((field) => `${this.alias}.${field.trim()}`);
      this.query = this.query.select(fields);
    }
    // TypeORM selects all fields by default — no need to exclude __v (that's MongoDB)

    return this;
  }

  pagination(): this {
    const page = Number(this.queryString.page) || 1;
    const limit = Number(this.queryString.limit) || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).take(limit);

    return this;
  }
}