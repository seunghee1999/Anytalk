import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-analytics.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDzGOMXdVmopdK6OdVRpi78twu2w8HnEtE",
  authDomain: "anytalk-79a5a.firebaseapp.com",
  databaseURL: "https://anytalk-79a5a-default-rtdb.firebaseio.com",
  projectId: "anytalk-79a5a",
  storageBucket: "anytalk-79a5a.appspot.com",
  messagingSenderId: "266983278684",
  appId: "1:266983278684:web:02651e780ff35bbea0be99",
  measurementId: "G-DLBETBJPL7"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
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

function addMessageToFirebase(nickname, message, position) {
    const messageRef = ref(db, 'messages/' + Date.now());
    set(messageRef, {
        nickname: nickname,
        message: message,
        position: position
    }).then(() => {
        console.log("메시지가 Firebase에 저장되었습니다.");
    }).catch((error) => {
        console.error("Firebase에 메시지 저장 실패:", error);
    });
}

function loadMessagesFromFirebase() {
    const messagesRef = ref(db, 'messages');
    onValue(messagesRef, (snapshot) => {
        const data = snapshot.val();
        const chatbox = document.getElementById('chatbox');
        chatbox.innerHTML = '';
        for (let id in data) {
            addMessage(data[id].nickname, data[id].message, data[id].position, true);
        }
        scrollToBottom();
    });
}

function addMessage(nickname, message, position, fromFirebase = false) {
    const blockedUsers = getBlockedUsers();
    if (blockedUsers.includes(nickname)) return;

    const chatbox = document.getElementById('chatbox');
    const atBottom = chatbox.scrollTop + chatbox.clientHeight === chatbox.scrollHeight;

    const newMessage = document.createElement('div');
    newMessage.innerHTML = `<strong>${nickname}:</strong> ${message}`;
    newMessage.classList.add('message', position);

    // 시스템 메시지는 상대방 메시지 스타일 적용
    if (nickname === "시스템") {
        newMessage.classList.add('left');
    }

    chatbox.appendChild(newMessage);

    if (!fromFirebase) {
        addMessageToFirebase(nickname, message, position);
    }

    if (!atBottom) {
        showNewMessagePopup();
    } else {
        scrollToBottom();
    }
}

function getBlockedUsers() {
    const blockedUsers = localStorage.getItem('blockedUsers');
    return blockedUsers ? JSON.parse(blockedUsers) : [];
}

function saveBlockedUsers(blockedUsers) {
    localStorage.setItem('blockedUsers', JSON.stringify(blockedUsers));
}

function showNewMessagePopup() {
    const popup = document.getElementById('newMessagePopup');
    popup.classList.remove('hidden');
    setTimeout(() => {
        popup.classList.add('hidden');
    }, 3000);
}

function scrollToBottom() {
    const chatbox = document.getElementById('chatbox');
    chatbox.scrollTop = chatbox.scrollHeight;
}

function greetNewUser() {
    const nickname = getStoredNickname();
    const greetingMessage = `${nickname}님이 입장했습니다.`;
    addMessage("시스템", greetingMessage, 'left', true);
}

document.addEventListener('DOMContentLoaded', function() {
    loadMessagesFromFirebase();
    greetNewUser();

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

    document.getElementById('sendButton').addEventListener('click', function() {
        const nickname = getStoredNickname();
        const chatInput = document.getElementById('chatInput');
        
        if (chatInput.value.trim() !== "") {
            let message = chatInput.value;
            message = replaceForbiddenWords(message);
            addMessage(nickname, message, 'right');
            chatInput.value = "";
        }
    });

    document.getElementById('chatInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('sendButton').click();
        }
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

    document.getElementById('blockButton').addEventListener('click', function() {
        const blockManager = document.getElementById('blockManager');
        const blockedList = document.getElementById('blockedList');
        blockedList.innerHTML = '';

        const blockedUsers = getBlockedUsers();
        blockedUsers.forEach((user, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${index + 1}. ${user}`;
            listItem.addEventListener('click', function() {
                document.getElementById('unblockButton').classList.remove('hidden');
                document.getElementById('unblockButton').setAttribute('data-username', user);
            });
            blockedList.appendChild(listItem);
        });

        blockManager.classList.remove('hidden');
    });

    document.getElementById('unblockButton').addEventListener('click', function() {
        const username = this.getAttribute('data-username');
        let blockedUsers = getBlockedUsers();
        blockedUsers = blockedUsers.filter(user => user !== username);
        saveBlockedUsers(blockedUsers);
        alert(`${username}님이 차단 해제되었습니다.`);
        this.classList.add('hidden');
        document.getElementById('blockManager').classList.add('hidden');
    });

    document.getElementById('closeBlockManager').addEventListener('click', function() {
        document.getElementById('blockManager').classList.add('hidden');
    });

    document.getElementById('newMessagePopup').addEventListener('click', function() {
        scrollToBottom();
        this.classList.add('hidden');
    });

    // 아무 말 대잔치 제목 클릭 시 새로고침
    document.getElementById('mainTitle').addEventListener('click', function() {
        location.reload();
    });
});
