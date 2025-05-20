import React, { useContext, useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import useSound from 'use-sound';
import config from '../../../config';
import LatestMessagesContext, { LatestMessages } from '../../../contexts/LatestMessages/LatestMessages';
import TypingMessage from './TypingMessage';
import Header from './Header';
import Footer from './Footer';
import Message from './Message';
import '../styles/_messages.scss';
import initialBottyMessage from '../../../common/constants/initialBottyMessage';

const socket = io(
  config.BOT_SERVER_ENDPOINT,
  { transports: ['websocket', 'polling', 'flashsocket'] }
);  

function Messages() {
  const [playSend] = useSound(config.SEND_AUDIO_URL);
  const [playReceive] = useSound(config.RECEIVE_AUDIO_URL);

  const { setLatestMessage } = useContext(LatestMessagesContext);

  const [messages] = useState([{message: initialBottyMessage, user: "bot"}]);
  const [messageText, setMessageText] = useState("");
  const [showTyping, setShowTyping] = useState(false);

  const [showError, setShowError] = useState({isVisible: false, message: ""})

  const dummyref = useRef(null);

  const sendMessage = () => {
    const newMessage = {message: messageText, user: "me"};

    messages.push(newMessage)
    socket.emit("user-message", newMessage.message);
    setLatestMessage(newMessage.message)
    playSend();
    setMessageText("")
  }

  const onChangeMessage = (event) => {
    setMessageText(event.target.value);
  }

  function showTypingMessage() {
    if(showTyping) {
      return (<TypingMessage />);
    }
  }

  const handleNewMessage = (newBotMessage) => {
    console.log(newBotMessage)
    playReceive();
    setLatestMessage(newBotMessage)
    messages.push({message: newBotMessage, user: "bot"});
    setShowTyping(false);
  }

  const handleBotTyping = (e) => {
    setShowTyping(true);
  }

  const scrollToLastMessage = () => {
    if(dummyref) {
      dummyref.current?.scrollIntoView();
    }
  }

  const showMessages = () => {

    const items = [];
    messages.map((item, index) => {
        items.push(<Message key={item} message={item} nextMessage={messages[index + 1]} botTyping={showTyping} />)
    });
    return items;
  }

  socket.on('connect_error', (error) => {
    setShowError({isVisible: true, message: "Something went wrong! Failed to connect!"})
  });

  socket.on('disconnect', (reason) => {
    setShowError({isVisible: true, message: "Something went wrong! Disconnected!"})
  });

  socket.on('reconnect_error', (error) => {
    setShowError({isVisible: true, message: "Something went wrong! Failed to reconnect!"})
  });

  socket.on('error', (error) => {
    setShowError({isVisible: true, message: "Something went wrong! Socket Error!"})
  });

  socket.on('connect_timeout', (timeout) => {
    setShowError({isVisible: true, message: "Connection Timeout!"})
  });

  const ShowErrorText = () => {
    if(showError.isVisible) {
      return (
        <p>{showError.message}</p>
      );
    }
  }

  useEffect(() => {
    socket.on('bot-message', handleNewMessage);
    socket.on('bot-typing', handleBotTyping);
    socket.on('connect_error', (error) => {
      setShowError({isVisible: true, message: "Something went wrong! Failed to connect!"})
    });
    socket.on('disconnect', (reason) => {
      setShowError({isVisible: true, message: "Something went wrong! Disconnected!"})
    });
    socket.on('reconnect_error', (error) => {
      setShowError({isVisible: true, message: "Something went wrong! Failed to reconnect!"})
    });
    socket.on('error', (error) => {
      setShowError({isVisible: true, message: "Something went wrong! Socket Error!"})
    });
    socket.on('connect_timeout', (timeout) => {
      setShowError({isVisible: true, message: "Connection Timeout!"})
    });
    scrollToLastMessage();

    return () => {
      socket.off('bot-message', handleNewMessage)
      socket.off('bot-typing', handleBotTyping)
      socket.on('connect_error', () =>{});
      socket.on('disconnect', () =>{});
      socket.on('reconnect_error', () =>{});
      socket.on('error', () =>{});
      socket.on('connect_timeout', () =>{});
    }
  }, [socket, messages, messageText, showTyping])

  return (
    <div className="messages">
      <Header />
      <div className="messages__list" id="message-list">
        { showMessages() }
        { showTypingMessage() }
        { ShowErrorText() }
        <div ref={dummyref}/>
      </div>
      {
        showError.isVisible ? <></> : <Footer message={messageText} sendMessage={sendMessage} onChangeMessage={onChangeMessage} /> 
      }
    </div>
  );
}

export default Messages;
