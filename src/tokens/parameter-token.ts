import { State, Token } from './token';

export class ParameterToken extends Token {
  parameter: any;

  constructor(parameter: any) {
    super();

    if (parameter === undefined) {
      console.warn('parameter is undefined. This will likely have unintended consequences.', new Error().stack);
    }

    this.parameter = parameter;
  }

  reduce(state: State, numberOfParameters: number) {
    state.text.push(`$${numberOfParameters + 1}`);
    state.parameters.push(this.parameter);
    return state;
  }
}
