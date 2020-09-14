import React, { useEffect, Suspense } from "react";
import ReactDOM from "react-dom";
import { useImmerReducer } from "use-immer";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import { CSSTransition } from "react-transition-group";
import Axios from "axios";
Axios.defaults.baseURL = process.env.BACKENDURL || "https://interact-backend.herokuapp.com";

// Contexts
import StateContext from "./StateContext";
import DispatchContext from "./DispatchContext";

// Components
import LoadingDotsIcon from "./components/LoadingDotsIcon";
import Header from "./components/Header";
import HomeGuest from "./components/HomeGuest";
import Footer from "./components/Footer";
import About from "./components/About";
import Terms from "./components/Terms";
import Home from "./components/Home";
import FlashMessages from "./components/FlashMessages";
import Profile from "./components/Profile";
import EditPost from "./components/EditPost";
import NotFound from "./components/NotFound";
const Chat = React.lazy(() => import("./components/Chat"));
const CreatePost = React.lazy(() => import("./components/CreatePost"));
const ViewSinglePost = React.lazy(() => import("./components/ViewSinglePost"));
const Search = React.lazy(() => import("./components/Search"));

function Main() {
  // Reducer Block ---------------------------------------------------->
  const initialState = {
    loggedIn: Boolean(localStorage.getItem("interactToken")),
    flashMessages: [],
    user: {
      token: localStorage.getItem("interactToken"),
      username: localStorage.getItem("interactUsername"),
      avatar: localStorage.getItem("interactAvatar")
    },
    isSearchOpen: false,
    isChatOpen: false,
    unreadMessages: 0
  };

  const ourReducer = (draft, action) => {
    switch (action.type) {
      case "login":
        draft.loggedIn = true;
        draft.user = action.data;
        break;
      case "logout":
        draft.loggedIn = false;
        break;
      case "flashMessage":
        draft.flashMessages.push(action.value);
        break;
      case "openSearch":
        draft.isSearchOpen = true;
        break;
      case "closeSearch":
        draft.isSearchOpen = false;
        break;
      case "toggleChat":
        draft.isChatOpen = !draft.isChatOpen;
        break;
      case "closeChat":
        draft.isChatOpen = false;
        break;
      case "increaseUnreadMessages":
        draft.unreadMessages++;
        break;
      case "resetUnreadMessages":
        draft.unreadMessages = 0;
        break;
    }
  };

  const [state, dispatch] = useImmerReducer(ourReducer, initialState);

  useEffect(() => {
    if (state.loggedIn) {
      localStorage.setItem("interactToken", state.user.token);
      localStorage.setItem("interactUsername", state.user.username);
      localStorage.setItem("interactAvatar", state.user.avatar);
    } else {
      localStorage.removeItem("interactToken");
      localStorage.removeItem("interactUsername");
      localStorage.removeItem("interactAvatar");
    }
  }, [state.loggedIn]);

  //Check if token is still valid on first render
  useEffect(() => {
    if (state.loggedIn) {
      const cancelRequest = Axios.CancelToken.source();
      const fetchResults = async () => {
        try {
          const response = await Axios.post(
            "/checkToken",
            { token: state.user.token },
            { cancelToken: cancelRequest.token }
          );
          if (!response.data) {
            dispatch({ type: "logout" });
            dispatch({ type: "flashMessage", value: "Your session has expired. Please sign in again." });
          }
        } catch (e) {
          console.log("There was a problem.");
        }
      };
      fetchResults();
      return () => cancelRequest.cancel();
    }
  }, []);

  //-------------------------------------------------------------------->

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        <BrowserRouter>
          <FlashMessages messages={state.flashMessages} />
          <Header />
          <Suspense fallback={<LoadingDotsIcon />}>
            <Switch>
              <Route path="/" exact>
                {state.loggedIn ? <Home /> : <HomeGuest />}
              </Route>
              <Route path="/profile/:username">
                <Profile />
              </Route>
              <Route path="/create-post">
                <CreatePost />
              </Route>
              <Route path="/post/:id" exact>
                <ViewSinglePost />
              </Route>
              <Route path="/post/:id/edit" exact>
                <EditPost />
              </Route>
              <Route path="/about-us">
                <About />
              </Route>
              <Route path="/terms">
                <Terms />
              </Route>
              <Route>
                <NotFound />
              </Route>
            </Switch>
          </Suspense>
          <CSSTransition timeout={330} in={state.isSearchOpen} classNames="search-overlay" unmountOnExit>
            <div className="search-overlay">
              <Suspense fallback="">
                <Search />
              </Suspense>
            </div>
          </CSSTransition>
          <Suspense fallback="">{state.loggedIn && <Chat />}</Suspense>
          <Footer />
        </BrowserRouter>
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

ReactDOM.render(<Main />, document.querySelector("#app"));

// Hot JS - reloading now, baby!
if (module.hot) {
  module.hot.accept();
}
