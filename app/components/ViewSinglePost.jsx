import React, { useState, useEffect, useContext } from "react";
import Page from "./Page";
import Axios from "axios";
import { useParams, Link, withRouter } from "react-router-dom";
import LoadingDotsIcon from "./LoadingDotsIcon";
import ReactMarkdown from "react-markdown";
import ReactTooltip from "react-tooltip";
import NotFound from "./NotFound";
import StateContext from "../StateContext";
import DispatchContext from "../DispatchContext";

function ViewSinglePost(props) {
  const appDispatch = useContext(DispatchContext);
  const appState = useContext(StateContext);
  const [isLoading, setIsLoading] = useState(true);
  const [post, setPost] = useState();
  const { id } = useParams();

  useEffect(() => {
    const requestCancel = Axios.CancelToken.source();

    const fetchPost = async () => {
      try {
        const response = await Axios.get(`/post/${id}`, { cancelToken: requestCancel.token });
        setPost(response.data);
        setIsLoading(false);
      } catch (e) {
        console.log("There was a problem or request was canceled.");
      }
    };
    fetchPost();
    return () => requestCancel.cancel();
  }, [id]);

  if (!isLoading && !post) {
    return <NotFound />;
  }

  if (isLoading)
    return (
      <Page title="...loading post">
        <LoadingDotsIcon />
      </Page>
    );

  const date = new Date(post.createdDate);
  const dateFormatted = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  const isOwner = () => {
    if (appState.loggedIn) {
      return appState.user.username == post.author.username;
    }
    return false;
  };

  const deleteHandler = async () => {
    const areYouSure = window.confirm("Are you sure you want to delete this post?");
    if (areYouSure) {
      try {
        const response = await Axios.delete(`/post/${id}`, { data: { token: appState.user.token } });
        if (response.data == "Success") {
          appDispatch({ type: "flashMessage", value: "Post was deleted!" });
          props.history.push(`/profile/${appState.user.username}`);
        }
      } catch (e) {
        console.log(e);
      }
    }
  };

  return (
    <Page title={`a post by ${post.author.username}`}>
      <div className="d-flex justify-content-between">
        <h2>{`${post.title}`}</h2>

        {isOwner() && (
          <span className="pt-2">
            <Link data-tip="Edit" data-for="edit" to={`/post/${post._id}/edit`} className="text-primary mr-2">
              <i className="fas fa-edit"></i>
            </Link>
            <ReactTooltip id="edit" className="custom-tooltip" />{" "}
            <a
              onClick={deleteHandler}
              data-tip="Delete"
              data-for="delete"
              className="delete-post-button text-danger">
              <i className="fas fa-trash"></i>
            </a>
            <ReactTooltip id="delete" className="custom-tooltip" />
          </span>
        )}
      </div>

      <p className="text-muted small mb-4">
        <Link to={`/profile/${post.author.username}`}>
          <img className="avatar-tiny" src={post.author.avatar} />
        </Link>
        Posted by <Link to={`/profile/${post.author.username}`}>{post.author.username}</Link> on{" "}
        {dateFormatted}
      </p>

      <div className="body-content">
        <ReactMarkdown
          source={post.body}
          allowedTypes={["paragraph", "strong", "emphasis", "text", "heading", "list", "listItem"]}
        />
      </div>
    </Page>
  );
}

export default withRouter(ViewSinglePost);
