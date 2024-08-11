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

// 금칙어 리스트 (욕설, 스팸, 광고성 단어 등)
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
        const regex = new RegExp(word, 'gi');  // 대소문자 구분 없이 모든 금칙어 찾기
        filteredMessage = filteredMessage.replace(regex, '❤️');
    });
    return filteredMessage;
}

// 채팅 기록을 로컬 스토리지에 저장하는 함수
function saveChatHistory() {
    const chatbox = document.getElementById('chatbox');
    const messages = chatbox.innerHTML;
    localStorage.setItem('chatHistory', messages);
}

// 채팅 기록을 로컬 스토리지에서 불러오는 함수
function loadChatHistory() {
    const chatbox = document.getElementById('chatbox');
    const messages = localStorage.getItem('chatHistory');
    if (messages) {
        chatbox.innerHTML = messages;
    }
}

// 최신 메시지로 스크롤
function scrollToBottom() {
    const chatbox = document.getElementById('chatbox');
    chatbox.scrollTop = chatbox.scrollHeight;
}

// 새로운 메시지 팝업 표시
function showNewMessagePopup() {
    const popup = document.getElementById('newMessagePopup');
    popup.classList.remove('hidden');
    setTimeout(() => {
        popup.classList.add('hidden');
    }, 3000); // 3초 후에 팝업을 숨김
}

// 차단 팝업 표시
function showBlockPopup() {
    const blockPopup = document.getElementById('blockPopup');
    blockPopup.classList.remove('hidden');
    setTimeout(() => {
        blockPopup.classList.add('hidden');
    }, 3000); // 3초 후에 팝업을 숨김
}

// 차단된 사용자 목록 로드 및 저장
function getBlockedUsers() {
    const blockedUsers = localStorage.getItem('blockedUsers');
    return blockedUsers ? JSON.parse(blockedUsers) : [];
}

function saveBlockedUsers(blockedUsers) {
    localStorage.setItem('blockedUsers', JSON.stringify(blockedUsers));
}

// 채팅 메시지를 추가하는 함수
function addMessage(codename, message, position, isSystem = false) {
    const blockedUsers = getBlockedUsers();
    if (blockedUsers.includes(codename)) {
        return; // 차단된 사용자의 메시지는 표시하지 않음
    }

    const chatbox = document.getElementById('chatbox');
    const atBottom = chatbox.scrollTop + chatbox.clientHeight === chatbox.scrollHeight;

    const newMessage = document.createElement('div');
    newMessage.innerHTML = `<strong>${codename}:</strong> ${message}`;
    newMessage.classList.add('message', position);

    chatbox.appendChild(newMessage);

    // 메시지가 300개를 넘으면 가장 오래된 메시지를 삭제
    if (chatbox.children.length > 300) {
        chatbox.removeChild(chatbox.firstChild);
    }

    saveChatHistory(); // 새로운 메시지를 추가할 때마다 채팅 기록 저장

    // 사용자가 스크롤을 아래에 두고 있지 않으면 팝업을 표시 (시스템 메시지는 제외)
    if (!atBottom && !isSystem) {
        showNewMessagePopup();
    } else if (!isSystem) {
        scrollToBottom(); // 스크롤을 최신 메시지로 이동
    }
}

// 새로운 사용자가 들어왔을 때 인사하는 함수
function greetNewUser() {
    const nickname = getStoredNickname();
    const greetingMessage = `${nickname}님이 입장했습니다.`; // 시스템 메시지에서 "안녕하세요!" 제거
    addMessage("시스템", greetingMessage, 'left', true); // 시스템 메시지로 추가
}

// 사용자가 채팅을 전송할 때 처리하는 함수
document.getElementById('sendButton').addEventListener('click', function() {
    const nickname = getStoredNickname();
    const chatInput = document.getElementById('chatInput');
    
    if (chatInput.value.trim() !== "") {
        let message = chatInput.value;
        message = replaceForbiddenWords(message);  // 금칙어를 하트 모양으로 대체

        addMessage(nickname, message, 'right');

        chatInput.value = "";
    }
});

document.getElementById('chatInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('sendButton').click();
    }
});

// 페이지 로드 시 채팅 기록을 불러온 후 최신 메시지로 스크롤
document.addEventListener('DOMContentLoaded', function() {
    loadChatHistory();
    scrollToBottom(); // 페이지 로드 시 최신 메시지로 스크롤

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
        blockedList.innerHTML = ''; // 기존 목록 초기화

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
});

// 새로운 메시지 팝업을 클릭했을 때 최신 메시지로 스크롤
document.getElementById('newMessagePopup').addEventListener('click', function() {
    scrollToBottom();
    this.classList.add('hidden'); // 팝업을 숨김
});

// Example: Adding a message from another person with a random IP
function addIncomingMessage(message) {
    const nickname = getStoredNickname();
    message = replaceForbiddenWords(message);  // 금칙어를 하트 모양으로 대체
    
    addMessage(nickname, message, 'left');
}

// Example of incoming message
// addIncomingMessage("안녕하세요!"); // 이 메시지를 비활성화 또는 삭제하여 나타나지 않도록 함
