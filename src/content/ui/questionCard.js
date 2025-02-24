export class QuestionCard {
    constructor() {
        this.card = null;
        this.onAskQuestionCallback = null;
    }

    create(mainCardRect) {
        console.log('[ArticleAssistant] Creating question card');
        this.remove();

        const card = document.createElement('div');
        card.className = 'article-assistant-question-card';
        
        // Position below the main card
        card.style.cssText = `
            position: fixed !important;
            top: ${mainCardRect.bottom + 20}px !important;
            right: ${window.innerWidth - mainCardRect.right}px !important;
            width: ${mainCardRect.width}px !important;
            background-color: white !important;
            border-radius: 12px !important;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
            z-index: 9999 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        `;

        // Create header with close button
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 16px 20px !important;
            border-bottom: 1px solid #E5E5E5 !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            background-color: #F8F9FA !important;
            border-radius: 12px 12px 0 0 !important;
        `;

        const title = document.createElement('h3');
        title.textContent = 'Ask a Question About This Article';
        title.style.cssText = `
            margin: 0 !important;
            font-size: 16px !important;
            font-weight: 600 !important;
            color: #202124 !important;
        `;

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            background: none !important;
            border: none !important;
            font-size: 24px !important;
            color: #5F6368 !important;
            cursor: pointer !important;
            padding: 4px 8px !important;
            border-radius: 4px !important;
        `;
        closeBtn.onclick = () => this.remove();

        header.appendChild(title);
        header.appendChild(closeBtn);

        // Create content area
        const content = document.createElement('div');
        content.style.cssText = `
            padding: 20px !important;
        `;

        // Create textarea
        const textarea = document.createElement('textarea');
        textarea.placeholder = 'Type your question here...';
        textarea.style.cssText = `
            width: 100% !important;
            min-height: 100px !important;
            padding: 12px !important;
            border: 1px solid #E5E5E5 !important;
            border-radius: 8px !important;
            margin-bottom: 16px !important;
            font-family: inherit !important;
            font-size: 14px !important;
            resize: vertical !important;
            box-sizing: border-box !important;
        `;

        // Create submit button
        const submitBtn = document.createElement('button');
        submitBtn.textContent = 'Submit Question';
        submitBtn.style.cssText = `
            background-color: #1A73E8 !important;
            color: white !important;
            border: none !important;
            padding: 12px 24px !important;
            border-radius: 8px !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            cursor: pointer !important;
            transition: background-color 0.2s !important;
        `;

        submitBtn.onmouseover = () => {
            submitBtn.style.backgroundColor = '#1557B0 !important';
        };

        submitBtn.onmouseout = () => {
            submitBtn.style.backgroundColor = '#1A73E8 !important';
        };

        submitBtn.onclick = () => {
            const question = textarea.value.trim();
            if (question && this.onAskQuestionCallback) {
                submitBtn.textContent = 'Processing...';
                submitBtn.disabled = true;
                
                this.onAskQuestionCallback(question)
                    .finally(() => {
                        submitBtn.textContent = 'Submit Question';
                        submitBtn.disabled = false;
                        textarea.value = '';
                        this.remove();
                    });
            }
        };

        // Assemble the card
        content.appendChild(textarea);
        content.appendChild(submitBtn);
        card.appendChild(header);
        card.appendChild(content);

        document.body.appendChild(card);
        this.card = card;

        // Focus the textarea
        setTimeout(() => textarea.focus(), 100);
    }

    remove() {
        if (this.card && this.card.parentNode) {
            this.card.parentNode.removeChild(this.card);
        }
        this.card = null;
    }

    setAskQuestionHandler(callback) {
        this.onAskQuestionCallback = callback;
    }
} 