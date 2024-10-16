import { BooleanQuery, Query, SpecificQuery } from './query';
import {
  CollectionToken,
  GroupToken,
  ParameterToken,
  SeparatorToken,
  StringToken,
  Token,
} from './tokens';

import { wrapQuotes } from './naming';
import { isTokenable } from './sql-functions';
import assert from 'assert';
import {
  InlineValueTokenWithCast,
  InlineStringValueToken,
  InlineNumberValueToken,
  InlineBooleanValueToken,
  InlineJsonbValueToken,
} from './tokens/inline-value-token';

export class Expression<DataType, IsNotNull extends boolean, Name extends string> {
  private _expressionBrand!: ['expression', DataType, IsNotNull, Name];

  /** @internal */
  getName() {
    return this.name;
  }

  // To avoid Name becoming any, it seems we have to use it somewhere. Because we strip internal
  // calls to avoid poluting the public api, we just add a protected function which keeps Name
  // intact and doesn't pollute the api.
  protected unusedName() {
    return this.name;
  }

  constructor(
    private readonly tokens: Token[],
    private readonly name: Name,
    private readonly nameIsAlias = false,
    private readonly shouldInlineParameters = false,
  ) {}

  private getDataTypeTokens(value: DataType | Expression<DataType, boolean, any> | Query<any>) {
    if (isTokenable(value)) {
      if (value instanceof Query) {
        return [new GroupToken(value.toTokens())];
      }

      return value.toTokens();
    }

    return [this.makeTokenForValue(value)];
  }

  private toGroup(expression: Expression<any, any, any> | Query<any>) {
    const newTokens = expression.toTokens();

    // Anything above 3 means we need to start grouping this in ( and ).
    if (newTokens.length > 3) {
      return new GroupToken(newTokens);
    }

    return new CollectionToken(newTokens);
  }

  private makeTokenForValue(parameter: DataType | InlineValue<DataType>): Token {
    const value = parameter instanceof InlineValue ? parameter.getValue() : parameter;
    if (this.shouldInlineParameters) {
      const castType = parameter instanceof InlineValue ? parameter.getCastType() : undefined;
      return valueToInlineValueToken(value, castType);
    }
    return new ParameterToken(value);
  }

  // TODO: only include
  // or: DataType extends boolean
  //   ? (expression: Expression<boolean, boolean, string>) => void
  //   : Explain<
  //       'Expression#or() is only available on boolean expressions. Is this a boolean expression?'
  //     > = (() => {
  //   //
  // }) as any;
  or<Q extends Query<any>>(
    expression: Expression<boolean, any, any> | BooleanQuery<Q>,
  ): DefaultExpression<boolean> {
    return new DefaultExpression([...this.tokens, new StringToken(`OR`), this.toGroup(expression)]);
  }

  and<Q extends Query<any>>(
    expression: Expression<boolean, any, any> | BooleanQuery<Q>,
  ): DefaultExpression<boolean> {
    return new DefaultExpression([
      ...this.tokens,
      new StringToken(`AND`),
      this.toGroup(expression),
    ]);
  }

  andNotExists(expression: Expression<any, any, any> | Query<any>): DefaultExpression<boolean> {
    return new DefaultExpression([
      ...this.tokens,
      new StringToken(`AND NOT EXISTS`),
      this.toGroup(expression),
    ]);
  }

  andExists(expression: Expression<any, any, any> | Query<any>): DefaultExpression<boolean> {
    return new DefaultExpression([
      ...this.tokens,
      new StringToken(`AND EXISTS`),
      this.toGroup(expression),
    ]);
  }

  as<AliasName extends string>(name: AliasName): Expression<DataType, IsNotNull, AliasName> {
    if (this.tokens.length > 2) {
      return new Expression([new GroupToken(this.tokens)], name, true);
    }

    return new Expression([...this.tokens], name, true);
  }

  isNull(): DefaultExpression<boolean> {
    return new DefaultExpression([...this.tokens, new StringToken(`IS NULL`)]);
  }

  isNotNull(): DefaultExpression<boolean> {
    return new DefaultExpression([...this.tokens, new StringToken(`IS NOT NULL`)]);
  }

  asc(): DefaultExpression<DataType, IsNotNull> {
    return new DefaultExpression([...this.tokens, new StringToken(`ASC`)]);
  }

  desc(): DefaultExpression<DataType, IsNotNull> {
    return new DefaultExpression([...this.tokens, new StringToken(`DESC`)]);
  }

  nullsFirst(): DefaultExpression<DataType, IsNotNull> {
    return new DefaultExpression([...this.tokens, new StringToken(`NULLS FIRST`)]);
  }

  nullsLast(): DefaultExpression<DataType, IsNotNull> {
    return new DefaultExpression([...this.tokens, new StringToken(`NULLS LAST`)]);
  }

  in<Q extends Query<any>>(
    array:
      | (DataType | InlineValue<DataType>)[]
      | Expression<DataType, IsNotNull, any>
      | SpecificQuery<DataType, Q>,
  ): DefaultExpression<boolean> {
    if (array && ('toTokens' in array || array instanceof Query)) {
      return new DefaultExpression([
        ...this.tokens,
        new StringToken(`IN`),
        new GroupToken(array.toTokens()),
      ]);
    } else {
      assert(array.length > 0, 'Array must have at least one element');
      return new DefaultExpression([
        ...this.tokens,
        new StringToken(`IN`),
        new GroupToken([
          new SeparatorToken(
            ',',
            array.map((item) => this.makeTokenForValue(item)),
          ),
        ]),
      ]);
    }
  }

  notIn(
    array: (DataType | InlineValue<DataType>)[] | Expression<DataType, IsNotNull, any> | Query<any>,
  ): DefaultExpression<boolean> {
    if (array && ('toTokens' in array || array instanceof Query)) {
      return new DefaultExpression([
        ...this.tokens,
        new StringToken(`NOT IN`),
        new GroupToken(array.toTokens()),
      ]);
    } else {
      assert(array.length > 0, 'Array must have at least one element');
      return new DefaultExpression([
        ...this.tokens,
        new StringToken(`NOT IN`),
        new GroupToken([
          new SeparatorToken(
            ',',
            array.map((item) => this.makeTokenForValue(item)),
          ),
        ]),
      ]);
    }
  }

  plus(
    value: DataType | InlineValue<DataType> | Expression<DataType, IsNotNull, any>,
  ): DefaultExpression<DataType, IsNotNull> {
    return new DefaultExpression([
      ...this.tokens,
      new StringToken(`+`),
      ...this.getDataTypeTokens(value),
    ]);
  }

  minus(
    value: DataType | InlineValue<DataType> | Expression<DataType, IsNotNull, any>,
  ): DefaultExpression<DataType, IsNotNull> {
    return new DefaultExpression([
      ...this.tokens,
      new StringToken(`-`),
      ...this.getDataTypeTokens(value),
    ]);
  }

  multiply(
    value: DataType | InlineValue<DataType> | Expression<DataType, IsNotNull, any>,
  ): DefaultExpression<DataType, IsNotNull> {
    return new DefaultExpression([
      ...this.tokens,
      new StringToken(`*`),
      ...this.getDataTypeTokens(value),
    ]);
  }

  divide(
    value: DataType | InlineValue<DataType> | Expression<DataType, IsNotNull, any>,
  ): DefaultExpression<DataType, IsNotNull> {
    return new DefaultExpression([
      ...this.tokens,
      new StringToken(`/`),
      ...this.getDataTypeTokens(value),
    ]);
  }

  modulo(
    value: DataType | InlineValue<DataType> | Expression<DataType, IsNotNull, any>,
  ): DefaultExpression<DataType, IsNotNull> {
    return new DefaultExpression([
      ...this.tokens,
      new StringToken(`%`),
      ...this.getDataTypeTokens(value),
    ]);
  }

  concat(
    value: DataType | InlineValue<DataType> | Expression<DataType, IsNotNull, any>,
  ): DefaultExpression<DataType, IsNotNull> {
    return new DefaultExpression([
      ...this.tokens,
      new StringToken(`||`),
      ...this.getDataTypeTokens(value),
    ]);
  }

  between(
    a: DataType | InlineValue<DataType>,
    b: DataType | InlineValue<DataType>,
  ): DefaultExpression<boolean> {
    return new DefaultExpression([
      ...this.tokens,
      new StringToken(`BETWEEN`),
      this.makeTokenForValue(a),
      new StringToken(`AND`),
      this.makeTokenForValue(b),
    ]);
  }

  betweenSymmetric(
    a: DataType | InlineValue<DataType>,
    b: DataType | InlineValue<DataType>,
  ): DefaultExpression<boolean> {
    return new DefaultExpression([
      ...this.tokens,
      new StringToken(`BETWEEN SYMMETRIC`),
      this.makeTokenForValue(a),
      new StringToken(`AND`),
      this.makeTokenForValue(b),
    ]);
  }

  isDistinctFrom(a: DataType | InlineValue<DataType>): DefaultExpression<boolean> {
    return new DefaultExpression([
      ...this.tokens,
      new StringToken(`IS DISTINCT FROM`),
      this.makeTokenForValue(a),
    ]);
  }

  isNotDistinctFrom(a: DataType | InlineValue<DataType>): DefaultExpression<boolean> {
    return new DefaultExpression([
      ...this.tokens,
      new StringToken(`IS NOT DISTINCT FROM`),
      this.makeTokenForValue(a),
    ]);
  }

  like(value: DataType | InlineValue<DataType>): DefaultExpression<boolean> {
    return new DefaultExpression([
      ...this.tokens,
      new StringToken(`LIKE`),
      this.makeTokenForValue(value),
    ]);
  }

  ilike(value: DataType | InlineValue<DataType>): DefaultExpression<boolean> {
    return new DefaultExpression([
      ...this.tokens,
      new StringToken(`ILIKE`),
      this.makeTokenForValue(value),
    ]);
  }

  eq<Q extends Query<any>>(
    value:
      | DataType
      | InlineValue<DataType>
      | Expression<DataType, boolean, any>
      | SpecificQuery<DataType, Q>,
  ): DefaultExpression<boolean> {
    return new DefaultExpression([
      ...this.tokens,
      new StringToken(`=`),
      ...this.getDataTypeTokens(value),
    ]);
  }

  ne<Q extends Query<any>>(
    value:
      | DataType
      | InlineValue<DataType>
      | Expression<DataType, boolean, any>
      | SpecificQuery<DataType, Q>,
  ): DefaultExpression<boolean> {
    return new DefaultExpression([
      ...this.tokens,
      new StringToken(`<>`),
      ...this.getDataTypeTokens(value),
    ]);
  }

  gt<Q extends Query<any>>(
    value:
      | DataType
      | InlineValue<DataType>
      | Expression<DataType, boolean, any>
      | SpecificQuery<DataType, Q>,
  ): DefaultExpression<boolean> {
    return new DefaultExpression([
      ...this.tokens,
      new StringToken(`>`),
      ...this.getDataTypeTokens(value),
    ]);
  }

  gte<Q extends Query<any>>(
    value:
      | DataType
      | InlineValue<DataType>
      | Expression<DataType, boolean, any>
      | SpecificQuery<DataType, Q>,
  ): DefaultExpression<boolean> {
    return new DefaultExpression([
      ...this.tokens,
      new StringToken(`>=`),
      ...this.getDataTypeTokens(value),
    ]);
  }

  lt<Q extends Query<any>>(
    value:
      | DataType
      | InlineValue<DataType>
      | Expression<DataType, boolean, any>
      | SpecificQuery<DataType, Q>,
  ): DefaultExpression<boolean> {
    return new DefaultExpression([
      ...this.tokens,
      new StringToken(`<`),
      ...this.getDataTypeTokens(value),
    ]);
  }

  lte<Q extends Query<any>>(
    value:
      | DataType
      | InlineValue<DataType>
      | Expression<DataType, boolean, any>
      | SpecificQuery<DataType, Q>,
  ): DefaultExpression<boolean> {
    return new DefaultExpression([
      ...this.tokens,
      new StringToken(`<=`),
      ...this.getDataTypeTokens(value),
    ]);
  }

  orderBy(...expressions: Expression<any, any, any>[]): DefaultExpression<DataType, IsNotNull> {
    return new DefaultExpression<DataType, IsNotNull>([
      ...this.tokens,
      new StringToken(`ORDER BY`),
      new SeparatorToken(
        ',',
        expressions.map((expression) => new CollectionToken(expression.toTokens())),
      ),
    ]);
  }

  /** @internal */
  toTokens(includeAlias?: boolean) {
    if (includeAlias && (this.nameIsAlias || this.name.match(/[A-Z]/))) {
      // Some expression return a train_case name by default such as string_agg. We automatically
      // convert these to camelCase equivalents e.g. stringAgg.
      return [...this.tokens, new StringToken(`${wrapQuotes(this.name)}`)];
    }

    return this.tokens;
  }
}

export class DefaultExpression<DataType, IsNotNull extends boolean = true> extends Expression<
  DataType,
  IsNotNull,
  '?column?'
> {
  constructor(tokens: Token[]) {
    super(tokens, '?column?');
  }
}

function valueToInlineValueToken<T>(value: T, castType?: string): Token {
  if (castType !== undefined) {
    return new InlineValueTokenWithCast(value, castType);
  } else if (Array.isArray(value)) {
    return new GroupToken(
      [
        new SeparatorToken(
          ',',
          value.map((item) => valueToInlineValueToken(item)),
        ),
      ],
      '{',
      '}',
    );
  }
  if (typeof value === `string`) {
    return new InlineStringValueToken(value);
  } else if (typeof value === `number`) {
    return new InlineNumberValueToken(value);
  } else if (typeof value === `boolean`) {
    return new InlineBooleanValueToken(value);
  } else if (typeof value === `object` && value !== null) {
    return new InlineJsonbValueToken(value);
  }
  throw new Error(`Unsupported value type`);
}

export class InlineValue<T> extends Expression<T, false, 'value'> {
  constructor(
    private value: T,
    private castType?: string,
  ) {
    const tokens: Token[] = [];
    tokens.push(valueToInlineValueToken(value, castType));

    super(tokens, 'value');
  }

  getValue() {
    return this.value;
  }

  getCastType() {
    return this.castType;
  }
}

export function inlineValue<T>(value: T, castType?: string): InlineValue<T> {
  return new InlineValue(value, castType);
}
