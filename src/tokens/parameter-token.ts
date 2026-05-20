import { State, Token } from './token';
import { StringToken } from './string-token';

export class ParameterToken extends Token {
  parameter: any;

  constructor(parameter: any) {
    super();

    if (parameter === undefined) {
      console.warn(
        'parameter is undefined. This will likely have unintended consequences.',
        new Error().stack,
      );
    }

    this.parameter = parameter;
  }

  reduce(state: State, numberOfParameters: number) {
    state.text.push(`$${numberOfParameters + 1}`);
    state.parameters.push(this.parameter);
    return state;
  }
}

// Returns a `StringToken` for values that are both SQL-injection safe and beneficial to inline
// as a literal in the generated SQL, otherwise a `ParameterToken`.
//
// We currently only auto-inline booleans. That lets `column.eq(true)` emit `column = TRUE`
// rather than `column = $1`, which lets the Postgres planner fold the predicate (and e.g.
// choose a partial index) — something it cannot do for a bind parameter because it does not
// know what value will be supplied. Booleans are an unambiguous win because there are only two
// possible values, so there is no plan-cache concern.
//
// Numbers and bigints are intentionally NOT auto-inlined: they are safe to render textually,
// but inlining them pollutes the plan cache (every distinct value gets its own plan) and
// defeats prepared-statement reuse. Use `literal()` if you want to opt those in explicitly.
//
// Only used for expression-building paths (comparisons, arithmetic, JOIN ON, CASE, COALESCE,
// etc). INSERT VALUES and UPDATE SET still go through `ParameterToken` directly so that the
// same statement can be reused as a prepared statement across rows.
export const expressionValueToken = (value: unknown): ParameterToken | StringToken => {
  if (typeof value === 'boolean') {
    return new StringToken(value ? 'TRUE' : 'FALSE');
  }

  return new ParameterToken(value);
};
