import { Injectable } from "@angular/core";
import { Actions, Effect, ofType } from "@ngrx/effects";
import { User } from "../models/auth.model";

import { AngularFireAuth } from "@angular/fire/auth";

import {
  catchError,
  exhaustMap,
  map,
  switchMap,
  take,
  tap,
  withLatestFrom,
  concatMapTo,
  flatMap,
  concatMap,
  mergeMap,
} from "rxjs/operators";
import * as userActions from "../actions/auth.actions";
import { from, Observable, of, zip, combineLatest } from "rxjs";
import { auth } from "firebase/app";
import "firebase/auth";
import { SetProviders } from "../actions/providers-management.actions";
import { Action } from "@ngrx/store";
import UserCredential = auth.UserCredential;
import { setClaims, resetClaims } from "../actions/claims-management.actions";
import { ClaimsManagementActions } from "../actions";

const PROVIDERS_MAP = {};
PROVIDERS_MAP[auth.FacebookAuthProvider.FACEBOOK_SIGN_IN_METHOD] = "facebook";
PROVIDERS_MAP[auth.GoogleAuthProvider.GOOGLE_SIGN_IN_METHOD] = "google";
PROVIDERS_MAP[auth.EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD] =
  "password";
PROVIDERS_MAP[auth.PhoneAuthProvider.PHONE_SIGN_IN_METHOD] = "phone";

@Injectable()
export class LoginEffects {
  @Effect()
  getUser: Observable<Action> = this.actions$.pipe(
    ofType<userActions.GetUser>(userActions.AuthActionTypes.GetUser),
    map((action: userActions.GetUser) => action.payload),
    exhaustMap((payload) =>
      this.afAuth.authState.pipe(
        take(1),
        switchMap((authData) => {
          console.debug(authData);
          if (authData) {
            /// User logged in
            console.debug("USER", authData);
            // authData
            //   .getIdTokenResult()
            //   .then((token) => setClaims({ claims: token.claims }));
            return zip(from(authData.getIdTokenResult(true))).pipe(
              switchMap(([tokenResult]) => {
                console.debug("providers found", authData.providerData);
                // console.debug("res", res);
                const claims = tokenResult.claims;
                const providers = authData.providerData.reduce(
                  (prev, current) => {
                    const key = PROVIDERS_MAP[current.providerId];
                    if (key) {
                      prev[key] = true;
                    }
                    return prev;
                  },
                  {}
                );
                console.debug(
                  providers,
                  authData.providerData.map((p) => p.providerId)
                );
                const user = new User(
                  authData.uid,
                  authData.displayName,
                  authData.email,
                  authData.phoneNumber,
                  authData.photoURL,
                  authData.emailVerified
                );
                return from([
                  setClaims({ claims: claims }),
                  new SetProviders(providers),
                  new userActions.Authenticated({ user }),
                ]);
              })
            );
          } else {
            return of(new userActions.NotAuthenticated());
          }
        })
      )
    )
  );

  @Effect()
  googleLogin: Observable<Action> = this.actions$.pipe(
    ofType(userActions.AuthActionTypes.GoogleLogin),
    map((action: userActions.GoogleLogin) => action.payload),
    exhaustMap((payload) => {
      return from(this.doGoogleLogin()).pipe(
        map((credential) => {
          // successful login
          return new userActions.GetUser();
        }),
        catchError((error) => of(new userActions.AuthError(error)))
      );
    })
  );

  @Effect()
  facebookLogin: Observable<Action> = this.actions$.pipe(
    ofType(userActions.AuthActionTypes.FacebookLogin),
    map((action: userActions.FacebookLogin) => action.payload),
    exhaustMap((payload) => {
      return from(this.doFacebookLogin()).pipe(
        map((credential) => {
          // successful login
          return new userActions.GetUser();
        }),
        catchError((error) => of(new userActions.AuthError(error)))
      );
    })
  );

  @Effect()
  loginWithCredentials: Observable<Action> = this.actions$.pipe(
    ofType(userActions.AuthActionTypes.CredentialsLogin),
    map((action: userActions.CredentialsLogin) => {
      return {
        email: action.email,
        password: action.password,
        remember: action.remember ? action.remember : false,
      };
    }),
    exhaustMap((credentials) => {
      return from(this.doLoginWithCredentials(credentials)).pipe(
        map((p) => {
          // successful login
          return new userActions.GetUser();
        }),
        catchError((error) => of(new userActions.AuthError(error)))
      );
    })
  );

  @Effect()
  logout: Observable<Action> = this.actions$.pipe(
    ofType(userActions.AuthActionTypes.Logout),
    map((action: userActions.Logout) => action.payload),
    exhaustMap(() => from(this.afAuth.signOut())),
    concatMapTo([resetClaims(), new userActions.NotAuthenticated()])
  );

  @Effect()
  onDeleteNotVerifiedAccount$: Observable<any> = this.actions$.pipe(
    ofType<userActions.DeleteAccount>(
      userActions.AuthActionTypes.DeleteAccount
    ),
    switchMap(() => {
      return this.afAuth.user.pipe(tap((user) => user.delete())).pipe(
        map(() => new userActions.DeleteAccountSuccess()),
        catchError((error) => of(new userActions.DeleteAccountError(error)))
      );
    })
  );

  @Effect({ dispatch: false })
  refreshToken$ = this.actions$.pipe(
    ofType(userActions.AuthActionTypes.RefreshToken),
    tap((action) => this.afAuth.user.pipe(tap((user) => user.getIdToken(true))))
  );

  constructor(private actions$: Actions, private afAuth: AngularFireAuth) {}

  private doFacebookLogin(): Promise<UserCredential> {
    const provider = new auth.FacebookAuthProvider();
    return this.afAuth.signInWithPopup(provider);
  }

  private doGoogleLogin(): Promise<UserCredential> {
    const provider = new auth.GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: "select_account",
    });
    return this.afAuth.signInWithPopup(provider);
  }

  private doLoginWithCredentials(credentials: {
    email: string;
    password: string;
    remember?: boolean;
  }): Promise<UserCredential> {
    if (credentials.remember) {
      return this.afAuth
        .setPersistence(auth.Auth.Persistence.LOCAL)
        .then(() => {
          return this.afAuth.signInWithEmailAndPassword(
            credentials.email,
            credentials.password
          );
        });
    } else {
      return this.afAuth
        .setPersistence(auth.Auth.Persistence.SESSION)
        .then(() => {
          return this.afAuth.signInWithEmailAndPassword(
            credentials.email,
            credentials.password
          );
        });
    }
  }
}
