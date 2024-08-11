import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDzGOMXdVmopdK6OdVRpi78twu2w8HnEtE",
  authDomain: "anytalk-79a5a.firebaseapp.com",
  projectId: "anytalk-79a5a",
  storageBucket: "anytalk-79a5a.appspot.com",
  messagingSenderId: "266983278684",
  appId: "1:266983278684:web:02651e780ff35bbea0be99",
  measurementId: "G-DLBETBJPL7"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function generateRandomNickname() {
    const adjectives = ["Happy", "Brave", "Clever", "Witty", "Kind"];
    const animals = ["Lion", "Tiger", "Bear", "Eagle", "Shark"];
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
    return `${randomAdjective}${randomAnimal}${Math.floor(Math.random() * 1000)}`;
}

function getStoredNickname() {
    let nickname = localStorage.getItem('nickname');
    if (!nickname) {
        nickname = generateRandomNickname();
        localStorage.setItem('nickname', nickname);
    }
    return nickname;
}

function setStoredNickname(nickname) {
    localStorage.setItem('nickname', nickname);
    localStorage.setItem('nicknameLastChanged', Date.now());
}

function canChangeNickname() {
    const lastChanged = localStorage.getItem('nicknameLastChanged');
    if (!lastChanged) return true;
    const now = Date.now();
    return now - lastChanged >= 24 * 60 * 60 * 1000;
}

const forbiddenWords = [
    "병신", "시발", "ㅅㅂ", "ㅄ", 
    "미친놈", "미친년도", "멍청이", "바보", "바보야", 
    "X발", "또라이", "죽어", "광고", "홍보", 
    "구매", "팔아요"
];

function replaceForbiddenWords(message) {
    let filteredMessage = message;
    forbiddenWords.forEach(word => {
        const regex = new RegExp(word, 'gi');
        filteredMessage = filteredMessage.replace(regex, '❤️');
    });
    return filteredMessage;
}

function addMessageToFirebase(codename, message, position) {
    const chatRef = ref(db, 'chats');
    push(chatRef, {
        codename: codename,
        message: message,
        position: position,
        timestamp: Date.now()
    });
}

function loadMessagesFromFirebase() {
    const chatbox = document.getElementById('chatbox');
    const chatRef = ref(db, 'chats');

    onChildAdded(chatRef, (snapshot) => {
        const data = snapshot.val();
        const newMessage = document.createElement('div');
        newMessage.innerHTML = `<strong>${data.codename}:</strong> ${data.message}`;
        newMessage.classList.add('message', data.position);
        chatbox.appendChild(newMessage);
        chatbox.scrollTop = chatbox.scrollHeight;
    });
}

document.getElementById('sendButton').addEventListener('click', function() {
    const nickname = getStoredNickname();
    const chatInput = document.getElementById('chatInput');
    
    if (chatInput.value.trim() !== "") {
        let message = chatInput.value;
        message = replaceForbiddenWords(message);
        
        addMessageToFirebase(nickname, message, 'right');
        
        chatInput.value = "";
    }
});

document.addEventListener('DOMContentLoaded', function() {
    loadMessagesFromFirebase();

    let blockTimeout;

    document.getElementById('chatbox').addEventListener('contextmenu', function(e) {
        e.preventDefault();
        if (e.target.classList.contains('message')) {
            showBlockPopup();
        }
    });

    document.getElementById('chatbox').addEventListener('mousedown', function(e) {
        if (e.target.classList.contains('message')) {
            blockTimeout = setTimeout(showBlockPopup, 2000);
        }
    });

    document.getElementById('chatbox').addEventListener('mouseup', function(e) {
        clearTimeout(blockTimeout);
    });

    document.getElementById('settingsButton').addEventListener('click', function() {
        const nicknameButton = document.getElementById('nicknameButton');
        const blockButton = document.getElementById('blockButton');
        
        nicknameButton.classList.toggle('hidden');
        blockButton.classList.toggle('hidden');
    });

    document.getElementById('nicknameButton').addEventListener('click', function() {
        if (canChangeNickname()) {
            document.getElementById('nicknamePopup').classList.remove('hidden');
        } else {
            alert('닉네임은 하루에 한 번만 변경할 수 있습니다.');
        }
    });

    document.getElementById('saveNicknameButton').addEventListener('click', function() {
        const newNickname = document.getElementById('newNickname').value.trim();
        if (newNickname) {
            setStoredNickname(newNickname);
            document.getElementById('nicknamePopup').classList.add('hidden');
            alert('닉네임이 변경되었습니다.');
        }
    });

    const blockManager = document.getElementById('blockManager');
    const closeBlockManagerButton = document.getElementById('closeBlockManager');
    const blockedList = document.getElementById('blockedList');
    const unblockButton = document.getElementById('unblockButton');

    document.getElementById('blockButton').addEventListener('click', function() {
        blockManager.classList.remove('hidden');
        updateBlockedList();
    });

    closeBlockManagerButton.addEventListener('click', function() {
        blockManager.classList.add('hidden');
    });

    function updateBlockedList() {
        blockedList.innerHTML = '';
        const blockedUsers = JSON.parse(localStorage.getItem('blockedUsers')) || [];
        blockedUsers.forEach(function(user, index) {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${user}`;
            li.addEventListener('click', function() {
                unblockButton.classList.remove('hidden');
                unblockButton.dataset.username = user;
            });
            blockedList.appendChild(li);
        });
    }

    unblockButton.addEventListener('click', function() {
        const username = this.dataset.username;
        let blockedUsers = JSON.parse(localStorage.getItem('blockedUsers')) || [];
        blockedUsers = blockedUsers.filter(user => user !== username);
        localStorage.setItem('blockedUsers', JSON.stringify(blockedUsers));
        updateBlockedList();
        unblockButton.classList.add('hidden');
        alert(`${username}님의 차단이 해제되었습니다.`);
    });

    document.getElementById('newMessagePopup').addEventListener('click', function() {
        scrollToBottom();
        this.classList.add('hidden');
    });
});

function scrollToBottom() {
    const chatbox = document.getElementById('chatbox');
    chatbox.scrollTop = chatbox.scrollHeight;
}

function showBlockPopup() {
    const blockPopup = document.getElementById('blockPopup');
    blockPopup.classList.remove('hidden');
    setTimeout(() => {
        blockPopup.classList.add('hidden');
    }, 3000);
}
