import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

// Firebase 설정 코드 추가
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 무작위 닉네임 생성 함수
function generateRandomNickname() {
    const adjectives = ["Happy", "Brave", "Clever", "Witty", "Kind"];
    const animals = ["Lion", "Tiger", "Bear", "Eagle", "Shark"];
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
    return `${randomAdjective}${randomAnimal}${Math.floor(Math.random() * 1000)}`;
}

// 닉네임 저장 및 로드 함수
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

// 닉네임 변경 가능 여부 확인
function canChangeNickname() {
    const lastChanged = localStorage.getItem('nicknameLastChanged');
    if (!lastChanged) return true;
    const now = Date.now();
    return now - lastChanged >= 24 * 60 * 60 * 1000; // 24시간
}

// 금칙어 리스트
const forbiddenWords = [
    "병신", "시발", "ㅅㅂ", "ㅄ", 
    "미친놈", "미친년도", "멍청이", "바보", "바보야", 
    "X발", "또라이", "죽어", "광고", "홍보", 
    "구매", "팔아요"
];

// 금칙어를 하트 모양으로 대체하는 함수
function replaceForbiddenWords(message) {
    let filteredMessage = message;
    forbiddenWords.forEach(word => {
        const regex = new RegExp(word, 'gi');
        filteredMessage = filteredMessage.replace(regex, '❤️');
    });
    return filteredMessage;
}

// Firebase에 메시지 저장
function addMessageToFirebase(nickname, message, position) {
    const messageRef = ref(db, 'messages/' + Date.now());
    set(messageRef, {
        nickname: nickname,
        message: message,
        position: position
    });
}

// Firebase에서 메시지 불러오기
function loadMessagesFromFirebase() {
    const messagesRef = ref(db, 'messages');
    onValue(messagesRef, (snapshot) => {
        const data = snapshot.val();
        const chatbox = document.getElementById('chatbox');
        chatbox.innerHTML = ''; // 기존 메시지 초기화
        for (let id in data) {
            addMessage(data[id].nickname, data[id].message, data[id].position, true);
        }
        scrollToBottom(); // 마지막 메시지로 스크롤
    });
}

// 채팅 메시지를 추가하는 함수
function addMessage(nickname, message, position, fromFirebase = false) {
    const blockedUsers = getBlockedUsers();
    if (blockedUsers.includes(nickname)) return;

    const chatbox = document.getElementById('chatbox');
    const atBottom = chatbox.scrollTop + chatbox.clientHeight === chatbox.scrollHeight;

    const newMessage = document.createElement('div');
    newMessage.innerHTML = `<strong>${nickname}:</strong> ${message}`;
    newMessage.classList.add('message', position);

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

// 차단된 사용자 목록 로드 및 저장
function getBlockedUsers() {
    const blockedUsers = localStorage.getItem('blockedUsers');
    return blockedUsers ? JSON.parse(blockedUsers) : [];
}

function saveBlockedUsers(blockedUsers) {
    localStorage.setItem('blockedUsers', JSON.stringify(blockedUsers));
}

// 새로운 메시지 팝업 표시
function showNewMessagePopup() {
    const popup = document.getElementById('newMessagePopup');
    popup.classList.remove('hidden');
    setTimeout(() => {
        popup.classList.add('hidden');
    }, 3000);
}

// 최신 메시지로 스크롤
function scrollToBottom() {
    const chatbox = document.getElementById('chatbox');
    chatbox.scrollTop = chatbox.scrollHeight;
}

// 새로운 사용자가 들어왔을 때 인사하는 함수
function greetNewUser() {
    const nickname = getStoredNickname();
    const greetingMessage = `${nickname}님이 입장했습니다.`;
    addMessage("시스템", greetingMessage, 'left', true);
}

// 초기 설정
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

    // 전송 버튼 클릭 이벤트
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

    // 엔터 키를 눌렀을 때 전송
    document.getElementById('chatInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('sendButton').click();
        }
    });

    // 설정 버튼 클릭 이벤트
    document.getElementById('settingsButton').addEventListener('click', function() {
        const nicknameButton = document.getElementById('nicknameButton');
        const blockButton = document.getElementById('blockButton');
        nicknameButton.classList.toggle('hidden');
        blockButton.classList.toggle('hidden');
    });

    // 닉네임 변경 버튼 클릭 이벤트
    document.getElementById('nicknameButton').addEventListener('click', function() {
        if (canChangeNickname()) {
            document.getElementById('nicknamePopup').classList.remove('hidden');
        } else {
            alert('닉네임은 하루에 한 번만 변경할 수 있습니다.');
        }
    });

    // 닉네임 저장 버튼 클릭 이벤트
    document.getElementById('saveNicknameButton').addEventListener('click', function() {
        const newNickname = document.getElementById('newNickname').value.trim();
        if (newNickname) {
            setStoredNickname(newNickname);
            document.getElementById('nicknamePopup').classList.add('hidden');
            alert('닉네임이 변경되었습니다.');
        }
    });

    // 차단 관리 버튼 클릭 이벤트
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

    // 차단 해제 버튼 클릭 이벤트
    document.getElementById('unblockButton').addEventListener('click', function() {
        const username = this.getAttribute('data-username');
        let blockedUsers = getBlockedUsers();
        blockedUsers = blockedUsers.filter(user => user !== username);
        saveBlockedUsers(blockedUsers);
        alert(`${username}님이 차단 해제되었습니다.`);
        this.classList.add('hidden');
        document.getElementById('blockManager').classList.add('hidden');
    });

    // 차단 관리 창 닫기 버튼
    document.getElementById('closeBlockManager').addEventListener('click', function() {
        document.getElementById('blockManager').classList.add('hidden');
    });

    // 새로운 메시지 팝업 클릭 시 최신 메시지로 스크롤
    document.getElementById('newMessagePopup').addEventListener('click', function() {
        scrollToBottom();
        this.classList.add('hidden');
    });
});
