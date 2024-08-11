document.getElementById('sendButton').addEventListener('click', function() {
    let chatInput = document.getElementById('chatInput');
    let chatbox = document.getElementById('chatbox');
    
    if (chatInput.value.trim() !== "") {
        let newMessage = document.createElement('div');
        newMessage.textContent = chatInput.value;
        newMessage.style.border = '1px solid #000';
        newMessage.style.padding = '10px';
        newMessage.style.margin = '10px 0';
        newMessage.style.borderRadius = '5px';
        newMessage.style.backgroundColor = '#e0e0e0';
        newMessage.style.textAlign = 'left';

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
