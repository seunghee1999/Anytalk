// 금칙어 리스트 (욕설, 스팸, 광고성 단어 등)
const forbiddenWords = [
    "병신", "시발", "ㅅㅂ", "ㅄ", 
    "미친놈", "미친년", "멍청이", "또라이", "죽어", "광고", "홍보", 
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

// 간단한 해시 함수 (예: DJB2 알고리즘)
function hashString(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return hash;
}

// 임의로 사용자 코드 네임을 생성하는 함수
function generateCodename(ip) {
    const hash = hashString(ip);
    const codename = "User" + Math.abs(hash % 10000); // "User"와 숫자로 구성된 코드 네임 생성
    return codename;
}

// 임의로 IP 주소를 가져오는 함수 (예시)
function getUserIP() {
    return "192.168.1." + Math.floor(Math.random() * 255);
}

document.getElementById('sendButton').addEventListener('click', function() {
    const ip = getUserIP();
    const codename = generateCodename(ip);
    const chatInput = document.getElementById('chatInput');
    const chatbox = document.getElementById('chatbox');

    if (chatInput.value.trim() !== "") {
        let message = chatInput.value;
        message = replaceForbiddenWords(message);  // 금칙어를 하트 모양으로 대체

        const newMessage = document.createElement('div');
        newMessage.innerHTML = `<strong>${codename}:</strong> ${message}`;
        newMessage.classList.add('message', 'right');

        chatbox.appendChild(newMessage);
        chatbox.scrollTop = chatbox.scrollHeight; // 새 메시지가 추가되면 자동으로 스크롤

        chatInput.value = "";
    }
});

document.getElementById('chatInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('sendButton').click();
    }
});

// Example: Adding a message from another person with a random IP
function addIncomingMessage(message) {
    const ip = getUserIP();
    const codename = generateCodename(ip);
    const chatbox = document.getElementById('chatbox');
    
    message = replaceForbiddenWords(message);  // 금칙어를 하트 모양으로 대체
    
    const newMessage = document.createElement('div');
    newMessage.innerHTML = `<strong>${codename}:</strong> ${message}`;
    newMessage.classList.add('message', 'left');

    chatbox.appendChild(newMessage);
    chatbox.scrollTop = chatbox.scrollHeight; // 새 메시지가 추가되면 자동으로 스크롤
}

// Example of incoming message
addIncomingMessage("안녕하세요!");
