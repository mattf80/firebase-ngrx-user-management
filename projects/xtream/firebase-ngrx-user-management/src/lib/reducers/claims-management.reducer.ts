import { Action, createReducer, on } from "@ngrx/store";
import * as ClaimsActions from "../actions/claims-management.actions";
import { state } from "@angular/animations";

export interface State {
  loading: boolean;
  success: boolean;
  claims: {
    iss: string;
    aud: string;
    auth_time: number;
    user_id: string;
    sub: string;
    iat: number;
    exp: number;
    email: string;
    email_verified: boolean;
    firebase: {
      identities: {
        email: string[];
      };
      sign_in_provider: string;
    };
  };
  error: {
    code: string;
    message: string;
  };
}

const initialState: State = {
  loading: false,
  success: false,
  claims: {
    iss: "",
    aud: "",
    auth_time: null,
    user_id: "",
    sub: "",
    iat: null,
    exp: null,
    email: "",
    email_verified: false,
    firebase: {
      identities: {
        email: [],
      },
      sign_in_provider: "",
    },
  },
  error: {
    code: "",
    message: "",
  },
};

const claimsReducer = createReducer(
  initialState,
  on(ClaimsActions.setClaims, (state, { claims }) => ({
    ...state,
    claims: { ...claims },
  })),
  on(ClaimsActions.resetClaims, (state) => ({ ...state, claims: {} }))
);

export function reducer(state: State | undefined, action: Action) {
  return claimsReducer(state, action);
}
