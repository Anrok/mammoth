import { BooleanQuery, Query } from './query';
import { ParameterToken, StringToken, Token } from './tokens';

import { Expression } from './expression';
import { isTokenable } from './sql-functions';

type ResultDataType<T> = T extends Expression<infer D, any, any> ? D : T;
type ResultIsNotNull<T> = T extends Expression<any, infer N extends boolean, any> ? N : true;
type And<A extends boolean, B extends boolean> = A extends true ? B : false;

function valueToTokens(value: unknown): Token[] {
  if (isTokenable(value)) {
    return value.toTokens();
  }
  return [new ParameterToken(value)];
}

export class CaseStatement<DataType, IsNotNull extends boolean = true> {
  static make(): CaseStatement<never, true> {
    return new CaseStatement<never, true>([]);
  }

  private constructor(private readonly tokens: Token[]) {}

  when<Q extends Query<any>>(expression: Expression<boolean, boolean, string> | BooleanQuery<Q>) {
    const self = this;
    return {
      then<T>(result: T) {
        return new CaseStatement<DataType | ResultDataType<T>, And<IsNotNull, ResultIsNotNull<T>>>([
          ...self.tokens,
          new StringToken(`WHEN`),
          ...expression.toTokens(),
          new StringToken(`THEN`),
          ...valueToTokens(result),
        ]);
      },
    };
  }

  else<T>(result: T) {
    return new CaseStatement<DataType | ResultDataType<T>, And<IsNotNull, ResultIsNotNull<T>>>([
      ...this.tokens,
      new StringToken(`ELSE`),
      ...valueToTokens(result),
    ]);
  }

  end(): Expression<DataType, IsNotNull, 'case'> {
    return new Expression(
      [new StringToken(`CASE`), ...this.tokens, new StringToken(`END`)],
      `case`,
    );
  }
}
