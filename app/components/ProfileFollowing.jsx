import React, { useEffect, useState } from "react";
import Axios from "axios";
import { useParams, Link } from "react-router-dom";
import LoadingDotsIcon from "./LoadingDotsIcon";

function ProfileFollowing() {
  const [isLoading, setIsLoading] = useState(true);
  const [following, setFollowing] = useState([]);
  const { username } = useParams();
  const requestCancel = Axios.CancelToken.source();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await Axios.get(`/profile/${username}/following`, {
          cancelToken: requestCancel.token
        });
        setFollowing(response.data);
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
      {following.map((follower, index) => {
        return (
          <Link
            key={index}
            to={`/profile/${follower.username}`}
            className="list-group-item list-group-item-action">
            <img className="avatar-tiny" src={follower.avatar} /> {follower.username}
          </Link>
        );
      })}
    </div>
  );
}

export default ProfileFollowing;
