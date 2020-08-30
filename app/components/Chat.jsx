import React, { useEffect, useContext, useRef } from "react";
import StateContext from "../StateContext";
import DispatchContext from "../DispatchContext";
import { useImmer } from "use-immer";
import { Link } from "react-router-dom";
import io from "socket.io-client";
const socket = io("http://localhost:8080");

function Chat() {
  const appState = useContext(StateContext);
  const appDispatch = useContext(DispatchContext);
  const chatField = useRef(null);
  const chatLog = useRef(null);
  const [state, setState] = useImmer({
    fieldValue: "",
    chatMessages: []
  });

  useEffect(() => {
    if (appState.isChatOpen) {
      chatField.current.focus();
      appDispatch({ type: "resetUnreadMessages" });
    }
  }, [appState.isChatOpen]);

  useEffect(() => {
    socket.on("chatFromServer", message => {
      setState(draft => {
        draft.chatMessages.push(message);
      });
      return () => socket.disconnect();
    });
  }, []);

  useEffect(() => {
    chatLog.current.scrollTop = chatLog.current.scrollHeight;
    if (!appState.isChatOpen && state.chatMessages.length) {
      appDispatch({ type: "increaseUnreadMessages" });
    }
  }, [state.chatMessages]);

  const handleFieldChange = e => {
    const value = e.target.value;
    setState(draft => {
      draft.fieldValue = value;
    });
  };

  const handleSubmit = e => {
    e.preventDefault();
    // Send Message to chat server
    socket.emit("chatFromBrowser", { message: state.fieldValue, token: appState.user.token });

    setState(draft => {
      //Add message to setState of messages
      draft.chatMessages.push({
        message: draft.fieldValue,
        username: appState.user.username,
        avatar: appState.user.avatar
      });
      draft.fieldValue = "";
    });
  };

  return (
    <div
      id="chat-wrapper"
      className={`chat-wrapper shadow border-top border-left border-right ${
        appState.isChatOpen && "chat-wrapper--is-visible"
      }`}>
      <div className="chat-title-bar bg-primary">
        Chat
        <span onClick={() => appDispatch({ type: "closeChat" })} className="chat-title-bar-close">
          <i className="fas fa-times-circle"></i>
        </span>
      </div>
      <div ref={chatLog} id="chat" className="chat-log">
        {state.chatMessages.map((message, index) => {
          if (message.username == appState.user.username) {
            return (
              <div key={index} className="chat-self">
                <div className="chat-message">
                  <div className="chat-message-inner">{message.message}</div>
                </div>
                <img className="chat-avatar avatar-tiny" src={appState.user.avatar} />
              </div>
            );
          } else {
            return (
              <div key={index} className="chat-other">
                <Link to={`/profile/${message.username}`}>
                  <img className="avatar-tiny" src={message.avatar} />
                </Link>
                <div className="chat-message">
                  <div className="chat-message-inner">
                    <Link to={`/profile/${message.username}`}>
                      <strong>{message.username}: </strong>
                    </Link>
                    {message.message}
                  </div>
                </div>
              </div>
            );
          }
        })}
      </div>
      <form onSubmit={handleSubmit} id="chatForm" className="chat-form border-top">
        <input
          value={state.fieldValue}
          onChange={handleFieldChange}
          ref={chatField}
          type="text"
          className="chat-field"
          id="chatField"
          placeholder="Type a message…"
          autoComplete="off"
        />
      </form>
    </div>
  );
}

export default Chat;