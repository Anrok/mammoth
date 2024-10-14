import { State, Token } from "./token";

abstract class InlineValueToken<T> extends Token {
    constructor(protected value: T) {
        super();
    }
}

export class InlineStringValueToken extends InlineValueToken<string> {
    reduce(state: State) {
        state.text.push(`'${this.value}'`);
        return state;
    }
}

export class InlineNumberValueToken extends InlineValueToken<number> {
    reduce(state: State) {
        state.text.push(`${this.value}`);
        return state;
    }
}

export class InlineBooleanValueToken extends InlineValueToken<boolean> {
    reduce(state: State) {
        state.text.push(`${this.value}`);
        return state;
    }
}

export class InlineJsonbValueToken extends InlineValueToken<Record<string, any>> {
    reduce(state: State) {
        state.text.push(`'${JSON.stringify(this.value)}'::jsonb`);
        return state;
    }
}

export class InlineValueTokenWithCast<T> extends InlineValueToken<T> {
    constructor(value: T, private castType: string) {
        super(value);
    }
    reduce(state: State) {
        state.text.push(`'${this.value}'::${this.castType}`);
        return state;
    }
}
