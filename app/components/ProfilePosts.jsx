import React, { useEffect, useState } from "react";
import Axios from "axios";
import { useParams } from "react-router-dom";
import LoadingDotsIcon from "./LoadingDotsIcon";
import Post from "./Post";

function ProfilePosts() {
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const { username } = useParams();
  const requestCancel = Axios.CancelToken.source();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await Axios.get(`/profile/${username}/posts`, {
          cancelToken: requestCancel.token
        });
        setPosts(response.data);
        setIsLoading(false);
      } catch (e) {
        console.log("There was a problem");
      }
    };
    fetchPosts();
    return () => requestCancel.cancel();
  }, [username]);

  if (isLoading) return <LoadingDotsIcon />;
  return (
    <div className="list-group">
      {posts.map(post => {
        return <Post noAuthor={true} post={post} key={post._id} />;
      })}
    </div>
  );
}

export default ProfilePosts;
