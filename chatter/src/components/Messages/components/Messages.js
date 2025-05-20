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

  useEffect(() => {
    socket.on('bot-message', handleNewMessage);

    socket.on('bot-typing', handleBotTyping);

    scrollToLastMessage();

    return () => {
      socket.off('bot-message', handleNewMessage)
      socket.off('bot-typing', handleBotTyping)
    }
  }, [socket, messages, messageText, showTyping])

  return (
    <div className="messages">
      <Header />
      <div className="messages__list" id="message-list">
        { showMessages() }
        { showTypingMessage() }
        <div ref={dummyref}/>
      </div>
      <Footer message={messageText} sendMessage={sendMessage} onChangeMessage={onChangeMessage} />
    </div>
  );
}

export default Messages;
