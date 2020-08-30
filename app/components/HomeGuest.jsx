import React, { useContext, useEffect } from "react";
import Page from "./Page";
import Axios from "axios";
import DispatchContext from "../DispatchContext";
import { useImmerReducer } from "use-immer";
import { CSSTransition } from "react-transition-group";

function HomeGuest() {
  const appDispatch = useContext(DispatchContext);

  const initialState = {
    username: {
      value: "",
      hasErrors: false,
      errorMessage: "",
      isUnique: false,
      checkCount: 0
    },
    email: {
      value: "",
      hasErrors: false,
      errorMessage: "",
      isUnique: false,
      checkCount: 0
    },
    password: {
      value: "",
      hasErrors: false,
      errorMessage: ""
    },
    submitCount: 0
  };

  const ourReducer = (draft, action) => {
    switch (action.type) {
      case "usernameImmediately":
        draft.username.hasErrors = false;
        draft.username.value = action.value;
        if (draft.username.value.length > 30) {
          draft.username.hasErrors = true;
          draft.username.errorMessage = "Username can not exceed 30 characters.";
        }
        if (draft.username.value && !/^([a-zA-z0-9]+)$/.test(draft.username.value)) {
          draft.username.hasErrors = true;
          draft.username.errorMessage = "Username can only contain letters and numbers.";
        }
        break;
      case "usernameAfterDelay":
        if (draft.username.value.length < 3) {
          draft.username.hasErrors = true;
          draft.username.errorMessage = "Username must be at least 3 characters.";
        }
        if (!draft.username.hasErrors && !action.noRequest) {
          draft.username.checkCount++;
        }
        break;
      case "usernameUniqueResults":
        if (action.value) {
          draft.username.hasErrors = true;
          draft.username.isUnique = false;
          draft.username.errorMessage = "That username is already taken.";
        } else {
          draft.username.isUnique = true;
        }
        break;
      case "emailImmediately":
        draft.email.hasErrors = false;
        draft.email.value = action.value;
        break;
      case "emailAfterDelay":
        if (!/^\S+@\S+$/.test(draft.email.value)) {
          draft.email.hasErrors = true;
          draft.email.errorMessage = "You must provide a valid email address.";
        }
        if (!draft.email.hasErrors && !action.noRequest) {
          draft.email.checkCount++;
        }
        break;
      case "emailUniqueResults":
        if (action.value) {
          draft.email.hasErrors = true;
          draft.email.isUnique = false;
          draft.email.errorMessage = "That email is already associated with another account.";
        } else {
          draft.email.isUnique = true;
        }
        break;
      case "passwordImmediately":
        draft.password.hasErrors = false;
        draft.password.value = action.value;
        if (draft.password.value.length > 50) {
          draft.password.hasErrors = true;
          draft.password.errorMessage = "Password can not exceed 50 characters.";
        }
        break;
      case "passwordAfterDelay":
        if (draft.password.value.length < 12) {
          draft.password.hasErrors = true;
          draft.password.errorMessage = "Password must be at least 12 characters long.";
        }
        break;
      case "submitForm":
        if (
          !draft.username.hasErrors &&
          draft.username.isUnique &&
          !draft.email.hasErrors &&
          draft.email.isUnique &&
          !draft.password.hasErrors
        ) {
          draft.submitCount++;
        }
        break;
    }
  };

  const [state, dispatch] = useImmerReducer(ourReducer, initialState);
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Username Input Handling
  useEffect(() => {
    if (state.username.value) {
      const delay = setTimeout(() => dispatch({ type: "usernameAfterDelay" }), 800);

      return () => clearTimeout(delay);
    }
  }, [state.username.value]);

  useEffect(() => {
    if (state.username.checkCount) {
      const cancelRequest = Axios.CancelToken.source();
      const fetchResults = async () => {
        try {
          const response = await Axios.post(
            "/doesUsernameExist",
            { username: state.username.value },
            { cancelToken: cancelRequest.token }
          );
          dispatch({ type: "usernameUniqueResults", value: response.data });
        } catch (e) {
          console.log("There was a problem.");
        }
      };
      fetchResults();
      return () => cancelRequest.cancel();
    }
  }, [state.username.checkCount]);

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // E-Mail Input Handling

  useEffect(() => {
    if (state.email.value) {
      const delay = setTimeout(() => dispatch({ type: "emailAfterDelay" }), 1500);

      return () => clearTimeout(delay);
    }
  }, [state.email.value]);

  useEffect(() => {
    if (state.email.checkCount) {
      const cancelRequest = Axios.CancelToken.source();
      const fetchResults = async () => {
        try {
          const response = await Axios.post(
            "/doesEmailExist",
            { email: state.email.value },
            { cancelToken: cancelRequest.token }
          );
          dispatch({ type: "emailUniqueResults", value: response.data });
        } catch (e) {
          console.log("There was a problem.");
        }
      };
      fetchResults();
      return () => cancelRequest.cancel();
    }
  }, [state.email.checkCount]);

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Password Input Handling

  useEffect(() => {
    if (state.password.value) {
      const delay = setTimeout(() => dispatch({ type: "passwordAfterDelay" }), 800);

      return () => clearTimeout(delay);
    }
  }, [state.password.value]);

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  useEffect(() => {
    if (state.submitCount) {
      const cancelRequest = Axios.CancelToken.source();
      const fetchResults = async () => {
        try {
          const response = await Axios.post(
            "/register",
            { username: state.username.value, email: state.email.value, password: state.password.value },
            { cancelToken: cancelRequest.token }
          );
          appDispatch({ type: "login", data: response.data });
          appDispatch({ type: "flashMessage", value: "Welcome to your new account!" });
        } catch (e) {
          console.log("There was a problem.");
        }
      };
      fetchResults();
      return () => cancelRequest.cancel();
    }
  }, [state.submitCount]);

  //Submit form
  const handleSubmit = e => {
    console.log("submitting");
    e.preventDefault();
    dispatch({ type: "usernameImmediately", value: state.username.value });
    dispatch({ type: "usernameAfterDelay", value: state.username.value, noRequest: true });
    dispatch({ type: "emailImmediately", value: state.email.value });
    dispatch({ type: "emailAfterDelay", value: state.email.value, noRequest: true });
    dispatch({ type: "passwordImmediately", value: state.password.value });
    dispatch({ type: "passwordAfterDelay", value: state.password.value });
    dispatch({ type: "submitForm" });
  };

  return (
    <Page title="Welcome" wide={true}>
      <div className="row align-items-center">
        <div className="col-lg-7 py-3 py-md-5">
          <h1 className="display-3">Remember Writing?</h1>
          <p className="lead text-muted">
            Are you sick of short tweets and impersonal &ldquo;shared&rdquo; posts that are reminiscent of the
            late 90&rsquo;s email forwards? We believe getting back to actually writing is the key to enjoying
            the internet again.
          </p>
        </div>
        <div className="col-lg-5 pl-lg-5 pb-3 py-lg-5">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username-register" className="text-muted mb-1">
                <small>Username</small>
              </label>
              <CSSTransition
                in={state.username.hasErrors}
                timeout={330}
                classNames="liveValidateMessage"
                unmountOnExit>
                <div className="alert alert-danger small liveValidateMessage">
                  {state.username.errorMessage}
                </div>
              </CSSTransition>
              <input
                onChange={e => dispatch({ type: "usernameImmediately", value: e.target.value })}
                value={state.username.value}
                id="username-register"
                name="username"
                className="form-control"
                type="text"
                placeholder="Pick a username"
                autoComplete="off"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email-register" className="text-muted mb-1">
                <small>Email</small>
              </label>
              <input
                onChange={e => dispatch({ type: "emailImmediately", value: e.target.value })}
                value={state.email.value}
                id="email-register"
                name="email"
                className="form-control"
                type="text"
                placeholder="you@example.com"
                autoComplete="off"
              />
              <CSSTransition
                in={state.email.hasErrors}
                timeout={330}
                classNames="liveValidateMessage"
                unmountOnExit>
                <div className="alert alert-danger small liveValidateMessage">{state.email.errorMessage}</div>
              </CSSTransition>
            </div>
            <div className="form-group">
              <label htmlFor="password-register" className="text-muted mb-1">
                <small>Password</small>
              </label>
              <input
                onChange={e => dispatch({ type: "passwordImmediately", value: e.target.value })}
                value={state.password.value}
                id="password-register"
                name="password"
                className="form-control"
                type="password"
                placeholder="Create a password"
              />
              <CSSTransition
                in={state.password.hasErrors}
                timeout={330}
                classNames="liveValidateMessage"
                unmountOnExit>
                <div className="alert alert-danger small liveValidateMessage">
                  {state.password.errorMessage}
                </div>
              </CSSTransition>
            </div>
            <button type="submit" className="py-3 mt-4 btn btn-lg btn-success btn-block">
              Sign up for Interact
            </button>
          </form>
        </div>
      </div>
    </Page>
  );
}

export default HomeGuest;
