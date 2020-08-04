import { createAction, props } from "@ngrx/store";

export const setClaims = createAction(
  "[Auth/Claims] Set Claims",
  props<{ claims: any }>()
);

export const resetClaims = createAction("[Auth/Claims] Reset Claims");
