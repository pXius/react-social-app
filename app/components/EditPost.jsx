import React, { useEffect, useContext } from "react";
import { useImmerReducer } from "use-immer";
import Page from "./Page";
import Axios from "axios";
import { useParams, withRouter, Link } from "react-router-dom";
import LoadingDotsIcon from "./LoadingDotsIcon";
import StateContext from "../StateContext";
import DispatchContext from "../DispatchContext";
import NotFound from "./NotFound";

function EditPost(props) {
    //------------------------------------------------------------------------------\\
    const appState = useContext(StateContext);
    const appDispatch = useContext(DispatchContext);

    const initialState = {
        title: {
            value: "",
            hasErrors: false,
            message: ""
        },
        body: {
            value: "",
            hasErrors: "",
            message: ""
        },
        isFetching: true,
        isSaving: false,
        id: useParams().id,
        sendCount: 0,
        notFound: false
    };

    const ourReducer = (draft, action) => {
        switch (action.type) {
            case "fetchComplete":
                draft.title.value = action.value.title;
                draft.body.value = action.value.body;
                draft.isFetching = false;
                break;
            case "titleChange":
                draft.title.hasErrors = false;
                draft.title.value = action.value;
                break;
            case "bodyChange":
                draft.body.hasErrors = false;
                draft.body.value = action.value;
                break;
            case "submitRequest":
                if (!draft.title.hasErrors && !draft.body.hasErrors) {
                    draft.sendCount++;
                }
                break;
            case "savingStarted":
                draft.isSaving = true;
                break;
            case "savingComplete":
                draft.isSaving = false;
                break;
            case "titleRules":
                if (!action.value.trim()) {
                    draft.title.hasErrors = true;
                    draft.title.message = "Title can't be blank!";
                }
                break;
            case "bodyRules":
                if (!action.value.trim()) {
                    draft.body.hasErrors = true;
                    draft.body.message = "Body can't be blank!";
                } else {
                    draft.body.hasErrors = false;
                }
                break;
            case "notFound":
                draft.notFound = true;
                break;
        }
    };

    const [state, dispatch] = useImmerReducer(ourReducer, initialState);
    //------------------------------------------------------------------------------\\

    useEffect(() => {
        const requestCancel = Axios.CancelToken.source();
        const fetchPost = async () => {
            try {
                const response = await Axios.get(`/post/${state.id}`, { cancelToken: requestCancel.token });
                if (response.data) {
                    dispatch({ type: "fetchComplete", value: response.data });
                    if (appState.user.username != response.data.author.username) {
                        appDispatch({
                            type: "flashMessage",
                            value: "You do not have permission to edit that post!"
                        });
                        props.history.push("/");
                    }
                } else {
                    dispatch({ type: "notFound" });
                }
            } catch (e) {
                console.log("There was a problem or request was canceled.");
            }
        };
        fetchPost();
        return () => requestCancel.cancel();
    }, []);

    const submitHandler = e => {
        e.preventDefault();
        dispatch({ type: "titleRules", value: state.title.value });
        dispatch({ type: "bodyRules", value: state.body.value });
        dispatch({ type: "submitRequest" });
    };

    useEffect(() => {
        const requestCancel = Axios.CancelToken.source();
        if (state.sendCount) {
            dispatch({ type: "savingStarted" });
            const sendPost = async () => {
                try {
                    await Axios.post(
                        `/post/${state.id}/edit`,
                        {
                            title: state.title.value,
                            body: state.body.value,
                            token: appState.user.token
                        },
                        requestCancel.token
                    );
                    dispatch({ type: "savingComplete" });
                    appDispatch({ type: "flashMessage", value: "Post Edited" });
                    props.history.push(`/post/${state.id}`);
                } catch (e) {
                    console.log("Something went wrong");
                }
            };
            sendPost();
            return () => requestCancel.cancel();
        }
    }, [state.sendCount]);

    if (state.notFound) {
        return <NotFound />;
    }

    if (state.isFetching)
        return (
            <Page title="...loading post">
                <LoadingDotsIcon />
            </Page>
        );

    return (
        <Page title="edit Post">
            <Link to={`/post/${state.id}`} className="small font-weight-bold">
                &laquo; Back to post
            </Link>
            <form className="mt-3" onSubmit={submitHandler}>
                <div className="form-group">
                    <label htmlFor="post-title" className="text-muted mb-1">
                        <small>Title</small>
                    </label>
                    <input
                        value={state.title.value}
                        autoFocus
                        name="title"
                        id="post-title"
                        className="form-control form-control-lg form-control-title"
                        type="text"
                        placeholder=""
                        autoComplete="off"
                        onChange={e => dispatch({ type: "titleChange", value: e.target.value })}
                        onBlur={e => dispatch({ type: "titleRules", value: e.target.value })}
                    />
                    {state.title.hasErrors && (
                        <div className="alert alert-danger small liveValidateMessage">
                            {state.title.message}
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="post-body" className="text-muted mb-1 d-block">
                        <small>Body Content</small>
                    </label>
                    <textarea
                        value={state.body.value}
                        name="body"
                        id="post-body"
                        className="body-content tall-textarea form-control"
                        type="text"
                        onChange={e => dispatch({ type: "bodyChange", value: e.target.value })}
                        onBlur={e => dispatch({ type: "bodyRules", value: e.target.value })}
                    />
                    {state.body.hasErrors && (
                        <div className="alert alert-danger small liveValidateMessage">
                            {state.body.message}
                        </div>
                    )}
                </div>

                <button disabled={state.isSaving} className="btn btn-primary">
                    {state.isSaving ? "Saving" : "Edit Post"}
                </button>
            </form>
        </Page>
    );
}

export default withRouter(EditPost);
