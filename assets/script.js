document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const inputForm = document.getElementById('input-form');
    const userInput = document.getElementById('user-input');
    const sendButton = inputForm.querySelector('button');
    const newChatBtn = document.getElementById('new-chat-btn');
    const clearChatBtn = document.getElementById('clear-chat-btn');
    const conversationHistoryList = document.getElementById('conversation-history-list');
    
    const SYSTEM_PROMPT = "You are an AI assistant named GPTsim. Acknowledge that you can make mistakes. You help users with their questions. Be concise and clear in your answers.";

    let conversations = [];
    let activeConversationIndex = -1;
    let jsonData = {};

    // Load JSON data
    const loadJSONData = async () => {
        try {
            const response = await fetch('psychology.json');
            jsonData = await response.json();
            console.log('JSON data loaded successfully');
        } catch (error) {
            console.error('Error loading JSON data:', error);
            // Fallback data if JSON file fails to load
            jsonData = {
                "explanation": [
                    "Psychology is the scientific study of the mind and behavior.",
                    "Major perspectives in psychology include biological, cognitive, behavioral, and psychodynamic approaches.",
                    "Psychologists study mental processes, brain functions, and behavior through various research methods.",
                    "Applied psychology includes clinical, counseling, educational, and organizational psychology."
                ],
                "qna": [
                    {
                        "patterns": ["what is psychology", "define psychology", "psychology meaning"],
                        "responses": [
                            "Psychology is the scientific study of the human mind and its functions, especially those affecting behavior in a given context.",
                            "Psychology encompasses the study of conscious and unconscious phenomena, including feelings and thoughts."
                        ]
                    },
                    {
                        "patterns": ["what is cognitive behavioral therapy", "what is cbt"],
                        "responses": [
                            "Cognitive Behavioral Therapy (CBT) is a psychotherapy treatment that helps patients understand how thoughts and feelings influence behaviors.",
                            "CBT is a short-term, goal-oriented therapy that focuses on changing patterns of thinking or behavior behind people's difficulties."
                        ]
                    }
                ],
                "quiz": [
                    {
                        "question": "Who founded psychoanalysis?",
                        "options": ["B.F. Skinner", "Sigmund Freud", "Carl Rogers", "Ivan Pavlov"],
                        "correct": 1
                    },
                    {
                        "question": "Which part of the brain is primarily responsible for memory?",
                        "options": ["Cerebellum", "Hippocampus", "Amygdala", "Frontal lobe"],
                        "correct": 1
                    }
                ]
            };
        }
    };

    const saveConversations = () => {
        localStorage.setItem('chatConversations', JSON.stringify(conversations));
        localStorage.setItem('activeChatIndex', activeConversationIndex);
    };

    const loadConversations = () => {
        conversations = JSON.parse(localStorage.getItem('chatConversations')) || [];
        activeConversationIndex = parseInt(localStorage.getItem('activeChatIndex')) || -1;
        
        if (conversations.length === 0) {
            startNewChat();
        } else {
            renderConversationList();
            loadConversation(activeConversationIndex);
        }
    };

    const renderConversationList = () => {
        conversationHistoryList.innerHTML = '';
        conversations.forEach((conv, index) => {
            const conversationItem = document.createElement('div');
            conversationItem.classList.add('conversation-item');
            if (index === activeConversationIndex) {
                conversationItem.classList.add('active');
            }
            // Use the first user message as the title, or a default
            const title = conv.messages[1]?.content || 'New Chat';
            
            const titleSpan = document.createElement('span');
            titleSpan.textContent = title.length > 30 ? title.substring(0, 30) + '...' : title;
            conversationItem.appendChild(titleSpan);

            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-btn');
            deleteBtn.innerHTML = '&times;';
            deleteBtn.onclick = (e) => {
                e.stopPropagation(); // prevent switching to this chat
                deleteConversation(index);
            };
            conversationItem.appendChild(deleteBtn);

            conversationItem.onclick = () => {
                loadConversation(index);
            };
            conversationHistoryList.appendChild(conversationItem);
        });
    };
    
    const loadConversation = (index) => {
        if (index < 0 || index >= conversations.length) {
            if (conversations.length > 0) {
               index = 0;
            } else {
               startNewChat();
               return;
            }
        };
        
        activeConversationIndex = index;
        chatBox.innerHTML = '';
        const conversation = conversations[activeConversationIndex];

        // Don't render the system prompt
        conversation.messages.slice(1).forEach(message => {
            addMessage(message.content, message.role === 'user' ? 'user' : 'ai');
        });
        
        if (conversation.messages.length <= 1) { // Only system prompt
             addMessage("Hello! How can I assist you today?", 'ai');
        }

        renderConversationList();
        saveConversations();
        userInput.focus();
    };

    const deleteConversation = (index) => {
        conversations.splice(index, 1);
        
        if (conversations.length === 0) {
            startNewChat();
        } else if (activeConversationIndex === index) {
            // if we deleted the active one, load the first one
            loadConversation(0);
        } else if (activeConversationIndex > index) {
            // Adjust active index if it was after the deleted one
            activeConversationIndex--;
            loadConversation(activeConversationIndex);
        } else {
             renderConversationList(); // just re-render
        }
        
        saveConversations();
    };

    const clearActiveChat = () => {
        if (activeConversationIndex >= 0 && conversations[activeConversationIndex]) {
            // Keep only the system prompt
            conversations[activeConversationIndex].messages = [
                conversations[activeConversationIndex].messages[0]
            ];
            loadConversation(activeConversationIndex);
        }
    };

    const startNewChat = () => {
        const newConversation = {
            messages: [{ role: "system", content: SYSTEM_PROMPT }]
        };
        conversations.push(newConversation);
        activeConversationIndex = conversations.length - 1;
        loadConversation(activeConversationIndex);
    };

    newChatBtn.addEventListener('click', startNewChat);
    clearChatBtn.addEventListener('click', clearActiveChat);

    const addMessage = (text, sender) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
        messageElement.textContent = text;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
        return messageElement;
    };

    const toggleLoading = (isLoading) => {
        sendButton.disabled = isLoading;
        userInput.disabled = isLoading;
        
        let indicator = chatBox.querySelector('.typing-indicator');
        if (isLoading) {
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.classList.add('typing-indicator');
                indicator.textContent = 'AI is typing...';
                chatBox.appendChild(indicator);
                chatBox.scrollTop = chatBox.scrollHeight;
            }
        } else {
            if (indicator) {
                indicator.remove();
            }
        }
    };

    // Function to find matching response from JSON data
    const findResponseFromJSON = (userMessage) => {
        const lowerMessage = userMessage.toLowerCase().trim();
        
        // Check Q&A section first
        for (const qna of jsonData.qna) {
            for (const pattern of qna.patterns) {
                if (lowerMessage.includes(pattern.toLowerCase())) {
                    // Return a random response from the matching Q&A
                    const randomIndex = Math.floor(Math.random() * qna.responses.length);
                    return qna.responses[randomIndex];
                }
            }
        }
        
        // If no Q&A match, check if it's a general psychology question
        if (lowerMessage.includes("psychology") || 
            lowerMessage.includes("psychologist") || 
            lowerMessage.includes("mental") ||
            lowerMessage.includes("behavior") ||
            lowerMessage.includes("therapy") ||
            lowerMessage.includes("cognitive") ||
            lowerMessage.includes("behavioral")) {
            
            // Return a random explanation
            const randomIndex = Math.floor(Math.random() * jsonData.explanation.length);
            return jsonData.explanation[randomIndex];
        }
        
        return null; // No match found
    };

    // Simulated AI response function
    const getAIResponse = async (userMessage) => {
        // First, try to find a response from JSON data
        const jsonResponse = findResponseFromJSON(userMessage);
        if (jsonResponse) {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));
            return jsonResponse;
        }
        
        // If no JSON match, use a fallback response
        await new Promise(resolve => setTimeout(resolve, 1000));
        return "I'm not sure about that. Could you please rephrase your question or ask about psychology topics?";
    };
    
    inputForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userMessage = userInput.value.trim();

        if (userMessage === '' || activeConversationIndex === -1) return;

        addMessage(userMessage, 'user');
        conversations[activeConversationIndex].messages.push({ role: 'user', content: userMessage });
        userInput.value = '';
        
        // If this was the first user message, update the conversation list title
        if (conversations[activeConversationIndex].messages.length === 2) {
            renderConversationList();
        }
        
        saveConversations();
        toggleLoading(true);

        try {
            const aiResponse = await getAIResponse(userMessage);
            conversations[activeConversationIndex].messages.push({ role: 'assistant', content: aiResponse });
            saveConversations();
            
            toggleLoading(false);
            addMessage(aiResponse, 'ai');

        } catch (error) {
            console.error('Error fetching AI response:', error);
            toggleLoading(false);
            addMessage('Sorry, something went wrong. Please try again.', 'ai');
        }
    });

    // Initialize the application
    const init = async () => {
        await loadJSONData();
        loadConversations();
    };

    // Start the application
    init();
});